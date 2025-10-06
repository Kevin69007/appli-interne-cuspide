
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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { username } = await req.json()

    console.log(`🔧 Cleaning up breeding issues for user: ${username}`)

    // Find user by username
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('id, username')
      .eq('username', username)
      .single()

    if (profileError || !profile) {
      console.error(`❌ User not found: ${username}`)
      return new Response(
        JSON.stringify({ success: false, error: 'User not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`✅ Found user: ${profile.username} (${profile.id})`)

    // Find all breeding pairs for this user
    const { data: breedingPairs, error: breedingError } = await supabaseClient
      .from('breeding_pairs')
      .select('*')
      .eq('user_id', profile.id)
      .eq('is_completed', false)

    if (breedingError) {
      console.error(`❌ Error fetching breeding pairs:`, breedingError)
      return new Response(
        JSON.stringify({ success: false, error: 'Error fetching breeding pairs' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`🔍 Found ${breedingPairs?.length || 0} active breeding pairs`)

    if (!breedingPairs || breedingPairs.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No active breeding pairs found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Mark all breeding pairs as completed
    const { error: completeError } = await supabaseClient
      .from('breeding_pairs')
      .update({ is_completed: true })
      .eq('user_id', profile.id)
      .eq('is_completed', false)

    if (completeError) {
      console.error(`❌ Error completing breeding pairs:`, completeError)
      return new Response(
        JSON.stringify({ success: false, error: 'Error completing breeding pairs' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Release all pets from breeding status
    const petIds = breedingPairs.flatMap(pair => [pair.parent1_id, pair.parent2_id]).filter(Boolean)
    
    if (petIds.length > 0) {
      const { error: releaseError } = await supabaseClient
        .from('user_pets')
        .update({
          is_for_breeding: false,
          breeding_cooldown_until: null
        })
        .in('id', petIds)

      if (releaseError) {
        console.error(`❌ Error releasing pets:`, releaseError)
        return new Response(
          JSON.stringify({ success: false, error: 'Error releasing pets from breeding' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    console.log(`✅ Successfully cleaned up ${breedingPairs.length} breeding pairs and released ${petIds.length} pets`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Cleaned up ${breedingPairs.length} breeding pairs and released ${petIds.length} pets from breeding status`,
        pairsCompleted: breedingPairs.length,
        petsReleased: petIds.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Error in cleanup-breeding function:', error)
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
