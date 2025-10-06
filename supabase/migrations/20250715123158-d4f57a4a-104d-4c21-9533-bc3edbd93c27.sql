
-- Add last_daily_reward_date column to profiles table for tracking daily rewards
ALTER TABLE public.profiles 
ADD COLUMN last_daily_reward_date DATE;

-- Add an index for better performance on daily reward queries
CREATE INDEX idx_profiles_last_daily_reward_date ON public.profiles(last_daily_reward_date);
