
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    console.log('🕐 Setting up daily rewards cron job...')
    
    // First, unschedule any existing daily rewards cron jobs
    const { error: unscheduleError } = await supabase.rpc('cron.unschedule', {
      job_name: 'daily-rewards-automated'
    })
    
    if (unscheduleError && !unscheduleError.message.includes('does not exist')) {
      console.error('Failed to unschedule existing job:', unscheduleError)
    }

    // Create the cron job to run at 12:01 AM UTC daily
    const cronCommand = `
      select net.http_post(
        url := '${supabaseUrl}/functions/v1/automated-daily-rewards',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}"}'::jsonb,
        body := '{"automated": true}'::jsonb
      ) as request_id;
    `

    const { error: scheduleError } = await supabase.rpc('cron.schedule', {
      job_name: 'daily-rewards-automated',
      schedule: '1 0 * * *', // 12:01 AM UTC every day
      command: cronCommand
    })

    if (scheduleError) {
      console.error('Failed to schedule cron job:', scheduleError)
      throw new Error(`Failed to schedule cron job: ${scheduleError.message}`)
    }

    console.log('✅ Daily rewards cron job scheduled successfully')

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Daily rewards cron job scheduled for 12:01 AM UTC daily',
        schedule: '1 0 * * *'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('❌ Failed to setup cron job:', error)
    
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
