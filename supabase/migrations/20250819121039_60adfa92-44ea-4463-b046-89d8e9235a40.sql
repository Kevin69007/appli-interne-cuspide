
-- Add view_count column to forum_posts
ALTER TABLE public.forum_posts 
ADD COLUMN IF NOT EXISTS view_count integer DEFAULT 0;

-- Create trigger function to automatically update view counts
CREATE OR REPLACE FUNCTION public.update_post_view_counts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment view count when a view is added
    UPDATE public.forum_posts 
    SET view_count = view_count + 1 
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement view count when a view is removed (optional)
    UPDATE public.forum_posts 
    SET view_count = GREATEST(0, view_count - 1) 
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;

-- Create trigger on forum_post_views table
DROP TRIGGER IF EXISTS trigger_update_post_view_counts ON public.forum_post_views;
CREATE TRIGGER trigger_update_post_view_counts
  AFTER INSERT OR DELETE ON public.forum_post_views
  FOR EACH ROW EXECUTE FUNCTION public.update_post_view_counts();

-- Backfill existing view counts
UPDATE public.forum_posts 
SET view_count = (
  SELECT COUNT(*) 
  FROM public.forum_post_views 
  WHERE forum_post_views.post_id = forum_posts.id
);
