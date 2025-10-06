import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role key for admin operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('Starting auto-wean process...')

    // Get current timestamp for precise 12:00 AM weaning
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()) // Today at 12:00 AM
    
    // Find all breeding pairs that:
    // 1. Are born (is_born = true)
    // 2. Not already weaned (is_weaned = false)  
    // 3. Have reached their wean date (wean_date <= today at 12:00 AM)
    const { data: breedingPairs, error: fetchError } = await supabase
      .from('breeding_pairs')
      .select('id, wean_date, parent1_name, parent2_name, user_id')
      .eq('is_born', true)
      .eq('is_weaned', false)
      .lte('wean_date', today.toISOString())

    if (fetchError) {
      console.error('Error fetching breeding pairs:', fetchError)
      throw fetchError
    }

    if (!breedingPairs || breedingPairs.length === 0) {
      console.log('No litters ready to wean')
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No litters ready to wean',
          weaned_count: 0 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    console.log(`Found ${breedingPairs.length} litters ready to wean`)

    // Process each breeding pair for weaning
    const weanResults = []
    let successCount = 0
    let errorCount = 0

    for (const pair of breedingPairs) {
      try {
        // Set the exact wean time to 12:00 AM of the original wean date
        const originalWeanDate = new Date(pair.wean_date)
        const exactWeanTime = new Date(
          originalWeanDate.getFullYear(),
          originalWeanDate.getMonth(),
          originalWeanDate.getDate(),
          0, 0, 0, 0 // 12:00:00 AM exactly
        )

        // Update the breeding pair to mark as weaned
        const { error: updateError } = await supabase
          .from('breeding_pairs')
          .update({
            is_weaned: true,
            wean_date: exactWeanTime.toISOString()
          })
          .eq('id', pair.id)

        if (updateError) {
          console.error(`Error weaning litter ${pair.id}:`, updateError)
          errorCount++
          weanResults.push({
            breeding_pair_id: pair.id,
            success: false,
            error: updateError.message,
            parents: `${pair.parent1_name} x ${pair.parent2_name}`
          })
        } else {
          console.log(`Successfully weaned litter ${pair.id} (${pair.parent1_name} x ${pair.parent2_name})`)
          successCount++
          weanResults.push({
            breeding_pair_id: pair.id,
            success: true,
            wean_time: exactWeanTime.toISOString(),
            parents: `${pair.parent1_name} x ${pair.parent2_name}`
          })
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Unexpected error weaning litter ${pair.id}:`, error)
        errorCount++
        weanResults.push({
          breeding_pair_id: pair.id,
          success: false,
          error: errorMessage,
          parents: `${pair.parent1_name} x ${pair.parent2_name}`
        })
      }
    }

    const summary = {
      success: true,
      total_processed: breedingPairs.length,
      successfully_weaned: successCount,
      errors: errorCount,
      timestamp: now.toISOString(),
      results: weanResults
    }

    console.log('Auto-wean process completed:', summary)

    return new Response(
      JSON.stringify(summary),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Auto-wean function error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})