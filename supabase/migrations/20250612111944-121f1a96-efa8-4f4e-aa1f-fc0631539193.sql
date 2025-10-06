
-- Add about_section column to user_pets table
ALTER TABLE public.user_pets 
ADD COLUMN about_section TEXT DEFAULT '';
