-- Corriger le trigger qui référence points_objectif
CREATE OR REPLACE FUNCTION recalculate_monthly_score_function()
RETURNS TRIGGER AS $$
DECLARE
  v_employee_id uuid;
  v_month integer;
  v_year integer;
  v_score_indicateurs numeric := 0;
  v_bonus_points numeric := 0;
  v_malus_points numeric := 0;
  v_score_global numeric := 0;
  v_projection_status text := null;
  v_projection_percentage numeric := 0;
  v_month_percentage numeric;
  v_current_day integer;
  v_total_days integer;
BEGIN
  -- Récupérer l'employee_id et la date
  IF TG_OP = 'DELETE' THEN
    v_employee_id := OLD.employee_id;
    v_month := EXTRACT(MONTH FROM OLD.date);
    v_year := EXTRACT(YEAR FROM OLD.date);
  ELSE
    v_employee_id := NEW.employee_id;
    v_month := EXTRACT(MONTH FROM NEW.date);
    v_year := EXTRACT(YEAR FROM NEW.date);
  END IF;

  -- Calculer le score des indicateurs (changé de points_objectif à points_indicateur)
  SELECT COALESCE(SUM(points_indicateur), 0)
  INTO v_score_indicateurs
  FROM agenda_entries
  WHERE employee_id = v_employee_id
    AND EXTRACT(MONTH FROM date) = v_month
    AND EXTRACT(YEAR FROM date) = v_year
    AND categorie = 'indicateurs'
    AND statut_validation = 'valide';

  -- Calculer bonus et malus
  SELECT 
    COALESCE(SUM(CASE WHEN points > 0 THEN points ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN points < 0 THEN points ELSE 0 END), 0)
  INTO v_bonus_points, v_malus_points
  FROM agenda_entries
  WHERE employee_id = v_employee_id
    AND EXTRACT(MONTH FROM date) = v_month
    AND EXTRACT(YEAR FROM date) = v_year
    AND statut_validation = 'valide'
    AND points IS NOT NULL;

  -- Calculer le score global
  v_score_global := v_score_indicateurs + v_bonus_points + v_malus_points;

  -- Calculer la projection si c'est le mois en cours
  IF v_month = EXTRACT(MONTH FROM CURRENT_DATE) AND v_year = EXTRACT(YEAR FROM CURRENT_DATE) THEN
    v_current_day := EXTRACT(DAY FROM CURRENT_DATE);
    v_total_days := EXTRACT(DAY FROM (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day'));
    v_month_percentage := (v_current_day::numeric / v_total_days::numeric) * 100;
    v_projection_percentage := v_score_global;

    IF v_projection_percentage >= v_month_percentage + 10 THEN
      v_projection_status := 'en_avance';
    ELSIF v_projection_percentage >= v_month_percentage - 10 THEN
      v_projection_status := 'dans_les_temps';
    ELSE
      v_projection_status := 'en_retard';
    END IF;
  END IF;

  -- Mettre à jour ou créer le score mensuel
  INSERT INTO monthly_scores (
    employee_id,
    mois,
    annee,
    score_indicateurs,
    bonus_points,
    malus_points,
    score_global,
    projection_status,
    projection_percentage,
    updated_at
  ) VALUES (
    v_employee_id,
    v_month,
    v_year,
    v_score_indicateurs,
    v_bonus_points,
    v_malus_points,
    v_score_global,
    v_projection_status,
    v_projection_percentage,
    NOW()
  )
  ON CONFLICT (employee_id, mois, annee) 
  DO UPDATE SET
    score_indicateurs = EXCLUDED.score_indicateurs,
    bonus_points = EXCLUDED.bonus_points,
    malus_points = EXCLUDED.malus_points,
    score_global = EXCLUDED.score_global,
    projection_status = EXCLUDED.projection_status,
    projection_percentage = EXCLUDED.projection_percentage,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Maintenant appliquer la migration principale
-- Partie 1 : Simplifier la validation → Contrôle a posteriori
ALTER TABLE agenda_entries 
ALTER COLUMN statut_validation SET DEFAULT 'valide';

UPDATE agenda_entries 
SET statut_validation = 'valide' 
WHERE categorie = 'indicateurs' AND statut_validation = 'en_attente';

ALTER TABLE agenda_entries
ADD COLUMN IF NOT EXISTS controle_effectue BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS controle_par UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS date_controle TIMESTAMPTZ;

-- Partie 2 : Gestion des managers par équipe
CREATE TABLE IF NOT EXISTS team_managers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  equipe TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(manager_employee_id, equipe)
);

CREATE INDEX IF NOT EXISTS idx_team_managers_equipe ON team_managers(equipe);
CREATE INDEX IF NOT EXISTS idx_team_managers_manager ON team_managers(manager_employee_id);

ALTER TABLE team_managers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage team managers" ON team_managers;
CREATE POLICY "Admins can manage team managers"
ON team_managers FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

DROP POLICY IF EXISTS "Managers can view their teams" ON team_managers;
CREATE POLICY "Managers can view their teams"
ON team_managers FOR SELECT
USING (
  manager_employee_id IN (
    SELECT id FROM employees WHERE user_id = auth.uid()
  )
);

CREATE OR REPLACE FUNCTION is_team_manager(p_equipe TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM team_managers tm
    JOIN employees e ON e.id = tm.manager_employee_id
    WHERE tm.equipe = p_equipe 
    AND e.user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP POLICY IF EXISTS "Managers can view their team employees" ON employees;
CREATE POLICY "Managers can view their team employees"
ON employees FOR SELECT
USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  OR is_team_manager(equipe)
);

DROP POLICY IF EXISTS "Managers can view their team agenda entries" ON agenda_entries;
CREATE POLICY "Managers can view their team agenda entries"
ON agenda_entries FOR SELECT
USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  OR EXISTS (
    SELECT 1 FROM employees e 
    WHERE e.id = agenda_entries.employee_id 
    AND is_team_manager(e.equipe)
  )
);

DROP POLICY IF EXISTS "Managers can view their team monthly scores" ON monthly_scores;
CREATE POLICY "Managers can view their team monthly scores"
ON monthly_scores FOR SELECT
USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  OR EXISTS (
    SELECT 1 FROM employees e 
    WHERE e.id = monthly_scores.employee_id 
    AND is_team_manager(e.equipe)
  )
);

-- Partie 3 : Workflow de clôture mensuelle
CREATE TABLE IF NOT EXISTS closure_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_employee_id UUID NOT NULL REFERENCES employees(id),
  mois INTEGER NOT NULL,
  annee INTEGER NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  acknowledged BOOLEAN DEFAULT FALSE,
  UNIQUE(manager_employee_id, mois, annee)
);

ALTER TABLE closure_reminders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage closure reminders" ON closure_reminders;
CREATE POLICY "Admins can manage closure reminders"
ON closure_reminders FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

DROP POLICY IF EXISTS "Managers can view their reminders" ON closure_reminders;
CREATE POLICY "Managers can view their reminders"
ON closure_reminders FOR SELECT
USING (
  manager_employee_id IN (
    SELECT id FROM employees WHERE user_id = auth.uid()
  )
);