-- Corriger les fonctions de recherche vectorielle

CREATE OR REPLACE FUNCTION public.match_response_blocks(query_embedding vector, match_threshold double precision, match_count integer)
RETURNS TABLE(id uuid, bloc_id text, title text, content text, category text, triggers text[], priority integer, similarity double precision)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    rb.id,
    rb.bloc_id,
    rb.title,
    rb.content,
    rb.category,
    rb.triggers,
    rb.priority,
    1 - (rb.content_embedding <=> query_embedding) AS similarity
  FROM response_blocks rb
  WHERE rb.content_embedding <=> query_embedding < 1 - match_threshold
    AND rb.is_active = true
  ORDER BY rb.content_embedding <=> query_embedding
  LIMIT match_count;
END;
$function$;

CREATE OR REPLACE FUNCTION public.search_blocks_by_similarity(query_embedding vector, match_threshold double precision DEFAULT 0.7, match_count integer DEFAULT 5)
RETURNS TABLE(bloc_id text, title text, content text, category text, similarity double precision)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    rb.bloc_id,
    rb.title,
    rb.content,
    rb.category,
    1 - (rb.content_embedding <=> query_embedding) as similarity
  FROM public.response_blocks rb
  WHERE rb.is_active = true
    AND 1 - (rb.content_embedding <=> query_embedding) > match_threshold
  ORDER BY rb.content_embedding <=> query_embedding
  LIMIT match_count;
END;
$function$;