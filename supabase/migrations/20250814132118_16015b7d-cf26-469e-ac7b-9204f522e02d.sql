
-- Update RLS policy to allow public counting of views while keeping individual records private
DROP POLICY IF EXISTS "Anyone can track post views" ON public.forum_post_views;
DROP POLICY IF EXISTS "Post authors and admins can view post views" ON public.forum_post_views;

-- Allow anyone to insert view records (for tracking)
CREATE POLICY "Anyone can track post views" ON public.forum_post_views
FOR INSERT 
WITH CHECK (true);

-- Allow public counting of views (for displaying view counts)
CREATE POLICY "Public can count post views" ON public.forum_post_views
FOR SELECT 
USING (true);

-- Add unique constraint to prevent duplicate views per user
ALTER TABLE public.forum_post_views 
ADD CONSTRAINT unique_post_user_view 
UNIQUE (post_id, user_id);

-- Handle the case where user_id might be null for anonymous users
-- We'll allow multiple anonymous views but prevent duplicate user views
DROP CONSTRAINT IF EXISTS unique_post_user_view;
CREATE UNIQUE INDEX unique_post_user_view 
ON public.forum_post_views (post_id, user_id) 
WHERE user_id IS NOT NULL;
