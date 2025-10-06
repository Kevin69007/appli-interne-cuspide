
-- First, let's see what forums currently exist
SELECT id, name, description FROM public.forums ORDER BY name;

-- Remove the specific forums that are still showing
DELETE FROM public.forum_replies 
WHERE post_id IN (
  SELECT id FROM public.forum_posts 
  WHERE forum_id IN (
    SELECT id FROM public.forums 
    WHERE name IN ('Show & Tell', 'Questions & Help')
  )
);

DELETE FROM public.forum_posts 
WHERE forum_id IN (
  SELECT id FROM public.forums 
  WHERE name IN ('Show & Tell', 'Questions & Help')
);

DELETE FROM public.forums 
WHERE name IN ('Show & Tell', 'Questions & Help');
