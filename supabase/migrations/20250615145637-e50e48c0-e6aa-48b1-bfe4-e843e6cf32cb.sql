
-- First, let's check and fix the RLS policies for user_messages table
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can delete their own received messages" ON public.user_messages;
DROP POLICY IF EXISTS "Users can delete messages on their profile" ON public.user_messages;

-- Create a comprehensive deletion policy
-- Users can delete messages where they are the receiver (on their own profile)
CREATE POLICY "Users can delete messages on their profile" 
ON public.user_messages 
FOR DELETE 
USING (
  auth.uid() = receiver_id 
  AND is_profile_message = true
);

-- Ensure users can only see their own messages
DROP POLICY IF EXISTS "Users can view their own messages" ON public.user_messages;
CREATE POLICY "Users can view their own messages" 
ON public.user_messages 
FOR SELECT 
USING (
  auth.uid() = sender_id 
  OR auth.uid() = receiver_id
);

-- Users can insert messages
DROP POLICY IF EXISTS "Users can send messages" ON public.user_messages;
CREATE POLICY "Users can send messages" 
ON public.user_messages 
FOR INSERT 
WITH CHECK (auth.uid() = sender_id);

-- Users can update messages they received (mark as read)
DROP POLICY IF EXISTS "Users can update received messages" ON public.user_messages;
CREATE POLICY "Users can update received messages" 
ON public.user_messages 
FOR UPDATE 
USING (auth.uid() = receiver_id);
