-- Tables pour le module Suivi Direction & Dashboard Objectifs

-- Table pointage pour les heures et taux d'activité
CREATE TABLE IF NOT EXISTS public.pointage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  heures NUMERIC(5,2) NOT NULL,
  taux_activite NUMERIC(5,2), -- Pourcentage
  saisi_par UUID REFERENCES public.employees(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(employee_id, date)
);

-- Table pour définir les KPI/chiffres à suivre
CREATE TABLE IF NOT EXISTS public.kpi_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  description TEXT,
  type_donnee TEXT NOT NULL, -- 'number', 'percentage', 'currency', 'integer'
  responsable_id UUID REFERENCES public.employees(id),
  recurrence TEXT NOT NULL, -- 'daily', 'weekly', 'monthly'
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.employees(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour les valeurs des KPI
CREATE TABLE IF NOT EXISTS public.kpi_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kpi_id UUID NOT NULL REFERENCES public.kpi_definitions(id) ON DELETE CASCADE,
  valeur NUMERIC(15,2) NOT NULL,
  periode_debut DATE NOT NULL,
  periode_fin DATE,
  saisi_par UUID REFERENCES public.employees(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour les objectifs individuels
CREATE TABLE IF NOT EXISTS public.objectifs_individuels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  type_periode TEXT NOT NULL, -- 'daily', 'weekly', 'monthly'
  valeur_cible NUMERIC(15,2) NOT NULL,
  valeur_realisee NUMERIC(15,2),
  unite TEXT, -- 'pieces', 'hours', 'percentage', etc.
  periode_debut DATE NOT NULL,
  periode_fin DATE,
  statut TEXT DEFAULT 'en_cours', -- 'en_cours', 'termine', 'modifie'
  modifie_par UUID REFERENCES public.employees(id),
  raison_modification TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour les tâches récurrentes de saisie
CREATE TABLE IF NOT EXISTS public.recurring_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titre TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL, -- 'pointage', 'kpi', 'objectif'
  responsable_id UUID NOT NULL REFERENCES public.employees(id),
  recurrence TEXT NOT NULL, -- 'daily', 'weekly', 'monthly'
  jour_semaine INTEGER, -- 1-7 pour weekly
  jour_mois INTEGER, -- 1-31 pour monthly
  heure_rappel TIME,
  lien_process TEXT, -- URL vers document ou vidéo
  type_process TEXT, -- 'pdf', 'word', 'video', 'link'
  is_active BOOLEAN DEFAULT true,
  derniere_execution TIMESTAMP WITH TIME ZONE,
  prochaine_execution TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES public.employees(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour l'historique des modifications d'objectifs
CREATE TABLE IF NOT EXISTS public.objectifs_modifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  objectif_id UUID NOT NULL REFERENCES public.objectifs_individuels(id) ON DELETE CASCADE,
  ancienne_valeur NUMERIC(15,2),
  nouvelle_valeur NUMERIC(15,2),
  modifie_par UUID REFERENCES public.employees(id),
  raison TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.pointage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpi_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpi_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.objectifs_individuels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.objectifs_modifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies pour pointage
CREATE POLICY "Admins et managers peuvent tout gérer sur pointage"
  ON public.pointage FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR is_manager());

CREATE POLICY "Employés peuvent voir leur pointage"
  ON public.pointage FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.employees
    WHERE employees.id = pointage.employee_id
    AND employees.user_id = auth.uid()
  ));

-- RLS Policies pour kpi_definitions
CREATE POLICY "Admins peuvent gérer les KPI definitions"
  ON public.kpi_definitions FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Managers peuvent voir les KPI definitions"
  ON public.kpi_definitions FOR SELECT
  USING (is_manager());

CREATE POLICY "Responsables peuvent voir leurs KPI"
  ON public.kpi_definitions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.employees
    WHERE employees.id = kpi_definitions.responsable_id
    AND employees.user_id = auth.uid()
  ));

-- RLS Policies pour kpi_values
CREATE POLICY "Admins et managers peuvent gérer les valeurs KPI"
  ON public.kpi_values FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR is_manager());

CREATE POLICY "Responsables peuvent saisir leurs KPI"
  ON public.kpi_values FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.kpi_definitions kd
    JOIN public.employees e ON e.id = kd.responsable_id
    WHERE kd.id = kpi_values.kpi_id
    AND e.user_id = auth.uid()
  ));

CREATE POLICY "Responsables peuvent voir leurs valeurs KPI"
  ON public.kpi_values FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.kpi_definitions kd
    JOIN public.employees e ON e.id = kd.responsable_id
    WHERE kd.id = kpi_values.kpi_id
    AND e.user_id = auth.uid()
  ));

-- RLS Policies pour objectifs_individuels
CREATE POLICY "Admins et managers peuvent gérer tous les objectifs"
  ON public.objectifs_individuels FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR is_manager());

CREATE POLICY "Employés peuvent créer leurs objectifs"
  ON public.objectifs_individuels FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.employees
    WHERE employees.id = objectifs_individuels.employee_id
    AND employees.user_id = auth.uid()
  ));

CREATE POLICY "Employés peuvent voir leurs objectifs"
  ON public.objectifs_individuels FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.employees
    WHERE employees.id = objectifs_individuels.employee_id
    AND employees.user_id = auth.uid()
  ));

CREATE POLICY "Employés peuvent modifier leurs objectifs en cours"
  ON public.objectifs_individuels FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.employees
      WHERE employees.id = objectifs_individuels.employee_id
      AND employees.user_id = auth.uid()
    ) AND statut = 'en_cours'
  );

-- RLS Policies pour recurring_tasks
CREATE POLICY "Admins peuvent gérer toutes les tâches récurrentes"
  ON public.recurring_tasks FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Managers peuvent voir les tâches récurrentes"
  ON public.recurring_tasks FOR SELECT
  USING (is_manager());

CREATE POLICY "Responsables peuvent voir leurs tâches"
  ON public.recurring_tasks FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.employees
    WHERE employees.id = recurring_tasks.responsable_id
    AND employees.user_id = auth.uid()
  ));

-- RLS Policies pour objectifs_modifications
CREATE POLICY "Admins et managers peuvent voir l'historique"
  ON public.objectifs_modifications FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR is_manager());

-- Triggers pour updated_at
CREATE TRIGGER update_pointage_updated_at
  BEFORE UPDATE ON public.pointage
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_kpi_definitions_updated_at
  BEFORE UPDATE ON public.kpi_definitions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_kpi_values_updated_at
  BEFORE UPDATE ON public.kpi_values
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_objectifs_individuels_updated_at
  BEFORE UPDATE ON public.objectifs_individuels
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_recurring_tasks_updated_at
  BEFORE UPDATE ON public.recurring_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes pour les performances
CREATE INDEX idx_pointage_employee_date ON public.pointage(employee_id, date);
CREATE INDEX idx_kpi_values_kpi_periode ON public.kpi_values(kpi_id, periode_debut);
CREATE INDEX idx_objectifs_employee_periode ON public.objectifs_individuels(employee_id, periode_debut);
CREATE INDEX idx_recurring_tasks_responsable ON public.recurring_tasks(responsable_id);
CREATE INDEX idx_recurring_tasks_prochaine_execution ON public.recurring_tasks(prochaine_execution) WHERE is_active = true;