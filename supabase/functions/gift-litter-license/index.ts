import { corsHeaders } from '../_shared/cors.ts'

console.log("Gift Litter License function loaded")

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  console.log(`🎁 ${req.method} request received at ${new Date().toISOString()}`)

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ success: false, error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const { gifter_id, recipient_id } = await req.json()

    console.log(`🎁 Processing litter license gift from ${gifter_id} to ${recipient_id}`)

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration')
    }

    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify both users exist
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username')
      .in('id', [gifter_id, recipient_id])

    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError)
      throw new Error('Failed to verify users')
    }

    if (!profiles || profiles.length !== 2) {
      console.error('❌ One or both users not found')
      throw new Error('One or both users not found')
    }

    const gifter = profiles.find(p => p.id === gifter_id)
    const recipient = profiles.find(p => p.id === recipient_id)

    console.log(`🎁 Gift from ${gifter?.username} to ${recipient?.username}`)

    // Check if gifter has any unused litter licenses
    const { data: gifterLicenses, error: gifterLicensesError } = await supabase
      .from('litter_licenses')
      .select('id')
      .eq('user_id', gifter_id)
      .eq('used', false)
      .limit(1)

    if (gifterLicensesError) {
      console.error('❌ Error checking gifter licenses:', gifterLicensesError)
      throw new Error('Failed to check litter licenses')
    }

    if (!gifterLicenses || gifterLicenses.length === 0) {
      console.log('❌ Gifter has no unused litter licenses')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'You do not have any unused litter licenses to gift' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const licenseToGift = gifterLicenses[0]

    console.log(`🎁 Transferring license ${licenseToGift.id}`)

    // Transfer the license by updating its user_id
    const { error: transferError } = await supabase
      .from('litter_licenses')
      .update({ user_id: recipient_id })
      .eq('id', licenseToGift.id)

    if (transferError) {
      console.error('❌ Error transferring license:', transferError)
      throw new Error('Failed to transfer litter license')
    }

    // Record the transaction for both users
    const transactions = [
      {
        user_id: gifter_id,
        type: 'gift_sent',
        amount: 0,
        description: `Gifted litter license to ${recipient?.username}`
      },
      {
        user_id: recipient_id,
        type: 'gift_received',
        amount: 0,
        description: `Received litter license gift from ${gifter?.username}`
      }
    ]

    const { error: transactionError } = await supabase
      .from('paw_dollar_transactions')
      .insert(transactions)

    if (transactionError) {
      console.error('❌ Error recording transactions:', transactionError)
      // Don't fail the whole operation for transaction recording errors
    }

    console.log(`✅ Successfully gifted litter license from ${gifter?.username} to ${recipient?.username}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully gifted litter license to ${recipient?.username}!`
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('❌ Error in gift-litter-license function:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: (error instanceof Error ? error.message : String(error)) || 'Internal server error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})