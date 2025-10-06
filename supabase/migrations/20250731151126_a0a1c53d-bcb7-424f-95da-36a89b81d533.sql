
-- Update the hash_pet_pin function to use only basic PostgreSQL functions
CREATE OR REPLACE FUNCTION public.hash_pet_pin(pin_text text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Use md5 hash with salt - available by default in PostgreSQL
  RETURN md5(pin_text || 'pet_pin_salt_2024');
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
  provided_hash := md5(provided_pin || 'pet_pin_salt_2024');
  
  -- Compare the hashes
  RETURN stored_hash = provided_hash;
END;
$function$;
