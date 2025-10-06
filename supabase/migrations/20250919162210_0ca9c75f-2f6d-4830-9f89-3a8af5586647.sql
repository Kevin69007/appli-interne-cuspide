-- Add daily XP tracking columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN daily_xp_earned integer DEFAULT 0,
ADD COLUMN last_xp_date date;