
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
    console.log('🚀 Automated daily rewards started at:', new Date().toISOString())
    
    // Create supabase client with service role for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const today = new Date().toISOString().split('T')[0]
    let processedCount = 0
    let rewardedCount = 0
    let errorCount = 0
    const errors: string[] = []

    // Create log entry
    const { data: logEntry, error: logError } = await supabase
      .from('daily_rewards_log')
      .insert({
        execution_date: today,
        status: 'running',
        trigger_source: 'automated_cron',
        users_processed: 0,
        users_rewarded: 0,
        errors_count: 0
      })
      .select()
      .single()

    if (logError) {
      console.error('Failed to create log entry:', logError)
      throw new Error('Failed to create log entry')
    }

    // Get all users who haven't received rewards today
    const { data: eligibleUsers, error: usersError } = await supabase
      .from('profiles')
      .select('id, pawclub_member, paw_points, paw_dollars, care_badge_days, last_daily_reward_date, username')
      .or(`last_daily_reward_date.is.null,last_daily_reward_date.lt.${today}`)
      .eq('is_banned', false)

    if (usersError) {
      console.error('Failed to fetch eligible users:', usersError)
      throw new Error('Failed to fetch eligible users')
    }

    console.log(`Found ${eligibleUsers?.length || 0} eligible users for daily rewards`)

    // Process each eligible user
    for (const user of eligibleUsers || []) {
      try {
        processedCount++
        
        // Calculate rewards
        const pawPointsReward = 1000
        const pawDollarsReward = user.pawclub_member ? 10 : 0
        const newCareBadgeDays = (user.care_badge_days || 0) + 1
        
        // Update user profile with rewards
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            paw_points: user.paw_points + pawPointsReward,
            paw_dollars: user.paw_dollars + pawDollarsReward,
            care_badge_days: newCareBadgeDays,
            last_daily_reward_date: today
          })
          .eq('id', user.id)

        if (updateError) {
          console.error(`Failed to update user ${user.username}:`, updateError)
          errorCount++
          errors.push(`User ${user.username}: ${updateError.message}`)
          continue
        }

        // Record paw points transaction
        await supabase.from('paw_dollar_transactions').insert({
          user_id: user.id,
          amount: pawPointsReward,
          type: 'daily_reward',
          description: `Daily reward - ${pawPointsReward} Paw Points`
        })

        // Record paw dollars transaction if applicable
        if (pawDollarsReward > 0) {
          await supabase.from('paw_dollar_transactions').insert({
            user_id: user.id,
            amount: pawDollarsReward,
            type: 'daily_reward',
            description: `Daily reward - ${pawDollarsReward} Paw Dollars (PawClub bonus)`
          })
        }

        rewardedCount++
        console.log(`✅ Rewarded ${user.username}: ${pawPointsReward} points${pawDollarsReward > 0 ? ` + ${pawDollarsReward} dollars` : ''} + 1 care badge day`)

      } catch (userError) {
        const errorMessage = userError instanceof Error ? userError.message : String(userError);
        console.error(`Error processing user ${user.username}:`, userError)
        errorCount++
        errors.push(`User ${user.username}: ${errorMessage}`)
      }
    }

    // Update log entry with results
    await supabase
      .from('daily_rewards_log')
      .update({
        status: 'completed',
        users_processed: processedCount,
        users_rewarded: rewardedCount,
        errors_count: errorCount,
        error_details: errorCount > 0 ? { errors } : null,
        completed_at: new Date().toISOString()
      })
      .eq('id', logEntry.id)

    console.log(`🎉 Daily rewards completed: ${rewardedCount}/${processedCount} users rewarded, ${errorCount} errors`)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Automated daily rewards completed',
        data: {
          users_processed: processedCount,
          users_rewarded: rewardedCount,
          errors_count: errorCount,
          execution_date: today
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('❌ Automated daily rewards failed:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
