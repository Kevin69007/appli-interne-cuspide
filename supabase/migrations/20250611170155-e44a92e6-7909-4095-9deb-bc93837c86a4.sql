
-- Create the increment_paw_dollars function
CREATE OR REPLACE FUNCTION increment_paw_dollars(user_id uuid, amount integer)
RETURNS void
LANGUAGE plpgsql
SECURITY definer
AS $$
BEGIN
  UPDATE profiles 
  SET paw_dollars = paw_dollars + amount 
  WHERE id = user_id;
END;
$$;
