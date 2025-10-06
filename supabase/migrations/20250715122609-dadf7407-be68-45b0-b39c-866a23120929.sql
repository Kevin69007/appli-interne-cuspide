
-- Add tracking fields to profiles table for daily rewards
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_daily_reward_date DATE,
ADD COLUMN IF NOT EXISTS daily_xp INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_xp_date DATE;

-- Create daily_rewards_log table for tracking and debugging
CREATE TABLE IF NOT EXISTS public.daily_rewards_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_date DATE NOT NULL,
  trigger_source TEXT NOT NULL DEFAULT 'cron',
  users_processed INTEGER DEFAULT 0,
  users_rewarded INTEGER DEFAULT 0,
  errors_count INTEGER DEFAULT 0,
  error_details JSONB,
  status TEXT NOT NULL DEFAULT 'running',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on daily_rewards_log
ALTER TABLE public.daily_rewards_log ENABLE ROW LEVEL SECURITY;

-- Create policy for daily_rewards_log (admin access only)
CREATE POLICY "Admins can view daily rewards log" 
ON public.daily_rewards_log 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Add XP transactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.xp_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  xp_amount INTEGER NOT NULL,
  activity_type TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on xp_transactions
ALTER TABLE public.xp_transactions ENABLE ROW LEVEL SECURITY;

-- Create policy for xp_transactions
CREATE POLICY "Users can view their own XP transactions" 
ON public.xp_transactions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own XP transactions" 
ON public.xp_transactions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);
