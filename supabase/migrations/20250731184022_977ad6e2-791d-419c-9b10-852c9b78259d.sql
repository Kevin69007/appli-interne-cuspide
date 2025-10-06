
-- Create the daily_rewards_log table for tracking automated reward executions
CREATE TABLE IF NOT EXISTS public.daily_rewards_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  execution_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'running',
  trigger_source TEXT NOT NULL DEFAULT 'unknown',
  users_processed INTEGER DEFAULT 0,
  users_rewarded INTEGER DEFAULT 0,
  errors_count INTEGER DEFAULT 0,
  error_details JSONB NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE NULL
);

-- Enable RLS for the daily_rewards_log table
ALTER TABLE public.daily_rewards_log ENABLE ROW LEVEL SECURITY;

-- Create policy to allow system operations on daily_rewards_log
CREATE POLICY "System can manage daily rewards log" 
  ON public.daily_rewards_log 
  FOR ALL 
  USING (true);

-- Create a function to check daily rewards status for testing
CREATE OR REPLACE FUNCTION public.check_daily_rewards_status(check_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE(
  rewards_executed BOOLEAN,
  users_without_rewards INTEGER,
  last_execution_date DATE,
  last_execution_status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check if rewards were executed for the given date
  SELECT 
    EXISTS(SELECT 1 FROM daily_rewards_log WHERE execution_date = check_date AND status = 'completed') as rewards_executed,
    COUNT(*) FILTER (WHERE last_daily_reward_date != check_date OR last_daily_reward_date IS NULL)::INTEGER as users_without_rewards,
    (SELECT execution_date FROM daily_rewards_log WHERE status = 'completed' ORDER BY created_at DESC LIMIT 1) as last_execution_date,
    (SELECT status FROM daily_rewards_log ORDER BY created_at DESC LIMIT 1) as last_execution_status
  INTO 
    rewards_executed,
    users_without_rewards,
    last_execution_date,
    last_execution_status
  FROM profiles
  WHERE NOT COALESCE(is_banned, false);
  
  RETURN NEXT;
END;
$$;
