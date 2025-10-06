
-- Remove duplicate daily_rewards_log table creation and fix column references
-- The daily_rewards_log table already exists, so we just need to clean up any references to non-existent columns

-- Remove any indexes that reference non-existent columns
DROP INDEX IF EXISTS idx_profiles_daily_xp;
DROP INDEX IF EXISTS idx_profiles_last_xp_date;
DROP INDEX IF EXISTS idx_profiles_last_xp_date_null;

-- Update the cron job to send the correct action parameter
SELECT cron.unschedule('daily-paw-points-reward');

-- Create the corrected cron job with proper action parameter
SELECT cron.schedule(
  'daily-paw-points-reward',
  '0 5 * * *', -- 5 AM UTC = Midnight EST / 1 AM EDT
  $$
  SELECT
    net.http_post(
        url:='https://tqsbvqpxtzecyhjtqojj.supabase.co/functions/v1/daily-rewards',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxc2J2cXB4dHplY3loanRxb2pqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTIwODk3OCwiZXhwIjoyMDY0Nzg0OTc4fQ.qkG4nDyF7-VCfZS_nWOdx8oTgNUNaVOYWJJ8VvgJFy8"}'::jsonb,
        body:='{"source": "cron"}'::jsonb
    ) as request_id;
  $$
);
