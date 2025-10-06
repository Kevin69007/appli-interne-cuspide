-- Temporary admin function to reset pet pin
CREATE OR REPLACE FUNCTION public.admin_reset_pet_pin(pet_id_param uuid, new_pin text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Validate PIN format (exactly 4 digits)
  IF new_pin !~ '^[0-9]{4}$' THEN
    RETURN json_build_object('success', false, 'error', 'PIN must be exactly 4 digits');
  END IF;
  
  -- Update the pet with new hashed pin
  UPDATE public.user_pets
  SET 
    lock_pin = public.hash_pet_pin(new_pin),
    is_locked = true,
    locked_at = now()
  WHERE id = pet_id_param;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Pet not found');
  END IF;
  
  RETURN json_build_object('success', true, 'message', 'Pet pin reset successfully to ' || new_pin);
END;
$function$;