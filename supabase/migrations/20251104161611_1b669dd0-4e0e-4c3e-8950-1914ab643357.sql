-- Création de la table kpi_objectifs pour définir des objectifs sur les KPI
CREATE TABLE IF NOT EXISTS public.kpi_objectifs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kpi_id UUID NOT NULL REFERENCES public.kpi_definitions(id) ON DELETE CASCADE,
  periode_debut DATE NOT NULL,
  periode_fin DATE,
  valeur_objectif NUMERIC NOT NULL,
  type_periode TEXT NOT NULL CHECK (type_periode IN ('monthly', 'yearly', 'weekly')),
  created_by UUID REFERENCES public.employees(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_kpi_objectifs_kpi_id ON public.kpi_objectifs(kpi_id);
CREATE INDEX IF NOT EXISTS idx_kpi_objectifs_periode ON public.kpi_objectifs(periode_debut, periode_fin);

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_kpi_objectifs_updated_at
  BEFORE UPDATE ON public.kpi_objectifs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Activation de la sécurité RLS
ALTER TABLE public.kpi_objectifs ENABLE ROW LEVEL SECURITY;

-- Policy : Les admins peuvent tout gérer
CREATE POLICY "Admins peuvent gérer les objectifs KPI"
  ON public.kpi_objectifs
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Policy : Les managers peuvent voir les objectifs
CREATE POLICY "Managers peuvent voir les objectifs KPI"
  ON public.kpi_objectifs
  FOR SELECT
  USING (is_manager());

-- Policy : Les responsables peuvent voir les objectifs de leurs KPI
CREATE POLICY "Responsables peuvent voir les objectifs de leurs KPI"
  ON public.kpi_objectifs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.kpi_definitions kd
      JOIN public.employees e ON e.id = kd.responsable_id
      WHERE kd.id = kpi_objectifs.kpi_id
        AND e.user_id = auth.uid()
    )
  );