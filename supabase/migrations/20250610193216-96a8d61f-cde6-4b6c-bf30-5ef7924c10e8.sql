
-- Remove specific forums: General Discussion, Pet Care Tips, Show and Tell, Questions and Help
DELETE FROM public.forums 
WHERE name IN ('General Discussion', 'Pet Care Tips', 'Show and Tell', 'Questions and Help');

-- Also remove any posts and replies associated with these forums to clean up
DELETE FROM public.forum_replies 
WHERE post_id IN (
  SELECT id FROM public.forum_posts 
  WHERE forum_id IN (
    SELECT id FROM public.forums 
    WHERE name IN ('General Discussion', 'Pet Care Tips', 'Show and Tell', 'Questions and Help')
  )
);

DELETE FROM public.forum_posts 
WHERE forum_id IN (
  SELECT id FROM public.forums 
  WHERE name IN ('General Discussion', 'Pet Care Tips', 'Show and Tell', 'Questions and Help')
);
