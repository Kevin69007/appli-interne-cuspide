
-- Add blocked_users table to handle user blocking
CREATE TABLE public.blocked_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);

-- Enable RLS for blocked_users table
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

-- Create policy for users to manage their own blocks
CREATE POLICY "Users can view their own blocks" 
  ON public.blocked_users 
  FOR SELECT 
  USING (auth.uid() = blocker_id);

CREATE POLICY "Users can create blocks" 
  ON public.blocked_users 
  FOR INSERT 
  WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can delete their own blocks" 
  ON public.blocked_users 
  FOR DELETE 
  USING (auth.uid() = blocker_id);

-- Create a function to check if a user is blocked
CREATE OR REPLACE FUNCTION public.is_user_blocked(sender_id UUID, receiver_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.blocked_users 
    WHERE blocker_id = receiver_id AND blocked_id = sender_id
  );
$$;

-- Update pet icons for breeds (using the uploaded images)
UPDATE public.pets 
SET image_url = '/lovable-uploads/2ede1ca1-5c34-4614-bdbd-b3ddb36354d6.png'
WHERE name ILIKE '%husky%' OR name ILIKE '%siberian husky%';

UPDATE public.pets 
SET image_url = '/lovable-uploads/8d995196-8e52-48c7-b289-d89c7242d7d5.png'
WHERE name ILIKE '%golden retriever%' OR name ILIKE '%retriever%';
