
-- Fix verify_pet_pin and hash_pet_pin to use fully qualified crypt functions
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
    -- Use extensions.crypt function to verify bcrypt hash
    RETURN extensions.crypt(provided_pin, stored_hash) = stored_hash;
  ELSE
    -- Try multiple MD5 formats that might have been used originally
    -- Format 1: Simple MD5 without salt
    IF stored_hash = md5(provided_pin) THEN
      RETURN true;
    END IF;
    
    -- Format 2: MD5 with the current salt
    IF stored_hash = md5(provided_pin || 'pet_pin_salt_2024') THEN
      RETURN true;
    END IF;
    
    -- Format 3: MD5 with potential original salt
    IF stored_hash = md5('pet_pin_salt_2024' || provided_pin) THEN
      RETURN true;
    END IF;
    
    -- Format 4: Just in case there was no salt originally
    IF stored_hash = provided_pin THEN
      RETURN true;
    END IF;
  END IF;
  
  RETURN false;
END;
$function$;

-- Fix hash_pet_pin to use fully qualified crypt functions
CREATE OR REPLACE FUNCTION public.hash_pet_pin(pin_text text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Use bcrypt with a cost of 10 for new hashes, using fully qualified function names
  RETURN extensions.crypt(pin_text, extensions.gen_salt('bf', 10));
END;
$function$;
