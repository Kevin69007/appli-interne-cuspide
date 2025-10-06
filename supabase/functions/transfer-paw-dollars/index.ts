
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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { sender_id, recipient_id, amount } = await req.json()

    // Validate inputs
    if (!sender_id || !recipient_id || !amount || amount <= 0) {
      throw new Error('Invalid input parameters')
    }

    if (amount > 10000) {
      throw new Error('Amount exceeds maximum limit of 10,000 PD')
    }

    // Use a database transaction for atomic operations
    const { data, error } = await supabaseClient.rpc('execute_paw_dollar_transfer', {
      p_sender_id: sender_id,
      p_recipient_id: recipient_id,
      p_amount: amount
    })

    if (error) {
      throw error
    }

    return new Response(
      JSON.stringify(data),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
