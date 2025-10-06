-- Enable pg_cron extension for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension for HTTP calls
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a cron job that runs every hour to check for litters that need weaning
-- This ensures litters are weaned promptly at 12:00 AM on their wean date
SELECT cron.schedule(
  'auto-wean-litters',           -- job name
  '0 * * * *',                   -- cron expression: every hour at minute 0
  $$
  SELECT
    net.http_post(
      url := 'https://tqsbvqpxtzecyhjtqojj.supabase.co/functions/v1/auto-wean-litters',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxc2J2cXB4dHplY3loanRxb2pqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkyMDg5NzgsImV4cCI6MjA2NDc4NDk3OH0.6xfyjsVrLli9t69M5qeQdEYbo5g5dmCg4_feuw0KRoU"}'::jsonb,
      body := '{}'::jsonb
    ) as request_id;
  $$
);

-- Create a function to manually trigger the auto-wean process (for testing/admin use)
CREATE OR REPLACE FUNCTION trigger_auto_wean()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT
    net.http_post(
      url := 'https://tqsbvqpxtzecyhjtqojj.supabase.co/functions/v1/auto-wean-litters',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxc2J2cXB4dHplY3loanRxb2pqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkyMDg5NzgsImV4cCI6MjA2NDc4NDk3OH0.6xfyjsVrLli9t69M5qeQdEYbo5g5dmCg4_feuw0KRoU"}'::jsonb,
      body := '{}'::jsonb
    ) as request_id;
  
  RETURN result;
END;
$$;