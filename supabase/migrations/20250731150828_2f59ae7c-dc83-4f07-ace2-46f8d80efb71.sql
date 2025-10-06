
-- First, let's try to enable the pgcrypto extension if it's not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Update the hash_pet_pin function to use a more reliable hashing method
CREATE OR REPLACE FUNCTION public.hash_pet_pin(pin_text text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Use a simple but secure hash with a fixed salt for PINs
  -- Since PINs are only 4 digits, we don't need ultra-strong hashing
  RETURN encode(digest(pin_text || 'pet_pin_salt_2024', 'sha256'), 'hex');
END;
$function$;

-- Update the verify_pet_pin function to match the new hashing
CREATE OR REPLACE FUNCTION public.verify_pet_pin(pet_id_param uuid, provided_pin text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  stored_hash text;
  provided_hash text;
BEGIN
  -- Get the stored PIN hash for the pet
  SELECT lock_pin INTO stored_hash
  FROM public.user_pets
  WHERE id = pet_id_param AND user_id = auth.uid();
  
  -- If no hash found or pet not owned by user, return false
  IF stored_hash IS NULL THEN
    RETURN false;
  END IF;
  
  -- Hash the provided PIN using the same method
  provided_hash := encode(digest(provided_pin || 'pet_pin_salt_2024', 'sha256'), 'hex');
  
  -- Compare the hashes
  RETURN stored_hash = provided_hash;
END;
$function$;
