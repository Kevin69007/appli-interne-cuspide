
-- Update verify_pet_pin to handle both bcrypt and MD5 hashes
CREATE OR REPLACE FUNCTION public.verify_pet_pin(pet_id_param uuid, provided_pin text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  stored_hash text;
BEGIN
  -- Get the stored PIN hash for the pet
  SELECT lock_pin INTO stored_hash
  FROM public.user_pets
  WHERE id = pet_id_param AND user_id = auth.uid();
  
  -- If no hash found or pet not owned by user, return false
  IF stored_hash IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check if it's a bcrypt hash (starts with $2a$, $2b$, $2x$, $2y$)
  IF stored_hash LIKE '$2_$%' THEN
    -- Use crypt function to verify bcrypt hash
    RETURN crypt(provided_pin, stored_hash) = stored_hash;
  ELSE
    -- For non-bcrypt hashes, fall back to MD5 comparison
    RETURN stored_hash = md5(provided_pin || 'pet_pin_salt_2024');
  END IF;
END;
$function$;

-- Update hash_pet_pin to consistently use bcrypt for new locks
CREATE OR REPLACE FUNCTION public.hash_pet_pin(pin_text text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Use bcrypt with a cost of 10 for new hashes
  RETURN crypt(pin_text, gen_salt('bf', 10));
END;
$function$;
