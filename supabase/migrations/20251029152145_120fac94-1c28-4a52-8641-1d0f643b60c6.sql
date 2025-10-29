-- ============================================
-- MIGRATION: Système Objectifs & Primes Complet
-- ============================================

-- 1. Créer ENUM pour les types de gravité
CREATE TYPE gravite_type AS ENUM ('mineure', 'moyenne', 'majeure');

-- 2. Créer table bonus_malus_config
CREATE TABLE public.bonus_malus_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  gravite gravite_type,
  points INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(event_type, gravite)
);

-- 3. Créer table annual_cagnotte
CREATE TABLE public.annual_cagnotte (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  annee INTEGER NOT NULL,
  total_points INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(employee_id, annee)
);

-- 4. Créer table reward_catalog
CREATE TABLE public.reward_catalog (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titre TEXT NOT NULL,
  description TEXT,
  points_required INTEGER NOT NULL,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Créer table reward_redemptions
CREATE TABLE public.reward_redemptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  reward_id UUID NOT NULL REFERENCES public.reward_catalog(id) ON DELETE CASCADE,
  points_spent INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  redeemed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  delivered_at TIMESTAMP WITH TIME ZONE,
  notes TEXT
);

-- 6. Créer table best_of_month
CREATE TABLE public.best_of_month (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  mois INTEGER NOT NULL,
  annee INTEGER NOT NULL,
  bonus_points INTEGER NOT NULL,
  validated_by UUID REFERENCES public.employees(id),
  validated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(mois, annee)
);

-- 7. Modifier table monthly_scores
ALTER TABLE public.monthly_scores 
ADD COLUMN IF NOT EXISTS bonus_points NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS malus_points NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS projection_status TEXT,
ADD COLUMN IF NOT EXISTS projection_percentage NUMERIC DEFAULT 0;

-- 8. Modifier table agenda_entries
ALTER TABLE public.agenda_entries 
ADD COLUMN IF NOT EXISTS valeur_declaree NUMERIC,
ADD COLUMN IF NOT EXISTS valeur_controlee NUMERIC,
ADD COLUMN IF NOT EXISTS points_objectif INTEGER,
ADD COLUMN IF NOT EXISTS ecart_pourcentage NUMERIC;

-- 9. Insérer configuration initiale
INSERT INTO public.configuration (cle, categorie, valeur, description) VALUES
('objectifs_points_total', 'objectifs_primes', '100', 'Total de points disponibles pour les objectifs du mois'),
('meilleur_mois_bonus', 'objectifs_primes', '20', 'Bonus en points pour le meilleur du mois'),
('auto_declaration_tolerance_tiers', 'objectifs_primes', 
  '{"tier1": {"min": 0, "max": 10, "malus": 0}, "tier2": {"min": 10, "max": 20, "malus": -5}, "tier3": {"min": 20, "max": 100, "malus": -15}}'::jsonb,
  'Paliers de tolérance pour l''auto-déclaration avec malus associés')
ON CONFLICT (cle) DO NOTHING;

-- 10. Pré-remplir bonus_malus_config avec valeurs par défaut
INSERT INTO public.bonus_malus_config (event_type, gravite, points, is_active, description) VALUES
-- Incidents
('incident', 'mineure', -2, true, 'Incident mineur'),
('incident', 'moyenne', -5, true, 'Incident moyen'),
('incident', 'majeure', -15, true, 'Incident majeur'),

-- Retards
('retard', 'mineure', -2, true, 'Retard mineur (< 15 min)'),
('retard', 'moyenne', -5, true, 'Retard moyen (15-30 min)'),
('retard', 'majeure', -10, true, 'Retard majeur (> 30 min)'),

-- Erreurs protocole
('erreur_protocole', 'mineure', -3, true, 'Erreur protocole mineure'),
('erreur_protocole', 'moyenne', -8, true, 'Erreur protocole moyenne'),
('erreur_protocole', 'majeure', -20, true, 'Erreur protocole majeure'),

-- Tâches
('tache_a_temps', NULL, 3, true, 'Tâche complétée à temps'),
('tache_standard_retard', NULL, -5, true, 'Tâche standard en retard'),
('tache_entretien_retard', NULL, -15, true, 'Tâche d''entretien en retard'),

-- Participation jeu
('participation_jeu_hebdo', NULL, 5, true, 'Participation au jeu hebdomadaire'),

-- Absences
('absence_injustifiee', NULL, -20, true, 'Absence injustifiée')
ON CONFLICT (event_type, gravite) DO NOTHING;

-- 11. RLS Policies pour bonus_malus_config
ALTER TABLE public.bonus_malus_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage bonus_malus_config"
ON public.bonus_malus_config
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Everyone can view bonus_malus_config"
ON public.bonus_malus_config
FOR SELECT
USING (true);

-- 12. RLS Policies pour annual_cagnotte
ALTER TABLE public.annual_cagnotte ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and managers can manage cagnotte"
ON public.annual_cagnotte
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR is_manager())
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_manager());

CREATE POLICY "Employees can view their own cagnotte"
ON public.annual_cagnotte
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.employees
  WHERE employees.id = annual_cagnotte.employee_id
  AND employees.user_id = auth.uid()
));

-- 13. RLS Policies pour reward_catalog
ALTER TABLE public.reward_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage reward catalog"
ON public.reward_catalog
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Everyone can view active rewards"
ON public.reward_catalog
FOR SELECT
USING (is_active = true);

-- 14. RLS Policies pour reward_redemptions
ALTER TABLE public.reward_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all redemptions"
ON public.reward_redemptions
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR is_manager());

CREATE POLICY "Employees can create their own redemptions"
ON public.reward_redemptions
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.employees
  WHERE employees.id = reward_redemptions.employee_id
  AND employees.user_id = auth.uid()
));

CREATE POLICY "Employees can view their own redemptions"
ON public.reward_redemptions
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.employees
  WHERE employees.id = reward_redemptions.employee_id
  AND employees.user_id = auth.uid()
));

-- 15. RLS Policies pour best_of_month
ALTER TABLE public.best_of_month ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage best of month"
ON public.best_of_month
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Everyone can view best of month"
ON public.best_of_month
FOR SELECT
USING (true);

-- 16. Créer trigger pour updated_at
CREATE TRIGGER update_bonus_malus_config_updated_at
BEFORE UPDATE ON public.bonus_malus_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_annual_cagnotte_updated_at
BEFORE UPDATE ON public.annual_cagnotte
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reward_catalog_updated_at
BEFORE UPDATE ON public.reward_catalog
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 17. Créer index pour performances
CREATE INDEX idx_bonus_malus_config_event_type ON public.bonus_malus_config(event_type);
CREATE INDEX idx_bonus_malus_config_is_active ON public.bonus_malus_config(is_active);
CREATE INDEX idx_annual_cagnotte_employee ON public.annual_cagnotte(employee_id, annee);
CREATE INDEX idx_reward_redemptions_employee ON public.reward_redemptions(employee_id);
CREATE INDEX idx_best_of_month_date ON public.best_of_month(annee, mois);