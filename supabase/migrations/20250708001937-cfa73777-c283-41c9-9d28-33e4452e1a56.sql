
-- Add unique constraint to prevent duplicate daily reward transactions per user per day
-- This will prevent the database from allowing multiple daily reward transactions on the same day
ALTER TABLE public.pet_transactions 
ADD CONSTRAINT unique_daily_reward_per_user_per_day 
UNIQUE (user_id, description, created_at::date)
WHERE description = 'Daily reward - 1000 Paw Points';

-- Add unique constraint for paw dollar daily rewards as well
ALTER TABLE public.paw_dollar_transactions 
ADD CONSTRAINT unique_daily_pd_reward_per_user_per_day 
UNIQUE (user_id, description, created_at::date)
WHERE type = 'daily_bonus' AND description LIKE '%daily bonus%';

-- Add index to improve performance of daily rewards queries
CREATE INDEX IF NOT EXISTS idx_pet_transactions_daily_rewards 
ON public.pet_transactions (user_id, description, created_at::date) 
WHERE description = 'Daily reward - 1000 Paw Points';

CREATE INDEX IF NOT EXISTS idx_paw_dollar_transactions_daily_rewards 
ON public.paw_dollar_transactions (user_id, type, created_at::date) 
WHERE type = 'daily_bonus';
