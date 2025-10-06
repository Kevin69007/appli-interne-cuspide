
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { breeding_pair_id, user_id } = await req.json()

    if (!breeding_pair_id || !user_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required parameters' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`🍼 Starting baby collection for breeding pair: ${breeding_pair_id}, user: ${user_id}`)

    // Step 1: Lock and verify breeding pair
    const { data: breedingPair, error: pairError } = await supabaseClient
      .from('breeding_pairs')
      .select('*')
      .eq('id', breeding_pair_id)
      .eq('user_id', user_id)
      .eq('is_born', true)
      .single()

    if (pairError || !breedingPair) {
      console.error('❌ Breeding pair not found:', pairError)
      return new Response(
        JSON.stringify({ success: false, error: 'Breeding pair not found or not ready for collection' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Step 2: Check if babies exist
    const { data: babies, error: babiesError } = await supabaseClient
      .from('litter_babies')
      .select('*')
      .eq('breeding_pair_id', breeding_pair_id)

    if (babiesError) {
      console.error('❌ Error fetching babies:', babiesError)
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch babies' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!babies || babies.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'No babies found for this breeding pair' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`👶 Found ${babies.length} babies to collect`)

    // Step 3: Check weaning status
    const now = new Date()
    const weanDate = new Date(breedingPair.wean_date)
    const isPastWeanDate = now >= weanDate

    // Auto-wean if past due date
    if (isPastWeanDate && !breedingPair.is_weaned) {
      await supabaseClient
        .from('breeding_pairs')
        .update({ is_weaned: true })
        .eq('id', breeding_pair_id)
      
      breedingPair.is_weaned = true
    }

    // Check if ready for collection
    if (!breedingPair.is_weaned && !isPastWeanDate && !breedingPair.is_completed) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Babies are still weaning. Please wait until ${weanDate.toDateString()}` 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Step 4: Get all pets for matching
    const { data: allPets, error: petsError } = await supabaseClient
      .from('pets')
      .select('id, name')

    if (petsError || !allPets) {
      console.error('❌ Error fetching pets:', petsError)
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch pet types' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Helper function to find matching pet ID
    const findMatchingPetId = (breed: string) => {
      // Try exact match first
      let match = allPets.find(pet => pet.name.toLowerCase() === breed.toLowerCase())
      if (match) return match.id

      // Try partial match
      const firstWord = breed.split(' ')[0]
      match = allPets.find(pet => pet.name.toLowerCase().includes(firstWord.toLowerCase()))
      if (match) return match.id

      // Fallback to first available pet
      return allPets[0]?.id
    }

    // Step 5: Transfer babies to user_pets with GENETIC GENDER ENFORCEMENT
    const userPetsInserts = babies.map((baby) => {
      const petId = findMatchingPetId(baby.breed)
      
      // CRITICAL FIX: Enforce genetic rules - Torties MUST be female
      let normalizedGender;
      if (baby.breed && baby.breed.toLowerCase() === 'tortie') {
        normalizedGender = 'female'; // ALWAYS female for genetic accuracy
        console.log(`🧬 GENETIC ENFORCEMENT: ${baby.pet_name} (Tortie) set to female for X-linked inheritance`)
      } else {
        normalizedGender = baby.gender.toLowerCase();
      }
      
      // ADDITIONAL SAFETY CHECK: Prevent any male Torties from slipping through
      if (baby.breed && baby.breed.toLowerCase() === 'tortie' && normalizedGender !== 'female') {
        console.error(`🚨 CRITICAL GENETIC ERROR: Male Tortie detected! Forcing to female: ${baby.pet_name}`)
        normalizedGender = 'female';
      }
      
      return {
        user_id: user_id,
        pet_id: petId,
        pet_name: baby.pet_name,
        breed: baby.breed,
        gender: normalizedGender, // Now using genetically enforced gender
        friendliness: baby.friendliness,
        playfulness: baby.playfulness,
        energy: baby.energy,
        loyalty: baby.loyalty,
        curiosity: baby.curiosity,
        birthday: baby.birthday,
        parent1_id: breedingPair.parent1_id,
        parent2_id: breedingPair.parent2_id,
        description: baby.description || '',
        hunger: 100,
        water: 100,
        adopted_at: new Date().toISOString()
      }
    })

    // Insert babies into user_pets
    const { error: insertError } = await supabaseClient
      .from('user_pets')
      .insert(userPetsInserts)

    if (insertError) {
      console.error('❌ Error inserting babies:', insertError)
      return new Response(
        JSON.stringify({ success: false, error: `Failed to transfer babies: ${insertError.message}` }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('✅ All babies transferred with genetically accurate genders (no male Torties)')

    // Step 6: Clean up litter babies
    const { error: deleteError } = await supabaseClient
      .from('litter_babies')
      .delete()
      .eq('breeding_pair_id', breeding_pair_id)

    if (deleteError) {
      console.error('❌ Error deleting babies:', deleteError)
      // Don't fail the whole operation for this
    }

    // Step 7: Mark breeding pair as completed
    const { error: completeError } = await supabaseClient
      .from('breeding_pairs')
      .update({ is_completed: true })
      .eq('id', breeding_pair_id)

    if (completeError) {
      console.error('❌ Error completing breeding pair:', completeError)
      // Don't fail the whole operation for this
    }

    // Step 8: Release parents from breeding
    const { error: releaseError } = await supabaseClient
      .from('user_pets')
      .update({ 
        is_for_breeding: false,
        breeding_cooldown_until: null
      })
      .in('id', [breedingPair.parent1_id, breedingPair.parent2_id])

    if (releaseError) {
      console.error('❌ Error releasing parents:', releaseError)
      // Don't fail the whole operation for this
    }

    console.log(`✅ Successfully collected ${babies.length} babies with genetic accuracy enforced (no male Torties)`)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully collected ${babies.length} babies (genetic rules enforced - no male Torties)`,
        babies_transferred: babies.length
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('💥 Fatal error in collect-breeding-babies:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Collection failed: ${errorMessage}` 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
