
-- Create counter tables for sequential numbering
CREATE TABLE public.user_counters (
  id SERIAL PRIMARY KEY,
  counter_type TEXT UNIQUE NOT NULL,
  current_value INTEGER NOT NULL DEFAULT 0
);

-- Initialize counters
INSERT INTO public.user_counters (counter_type, current_value) 
VALUES 
  ('profile_counter', 0),
  ('pet_counter', 0);

-- Add sequential number columns to profiles and user_pets tables
ALTER TABLE public.profiles 
ADD COLUMN profile_number INTEGER;

ALTER TABLE public.user_pets 
ADD COLUMN pet_number INTEGER;

-- Create function to get next profile number
CREATE OR REPLACE FUNCTION public.get_next_profile_number()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  next_number INTEGER;
BEGIN
  UPDATE public.user_counters 
  SET current_value = current_value + 1 
  WHERE counter_type = 'profile_counter'
  RETURNING current_value INTO next_number;
  
  RETURN next_number;
END;
$$;

-- Create function to get next pet number
CREATE OR REPLACE FUNCTION public.get_next_pet_number()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  next_number INTEGER;
BEGIN
  UPDATE public.user_counters 
  SET current_value = current_value + 1 
  WHERE counter_type = 'pet_counter'
  RETURNING current_value INTO next_number;
  
  RETURN next_number;
END;
$$;

-- Update the handle_new_user function to assign profile numbers
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, xp, tier, paw_dollars, paw_points, profile_number)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'username', 
    0, 
    'bronze', 
    0, 
    1000,
    public.get_next_profile_number()
  );
  RETURN new;
END;
$$;

-- Create trigger to assign pet numbers when pets are adopted
CREATE OR REPLACE FUNCTION public.assign_pet_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  NEW.pet_number = public.get_next_pet_number();
  RETURN NEW;
END;
$$;

-- Create trigger for pet number assignment
DROP TRIGGER IF EXISTS on_user_pet_created ON public.user_pets;
CREATE TRIGGER on_user_pet_created
  BEFORE INSERT ON public.user_pets
  FOR EACH ROW 
  EXECUTE FUNCTION public.assign_pet_number();
