-- Fix the accept_friend_request function to handle duplicate friendships gracefully
CREATE OR REPLACE FUNCTION public.accept_friend_request(request_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  request_record RECORD;
BEGIN
  -- Get and lock the friend request
  SELECT * INTO request_record
  FROM public.friend_requests
  WHERE id = request_id_param 
  AND status = 'pending'
  FOR UPDATE;
  
  -- Check if request exists and is pending
  IF NOT FOUND THEN
    RAISE NOTICE 'Friend request not found or not pending: %', request_id_param;
    RETURN false;
  END IF;
  
  -- Verify the current user is the receiver
  IF auth.uid() != request_record.receiver_id THEN
    RAISE NOTICE 'Unauthorized: User % trying to accept request for user %', auth.uid(), request_record.receiver_id;
    RETURN false;
  END IF;
  
  -- Create friendship with conflict resolution to prevent duplicates
  -- Always ensure user1_id < user2_id to maintain consistent ordering
  INSERT INTO public.friendships (user1_id, user2_id)
  VALUES (
    LEAST(request_record.sender_id, request_record.receiver_id),
    GREATEST(request_record.sender_id, request_record.receiver_id)
  )
  ON CONFLICT (user1_id, user2_id) DO NOTHING;
  
  -- Always update the friend request status to accepted, even if friendship already existed
  UPDATE public.friend_requests
  SET 
    status = 'accepted',
    updated_at = now()
  WHERE id = request_id_param;
  
  -- Verify the update happened
  IF NOT FOUND THEN
    RAISE NOTICE 'Failed to update friend request status for request: %', request_id_param;
    RETURN false;
  END IF;
  
  RAISE NOTICE 'Successfully accepted friend request: % between users % and %', 
    request_id_param, request_record.sender_id, request_record.receiver_id;
  
  RETURN true;
  
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Error in accept_friend_request: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
    RETURN false;
END;
$function$;