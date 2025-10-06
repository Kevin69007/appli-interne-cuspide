import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create supabase client with service role for admin operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const { user_id, license_id } = await req.json()

    if (!user_id || !license_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'User ID and License ID are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('🎫 Selling litter license request - User:', user_id, 'License:', license_id)

    // Start transaction by locking the license and user profile
    const { data: license, error: licenseError } = await supabaseAdmin
      .from('litter_licenses')
      .select('*')
      .eq('id', license_id)
      .eq('user_id', user_id)
      .eq('used', false)
      .single()

    if (licenseError || !license) {
      console.error('License fetch error:', licenseError)
      return new Response(
        JSON.stringify({ success: false, error: 'License not found or already used' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('paw_dollars')
      .eq('id', user_id)
      .single()

    if (profileError || !profile) {
      console.error('Profile fetch error:', profileError)
      return new Response(
        JSON.stringify({ success: false, error: 'User profile not found' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Delete the license (remove from inventory)
    const { error: deleteError } = await supabaseAdmin
      .from('litter_licenses')
      .delete()
      .eq('id', license_id)
      .eq('user_id', user_id)

    if (deleteError) {
      console.error('License deletion error:', deleteError)
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to sell license' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Add 50 paw dollars to user
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        paw_dollars: profile.paw_dollars + 50
      })
      .eq('id', user_id)

    if (updateError) {
      console.error('Profile update error:', updateError)
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to credit paw dollars' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Record transaction
    await supabaseAdmin.from('paw_dollar_transactions').insert({
      user_id: user_id,
      amount: 50,
      type: 'license_sale',
      description: 'Sold litter license for 50 Paw Dollars'
    })

    console.log('✅ Litter license sold successfully for user:', user_id)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Litter license sold successfully! You received 50 Paw Dollars.',
        paw_dollars_earned: 50
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Sell litter license error:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})