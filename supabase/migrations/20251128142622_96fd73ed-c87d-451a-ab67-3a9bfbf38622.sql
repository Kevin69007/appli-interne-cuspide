-- Drop and recreate the get_employee_badge_stats function with correct column names
DROP FUNCTION IF EXISTS public.get_employee_badge_stats(uuid, integer, integer);

CREATE OR REPLACE FUNCTION public.get_employee_badge_stats(p_employee_id uuid, p_month integer DEFAULT NULL::integer, p_year integer DEFAULT NULL::integer)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_month INTEGER := COALESCE(p_month, EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER);
  v_year INTEGER := COALESCE(p_year, EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER);
  v_start_date DATE := make_date(v_year, v_month, 1);
  v_end_date DATE := (v_start_date + INTERVAL '1 month')::DATE;
  v_stats JSON;
BEGIN
  SELECT json_build_object(
    'completed_tasks', (
      SELECT COUNT(*) FROM tasks 
      WHERE assigned_to = p_employee_id 
        AND statut = 'terminee'
        AND date_echeance >= v_start_date 
        AND date_echeance < v_end_date
    ),
    'boomerangs_sent', (
      SELECT COUNT(*) FROM tasks 
      WHERE boomerang_original_owner = p_employee_id
        AND boomerang_history IS NOT NULL
        AND created_at >= v_start_date 
        AND created_at < v_end_date
    ),
    'projects_participated', (
      SELECT COUNT(DISTINCT pt.project_id) 
      FROM project_tasks pt
      JOIN tasks t ON t.id = pt.task_id
      WHERE t.assigned_to = p_employee_id
        AND t.created_at >= v_start_date 
        AND t.created_at < v_end_date
    ),
    'projects_created', (
      SELECT COUNT(*) FROM projects 
      WHERE created_by = p_employee_id
        AND date_debut >= v_start_date 
        AND date_debut < v_end_date
    ),
    'ideas_submitted', (
      SELECT COUNT(*) FROM ideas 
      WHERE employee_id = p_employee_id
        AND created_at >= v_start_date 
        AND created_at < v_end_date
    ),
    'ideas_validated', (
      SELECT COUNT(*) FROM ideas 
      WHERE employee_id = p_employee_id
        AND statut IN ('implementee', 'approuvee')
        AND reviewed_at >= v_start_date 
        AND reviewed_at < v_end_date
    ),
    'mood_days', (
      SELECT COUNT(*) FROM daily_mood 
      WHERE employee_id = p_employee_id
        AND date >= v_start_date 
        AND date < v_end_date
    ),
    'positive_moods', (
      SELECT COUNT(*) FROM daily_mood 
      WHERE employee_id = p_employee_id
        AND mood_emoji IN ('😊', '😄', '🔥')
        AND date >= v_start_date 
        AND date < v_end_date
    ),
    'game_sessions', (
      SELECT COUNT(*) FROM game_participants gp
      JOIN weekly_game_sessions wgs ON wgs.id = gp.session_id
      WHERE gp.employee_id = p_employee_id
        AND wgs.start_date >= v_start_date 
        AND wgs.start_date < v_end_date
    ),
    'objectives_validated', (
      SELECT COUNT(*) FROM agenda_entries 
      WHERE employee_id = p_employee_id
        AND categorie = 'indicateurs'
        AND statut_validation = 'valide'
        AND date >= v_start_date 
        AND date < v_end_date
    )
  ) INTO v_stats;
  
  RETURN v_stats;
END;
$function$;