
-- Add default_adopt_gender field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN default_adopt_gender text DEFAULT 'male' CHECK (default_adopt_gender IN ('male', 'female'));

-- Add new forum categories
INSERT INTO public.forums (name, description, order_position) VALUES 
('Rant', 'Share your thoughts, frustrations, and opinions about anything pet-related or general topics', 8),
('Games', 'Fun games, challenges, and interactive activities for the community', 9);

-- Update existing forum order positions to accommodate new ones
UPDATE public.forums SET order_position = 10 WHERE name = 'Site Feedback';
