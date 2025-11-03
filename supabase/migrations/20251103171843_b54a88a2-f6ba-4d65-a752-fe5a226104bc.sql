-- Corriger les fonctions de projet manquantes

CREATE OR REPLACE FUNCTION public.update_project_progress()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.projects p
  SET progression = (
    SELECT 
      CASE 
        WHEN COUNT(*) = 0 THEN 0
        ELSE ROUND((COUNT(*) FILTER (WHERE t.statut = 'terminee')::numeric / COUNT(*)) * 100, 2)
      END
    FROM public.project_tasks pt
    JOIN public.tasks t ON t.id = pt.task_id
    WHERE pt.project_id = p.id
  ),
  updated_at = now()
  WHERE p.id = (SELECT project_id FROM public.project_tasks WHERE task_id = NEW.id LIMIT 1);
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_project_deadline()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.projects 
  SET date_echeance = (
    SELECT MIN(t.date_echeance)
    FROM public.tasks t
    JOIN public.project_tasks pt ON pt.task_id = t.id
    WHERE pt.project_id = (
      SELECT project_id FROM public.project_tasks WHERE task_id = NEW.id LIMIT 1
    )
    AND t.statut != 'terminee'
  ),
  updated_at = now()
  WHERE id = (SELECT project_id FROM public.project_tasks WHERE task_id = NEW.id LIMIT 1);
  RETURN NEW;
END;
$function$;