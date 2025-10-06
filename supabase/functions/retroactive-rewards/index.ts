
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const body = await req.json()

    const { start_date, end_date } = body;

    if (!start_date || !end_date) {
      throw new Error('start_date and end_date are required');
    }

    console.log(`🔄 Processing retroactive rewards from ${start_date} to ${end_date}`);

    // Get all users who might need retroactive rewards
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, username, paw_points, paw_dollars, pawclub_member, last_xp_date, care_badge_days')
      .limit(2000);

    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      throw usersError;
    }

    let totalRewardedUsers = 0;
    let totalDaysProcessed = 0;
    const errors: any[] = [];

    // Calculate date range
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    const dates = [];
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      dates.push(new Date(d).toISOString().split('T')[0]);
    }

    console.log(`📅 Processing ${dates.length} dates for ${users?.length || 0} users`);

    // Process each date
    for (const dateStr of dates) {
      let dailyRewardedCount = 0;
      
      console.log(`📆 Processing date: ${dateStr}`);

      for (const user of users || []) {
        try {
          // Skip if user already has rewards for this date or later
          if (user.last_xp_date && user.last_xp_date >= dateStr) {
            continue;
          }

          const pawPointsReward = 1000;
          const pawDollarsReward = user.pawclub_member ? 10 : 0;

          // FIXED: Only increment care badge, don't reset to 1
          const newCareBadgeDays = (user.care_badge_days || 0) + 1;

          // Update user - but only if they haven't been rewarded for this date
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              paw_points: (user.paw_points || 0) + pawPointsReward,
              paw_dollars: user.pawclub_member ? (user.paw_dollars || 0) + pawDollarsReward : user.paw_dollars,
              last_xp_date: dateStr,
              last_care_date: dateStr,
              care_badge_days: newCareBadgeDays // Increment, don't reset
            })
            .eq('id', user.id)
            .eq('last_xp_date', user.last_xp_date); // Ensure no concurrent updates

          if (updateError) {
            console.error(`❌ Error updating user ${user.username || user.id} for ${dateStr}:`, updateError);
            errors.push({ user_id: user.id, date: dateStr, error: updateError.message });
            continue;
          }

          // Record transactions
          try {
            await supabase
              .from("pet_transactions")
              .insert({
                user_id: user.id,
                pet_id: user.id,
                paw_points: pawPointsReward,
                description: `Retroactive daily reward - ${dateStr} - 1000 Paw Points`
              });

            if (user.pawclub_member && pawDollarsReward > 0) {
              await supabase
                .from("paw_dollar_transactions")
                .insert({
                  user_id: user.id,
                  amount: pawDollarsReward,
                  type: 'daily_bonus',
                  description: `Retroactive PawClub daily bonus - ${dateStr} - ${pawDollarsReward} Paw Dollars`,
                  status: 'completed'
                });
            }
          } catch (transactionError) {
            console.error(`⚠️ Transaction logging failed for user ${user.username || user.id} on ${dateStr}:`, transactionError);
          }

          // Update the user object for next iteration
          user.paw_points = (user.paw_points || 0) + pawPointsReward;
          user.paw_dollars = user.pawclub_member ? (user.paw_dollars || 0) + pawDollarsReward : user.paw_dollars;
          user.last_xp_date = dateStr;
          user.care_badge_days = newCareBadgeDays; // Update for next iteration

          dailyRewardedCount++;

        } catch (error) {
          console.error(`❌ Exception processing user ${user.username || user.id} for ${dateStr}:`, error);
          errors.push({ user_id: user.id, date: dateStr, error: error instanceof Error ? error.message : String(error) });
        }
      }

      console.log(`✅ Completed ${dateStr}: ${dailyRewardedCount} users rewarded`);
      totalRewardedUsers += dailyRewardedCount;
      totalDaysProcessed++;
    }

    console.log(`🎉 Retroactive rewards complete: ${totalRewardedUsers} total rewards across ${totalDaysProcessed} days`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Retroactive rewards processed: ${totalRewardedUsers} total rewards across ${totalDaysProcessed} days`,
        details: {
          total_rewards_given: totalRewardedUsers,
          days_processed: totalDaysProcessed,
          errors_count: errors.length,
          errors: errors.slice(0, 10) // Limit error details
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('❌ Retroactive rewards error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
