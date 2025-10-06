
-- Add last_wheel_spin column to profiles table to track wheel spin cooldown
ALTER TABLE public.profiles 
ADD COLUMN last_wheel_spin timestamp with time zone;

-- Add comment to document the field
COMMENT ON COLUMN public.profiles.last_wheel_spin IS 'Timestamp of when user last spun the reward wheel (4-hour cooldown)';
