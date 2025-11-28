-- Modifier la table employee_badges pour supporter les badges mensuels
-- Ajouter les colonnes pour le tracking mensuel
ALTER TABLE employee_badges 
  ADD COLUMN IF NOT EXISTS mois INTEGER,
  ADD COLUMN IF NOT EXISTS annee INTEGER,
  ADD COLUMN IF NOT EXISTS annual_count INTEGER DEFAULT 0;

-- Supprimer l'ancienne contrainte unique si elle existe
ALTER TABLE employee_badges DROP CONSTRAINT IF EXISTS employee_badges_employee_id_badge_id_key;

-- Ajouter une nouvelle contrainte unique pour permettre un badge par mois
ALTER TABLE employee_badges 
  ADD CONSTRAINT employee_badges_employee_badge_month_unique 
  UNIQUE(employee_id, badge_id, mois, annee);

-- Créer un index pour améliorer les performances des requêtes par année
CREATE INDEX IF NOT EXISTS idx_employee_badges_year ON employee_badges(employee_id, annee);

-- Créer une vue pour obtenir le compteur annuel de chaque badge
CREATE OR REPLACE VIEW employee_badge_annual_counts AS
SELECT 
  employee_id,
  badge_id,
  annee,
  COUNT(*) as count,
  MAX(unlocked_at) as last_unlocked_at
FROM employee_badges
WHERE unlocked_at IS NOT NULL
GROUP BY employee_id, badge_id, annee;

-- Fonction pour calculer les statistiques d'un employé (côté serveur pour performances)
CREATE OR REPLACE FUNCTION get_employee_badge_stats(p_employee_id UUID, p_month INTEGER DEFAULT NULL, p_year INTEGER DEFAULT NULL)
RETURNS JSON AS $$
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
        AND date_creation >= v_start_date 
        AND date_creation < v_end_date
    ),
    'projects_participated', (
      SELECT COUNT(DISTINCT pt.project_id) 
      FROM project_tasks pt
      JOIN tasks t ON t.id = pt.task_id
      WHERE t.assigned_to = p_employee_id
        AND t.date_creation >= v_start_date 
        AND t.date_creation < v_end_date
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Vue agrégée pour le Trombinoscope (optimisation performances)
CREATE OR REPLACE VIEW employee_badge_summary AS
SELECT 
  e.id as employee_id,
  e.prenom,
  e.nom,
  e.photo_url,
  e.poste,
  e.equipe,
  COUNT(DISTINCT eb.badge_id) as total_unique_badges,
  SUM(CASE WHEN EXTRACT(YEAR FROM eb.unlocked_at) = EXTRACT(YEAR FROM CURRENT_DATE) THEN 1 ELSE 0 END) as badges_this_year,
  json_agg(
    json_build_object(
      'badge_id', eb.badge_id,
      'annual_count', eb.annual_count,
      'last_unlocked', eb.unlocked_at
    ) ORDER BY eb.unlocked_at DESC
  ) FILTER (WHERE eb.unlocked_at IS NOT NULL) as recent_badges
FROM employees e
LEFT JOIN employee_badges eb ON eb.employee_id = e.id
GROUP BY e.id, e.prenom, e.nom, e.photo_url, e.poste, e.equipe;

COMMENT ON VIEW employee_badge_summary IS 'Vue optimisée pour afficher rapidement les statistiques de badges dans le Trombinoscope';