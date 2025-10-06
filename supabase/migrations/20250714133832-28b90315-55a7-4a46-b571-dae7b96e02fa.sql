
-- Phase 1: Fix the cron job with service role key and better error handling
-- Remove the existing cron job first
SELECT cron.unschedule('daily-paw-points-reward');

-- Create an improved cron job with proper service role key and error handling
SELECT cron.schedule(
  'daily-paw-points-reward',
  '0 5 * * *', -- 5 AM UTC = Midnight EST / 1 AM EDT
  $$
  SELECT
    net.http_post(
        url:='https://tqsbvqpxtzecyhjtqojj.supabase.co/functions/v1/daily-rewards',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxc2J2cXB4dHplY3loanRxb2pqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTIwODk3OCwiZXhwIjoyMDY0Nzg0OTc4fQ.qkG4nDyF7-VCfZS_nWOdx8oTgNUNaVOYWJJ8VvgJFy8"}'::jsonb,
        body:='{"action": "daily_rewards", "source": "cron"}'::jsonb
    ) as request_id;
  $$
);

-- Phase 4: Database improvements - Create daily rewards execution log table
CREATE TABLE IF NOT EXISTS public.daily_rewards_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  execution_date date NOT NULL DEFAULT CURRENT_DATE,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone,
  status text NOT NULL DEFAULT 'running',
  users_processed integer DEFAULT 0,
  users_rewarded integer DEFAULT 0,
  errors_count integer DEFAULT 0,
  error_details jsonb,
  trigger_source text DEFAULT 'unknown', -- 'cron', 'manual', 'api'
  created_at timestamp with time zone DEFAULT now()
);

-- Add RLS policies for the log table
ALTER TABLE public.daily_rewards_log ENABLE ROW LEVEL SECURITY;

-- Admins can view all logs
CREATE POLICY "Admins can view daily rewards logs" ON public.daily_rewards_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- System can insert and update logs
CREATE POLICY "System can manage daily rewards logs" ON public.daily_rewards_log
  FOR ALL USING (true);

-- Add unique constraint to prevent duplicate daily executions
CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_rewards_log_date_status 
ON public.daily_rewards_log (execution_date, status) 
WHERE status = 'completed';

-- Phase 4: Add performance indexes for daily rewards queries
CREATE INDEX IF NOT EXISTS idx_profiles_last_xp_date_null ON public.profiles(last_xp_date) WHERE last_xp_date IS NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_pawclub_active ON public.profiles(pawclub_member, last_xp_date) WHERE pawclub_member = true;
CREATE INDEX IF NOT EXISTS idx_profiles_care_badge_tracking ON public.profiles(last_care_date, care_badge_days);

-- Add a backup monitoring function that can check if daily rewards ran
CREATE OR REPLACE FUNCTION public.check_daily_rewards_status(check_date date DEFAULT CURRENT_DATE)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  log_record RECORD;
  users_without_rewards INTEGER;
  result jsonb;
BEGIN
  -- Check if there's a completed log entry for the date
  SELECT * INTO log_record
  FROM public.daily_rewards_log
  WHERE execution_date = check_date AND status = 'completed'
  ORDER BY completed_at DESC
  LIMIT 1;

  -- Count users who haven't received rewards today
  SELECT COUNT(*) INTO users_without_rewards
  FROM public.profiles
  WHERE last_xp_date != check_date OR last_xp_date IS NULL;

  -- Build result
  result := jsonb_build_object(
    'date', check_date,
    'rewards_executed', log_record.id IS NOT NULL,
    'execution_time', log_record.completed_at,
    'users_rewarded', COALESCE(log_record.users_rewarded, 0),
    'users_without_rewards', users_without_rewards,
    'needs_manual_trigger', (log_record.id IS NULL AND users_without_rewards > 0)
  );

  RETURN result;
END;
$$;
