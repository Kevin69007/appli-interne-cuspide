
-- Create the execute_paw_dollar_transfer function that the edge function is trying to call
CREATE OR REPLACE FUNCTION public.execute_paw_dollar_transfer(
  p_sender_id uuid,
  p_recipient_id uuid,
  p_amount integer
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  sender_balance integer;
  recipient_balance integer;
BEGIN
  -- Lock both profiles to prevent race conditions
  SELECT paw_dollars INTO sender_balance
  FROM public.profiles
  WHERE id = p_sender_id
  FOR UPDATE;
  
  SELECT paw_dollars INTO recipient_balance
  FROM public.profiles
  WHERE id = p_recipient_id
  FOR UPDATE;
  
  -- Check if sender exists and has sufficient funds
  IF sender_balance IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Sender profile not found');
  END IF;
  
  IF recipient_balance IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Recipient profile not found');
  END IF;
  
  IF sender_balance < p_amount THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient funds');
  END IF;
  
  -- Perform the transfer
  UPDATE public.profiles
  SET paw_dollars = paw_dollars - p_amount
  WHERE id = p_sender_id;
  
  UPDATE public.profiles
  SET paw_dollars = paw_dollars + p_amount
  WHERE id = p_recipient_id;
  
  RETURN json_build_object('success', true, 'message', 'Transfer completed successfully');
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;
