
-- Update the handle_new_user function to give new users 1000 paw points and 0 paw dollars
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.profiles (id, username, xp, tier, paw_dollars, paw_points)
  VALUES (new.id, new.raw_user_meta_data->>'username', 0, 'bronze', 0, 1000);
  RETURN new;
END;
$function$;
