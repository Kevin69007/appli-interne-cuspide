
-- Create a table to track post views
CREATE TABLE public.forum_post_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address INET,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id, ip_address)
);

-- Add Row Level Security
ALTER TABLE public.forum_post_views ENABLE ROW LEVEL SECURITY;

-- Create policy that allows anyone to view post view counts
CREATE POLICY "Anyone can view post views" 
  ON public.forum_post_views 
  FOR SELECT 
  USING (true);

-- Create policy that allows anyone to insert post views
CREATE POLICY "Anyone can track post views" 
  ON public.forum_post_views 
  FOR INSERT 
  WITH CHECK (true);

-- Create an index for better performance
CREATE INDEX idx_forum_post_views_post_id ON public.forum_post_views(post_id);
CREATE INDEX idx_forum_post_views_viewed_at ON public.forum_post_views(viewed_at);
