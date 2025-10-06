-- Fix daily rewards scheduling and execution issues
-- 1. Remove existing cron jobs to avoid duplicates
SELECT cron.unschedule('daily-paw-points-reward');

-- 2. Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 3. Create improved daily rewards cron job
-- Using 5 AM UTC for midnight EST/1 AM EDT (handles timezone changes automatically)
-- This ensures it runs at midnight EST during standard time and 1 AM EDT during daylight time
SELECT cron.schedule(
  'daily-paw-points-reward',
  '0 5 * * *', -- 5 AM UTC = Midnight EST / 1 AM EDT
  $$
  SELECT
    net.http_post(
        url:='https://tqsbvqpxtzecyhjtqojj.supabase.co/functions/v1/daily-rewards',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxc2J2cXB4dHplY3loanRxb2pqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkyMDg5NzgsImV4cCI6MjA2NDc4NDk3OH0.6xfyjsVrLli9t69M5qeQdEYbo5g5dmCg4_feuw0KRoU"}'::jsonb,
        body:='{"action": "daily_rewards"}'::jsonb
    ) as request_id;
  $$
);

-- 4. Add helpful indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_last_xp_date ON profiles(last_xp_date);
CREATE INDEX IF NOT EXISTS idx_profiles_pawclub_member ON profiles(pawclub_member) WHERE pawclub_member = true;
CREATE INDEX IF NOT EXISTS idx_profiles_last_care_date ON profiles(last_care_date);

-- 5. Verify cron job creation
SELECT * FROM cron.job WHERE jobname = 'daily-paw-points-reward';