-- Fix security warnings for newly created functions by setting search_path

DROP TRIGGER IF EXISTS update_project_deadline_trigger ON public.tasks;
DROP TRIGGER IF EXISTS update_project_progress_trigger ON public.tasks;

-- Recreate functions with proper security settings
CREATE OR REPLACE FUNCTION update_project_deadline()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;

CREATE OR REPLACE FUNCTION update_project_progress()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;

-- Recreate triggers
CREATE TRIGGER update_project_deadline_trigger
AFTER UPDATE OF date_echeance ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION update_project_deadline();

CREATE TRIGGER update_project_progress_trigger
AFTER UPDATE OF statut ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION update_project_progress();