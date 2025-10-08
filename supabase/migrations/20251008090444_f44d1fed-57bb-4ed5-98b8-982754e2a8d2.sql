-- Add email column to employees table
ALTER TABLE public.employees ADD COLUMN email text;

-- Populate existing employees with their emails from auth.users
UPDATE public.employees e
SET email = au.email
FROM auth.users au
WHERE e.user_id = au.id;

-- Update handle_new_user trigger to also populate email in employees when creating from auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email)
  );
  
  -- Assign default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$function$;