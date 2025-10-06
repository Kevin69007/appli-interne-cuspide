-- Fix security issue: Set proper search_path for the trigger function
CREATE OR REPLACE FUNCTION trigger_auto_wean()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT
    net.http_post(
      url := 'https://tqsbvqpxtzecyhjtqojj.supabase.co/functions/v1/auto-wean-litters',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxc2J2cXB4dHplY3loanRxb2pqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkyMDg5NzgsImV4cCI6MjA2NDc4NDk3OH0.6xfyjsVrLli9t69M5qeQdEYbo5g5dmCg4_feuw0KRoU"}'::jsonb,
      body := '{}'::jsonb
    ) INTO result;
  
  RETURN result;
END;
$$;