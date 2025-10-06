
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

    const { action, user_id } = await req.json()

    if (action !== 'process_daily_reward') {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid action' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Validate user_id is provided
    if (!user_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'User ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('🎯 Daily rewards request for user:', user_id)

    const today = new Date().toISOString().split('T')[0]

    // Check if user already received rewards today using admin client
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('last_daily_reward_date, pawclub_member, paw_dollars, paw_points, care_badge_days, pawclub_litter_licenses_granted_month')
      .eq('id', user_id)
      .single()

    if (profileError) {
      console.error('Profile fetch error:', profileError)
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch user profile' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (profile.last_daily_reward_date === today) {
      return new Response(
        JSON.stringify({ success: false, message: 'Already claimed today' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Calculate rewards based on membership
    const pawPointsReward = 1000
    const pawDollarsReward = profile.pawclub_member ? 10 : 0
    const newCareBadgeDays = (profile.care_badge_days || 0) + 1
    
    // Check for PawClub litter license grants on subscription start/renewal days
    let litterLicensesGranted = 0
    let litterLicenseMessage = ''
    
    if (profile.pawclub_member) {
      // Get subscription info to check for start/renewal dates
      const { data: subscription } = await supabaseAdmin
        .from('subscribers')
        .select('created_at, subscription_end, last_license_grant_period_end')
        .eq('user_id', user_id)
        .eq('subscribed', true)
        .single()
      
      if (subscription) {
        const todayDate = new Date(today + 'T00:00:00Z')
        const currentMonth = today.substring(0, 7) // YYYY-MM format
        
        // Check if licenses already granted this month
        const alreadyGrantedThisMonth = profile.pawclub_litter_licenses_granted_month === currentMonth
        
        if (!alreadyGrantedThisMonth) {
          let shouldGrantLicenses = false
          
          // Check if today is subscription start day (same day as created_at)
          const subscriptionStartDate = new Date(subscription.created_at).toISOString().split('T')[0]
          if (today === subscriptionStartDate) {
            shouldGrantLicenses = true
            console.log('🎁 Granting litter licenses: subscription start day')
          }
          
          // Check if today is a renewal day (subscription_end date)
          if (subscription.subscription_end) {
            const renewalDate = new Date(subscription.subscription_end).toISOString().split('T')[0]
            if (today === renewalDate) {
              shouldGrantLicenses = true
              console.log('🎁 Granting litter licenses: subscription renewal day')
            }
          }
          
          if (shouldGrantLicenses) {
            // Grant 2 litter licenses
            for (let i = 0; i < 2; i++) {
              await supabaseAdmin.from('litter_licenses').insert({
                user_id: user_id,
                used: false
              })
            }
            litterLicensesGranted = 2
            litterLicenseMessage = ', and 2 Litter Licenses (PawClub renewal bonus)'
            
            // Update profile to track that licenses were granted this month
            await supabaseAdmin
              .from('profiles')
              .update({ pawclub_litter_licenses_granted_month: currentMonth })
              .eq('id', user_id)
            
            console.log('✨ Granted 2 litter licenses to PawClub member')
          }
        }
      }
    }

    // Update user profile with rewards using admin client
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        paw_points: profile.paw_points + pawPointsReward,
        paw_dollars: profile.paw_dollars + pawDollarsReward,
        care_badge_days: newCareBadgeDays,
        last_daily_reward_date: today
      })
      .eq('id', user_id)

    if (updateError) {
      console.error('Reward update error:', updateError)
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to process daily rewards' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Record paw points transaction
    if (pawPointsReward > 0) {
      await supabaseAdmin.from('paw_dollar_transactions').insert({
        user_id: user_id,
        amount: pawPointsReward,
        type: 'daily_reward',
        description: `Daily reward - ${pawPointsReward} Paw Points`
      })
    }

    // Record paw dollars transaction
    if (pawDollarsReward > 0) {
      await supabaseAdmin.from('paw_dollar_transactions').insert({
        user_id: user_id,
        amount: pawDollarsReward,
        type: 'daily_reward',
        description: `Daily reward - ${pawDollarsReward} Paw Dollars (PawClub bonus)`
      })
    }

    const rewardMessage = profile.pawclub_member 
      ? `Daily rewards claimed! You received ${pawPointsReward} Paw Points, ${pawDollarsReward} Paw Dollars (PawClub bonus), +1 Care Badge day${litterLicenseMessage}!`
      : `Daily rewards claimed! You received ${pawPointsReward} Paw Points and +1 Care Badge day!`

    console.log('✅ Daily rewards processed successfully for user:', user_id)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: rewardMessage,
        paw_points_awarded: pawPointsReward,
        paw_dollars_awarded: pawDollarsReward,
        care_badge_days_awarded: 1,
        litter_licenses_awarded: litterLicensesGranted
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Daily rewards error:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
