
-- Fix the handle_new_user function to use correct column names
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.profiles (id, username, xp, tier, paw_dollars, nova_points)
  VALUES (new.id, new.raw_user_meta_data->>'username', 0, 'bronze', 1000, 10000);
  RETURN new;
END;
$function$;
