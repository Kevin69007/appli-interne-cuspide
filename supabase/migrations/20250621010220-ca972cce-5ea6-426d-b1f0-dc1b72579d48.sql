
-- Enable pg_cron extension for daily rewards scheduling
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Remove any existing daily rewards cron job to avoid duplicates
SELECT cron.unschedule('daily-paw-points-reward');

-- Create daily rewards cron job for 12 AM EST (5 AM UTC)
SELECT cron.schedule(
  'daily-paw-points-reward',
  '0 5 * * *', -- 5 AM UTC = 12 AM EST
  $$
  SELECT
    net.http_post(
        url:='https://tqsbvqpxtzecyhjtqojj.supabase.co/functions/v1/daily-rewards',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxc2J2cXB4dHplY3loanRxb2pqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkyMDg5NzgsImV4cCI6MjA2NDc4NDk3OH0.6xfyjsVrLli9t69M5qeQdEYbo5g5dmCg4_feuw0KRoU"}'::jsonb,
        body:='{"action": "daily_rewards"}'::jsonb
    ) as request_id;
  $$
);

-- Add index to improve performance of daily rewards queries
CREATE INDEX IF NOT EXISTS idx_profiles_last_xp_date ON profiles(last_xp_date);
CREATE INDEX IF NOT EXISTS idx_profiles_pawclub_member ON profiles(pawclub_member) WHERE pawclub_member = true;
