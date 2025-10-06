-- Remove temporary admin function for security
DROP FUNCTION IF EXISTS public.admin_reset_pet_pin(uuid, text);