-- Correction du search_path pour les fonctions créées précédemment
CREATE OR REPLACE FUNCTION recalculate_monthly_score_function()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_employee_id uuid;
  v_month integer;
  v_year integer;
  v_score_objectifs numeric := 0;
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

  -- Calculer le score des objectifs
  SELECT COALESCE(SUM(points_objectif), 0)
  INTO v_score_objectifs
  FROM agenda_entries
  WHERE employee_id = v_employee_id
    AND EXTRACT(MONTH FROM date) = v_month
    AND EXTRACT(YEAR FROM date) = v_year
    AND categorie = 'objectifs'
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
  v_score_global := v_score_objectifs + v_bonus_points + v_malus_points;

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
    score_objectifs,
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
    v_score_objectifs,
    v_bonus_points,
    v_malus_points,
    v_score_global,
    v_projection_status,
    v_projection_percentage,
    NOW()
  )
  ON CONFLICT (employee_id, mois, annee) 
  DO UPDATE SET
    score_objectifs = EXCLUDED.score_objectifs,
    bonus_points = EXCLUDED.bonus_points,
    malus_points = EXCLUDED.malus_points,
    score_global = EXCLUDED.score_global,
    projection_status = EXCLUDED.projection_status,
    projection_percentage = EXCLUDED.projection_percentage,
    updated_at = NOW();

  RETURN NEW;
END;
$$;

-- Correction du search_path pour la fonction de mise à jour de la cagnotte
CREATE OR REPLACE FUNCTION update_annual_cagnotte_function()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_points_excedent numeric;
BEGIN
  -- Calculer les points excédentaires (score > 100)
  v_points_excedent := NEW.score_global - 100;

  -- Mettre à jour ou créer la cagnotte annuelle
  INSERT INTO annual_cagnotte (
    employee_id,
    annee,
    total_points,
    updated_at
  ) VALUES (
    NEW.employee_id,
    NEW.annee,
    GREATEST(0, v_points_excedent),
    NOW()
  )
  ON CONFLICT (employee_id, annee)
  DO UPDATE SET
    total_points = annual_cagnotte.total_points + GREATEST(0, v_points_excedent),
    updated_at = NOW();

  RETURN NEW;
END;
$$;