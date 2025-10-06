
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
    const today = new Date().toISOString().split('T')[0]

    console.log('🔍 Testing daily rewards system for date:', today);

    // Check current system status
    const { data: statusResult, error: statusError } = await supabase
      .rpc('check_daily_rewards_status', { check_date: today })

    if (statusError) {
      console.error('❌ Error checking status:', statusError);
      throw statusError;
    }

    // Get recent log entries
    const { data: recentLogs, error: logsError } = await supabase
      .from('daily_rewards_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (logsError) {
      console.error('❌ Error fetching logs:', logsError);
    }

    // Check cron job status
    const { data: cronJobs, error: cronError } = await supabase
      .from('cron.job')
      .select('*')
      .eq('jobname', 'daily-paw-points-reward');

    if (cronError) {
      console.error('❌ Error checking cron jobs:', cronError);
    }

    // Sample a few users to check their status
    const { data: sampleUsers, error: usersError } = await supabase
      .from('profiles')
      .select('id, username, last_xp_date, paw_points, paw_dollars, pawclub_member')
      .limit(10);

    if (usersError) {
      console.error('❌ Error fetching sample users:', usersError);
    }

    const result = {
      success: true,
      test_date: today,
      system_status: statusResult,
      recent_logs: recentLogs || [],
      cron_job_active: cronJobs && cronJobs.length > 0,
      cron_job_details: cronJobs?.[0] || null,
      sample_users: sampleUsers || [],
      recommendations: [] as string[]
    };

    // Add recommendations based on findings
    const recommendations = [];
    
    if (!result.system_status?.rewards_executed) {
      recommendations.push('Daily rewards have not been executed today - manual trigger may be needed');
    }
    
    if (result.system_status?.users_without_rewards > 0) {
      recommendations.push(`${result.system_status.users_without_rewards} users still need rewards`);
    }
    
    if (!result.cron_job_active) {
      recommendations.push('Cron job is not active - automatic rewards will not work');
    }
    
    if (result.recent_logs.length === 0) {
      recommendations.push('No recent execution logs found - system may not be running');
    }

    result.recommendations = recommendations;

    console.log('✅ Daily rewards test completed');

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Daily rewards test error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
