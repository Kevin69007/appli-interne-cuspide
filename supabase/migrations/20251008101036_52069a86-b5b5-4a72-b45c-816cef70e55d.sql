-- Phase 1: Migrations pour le système de tâches et événements

-- 1. Modifier l'enum type_incident_materiel
ALTER TYPE type_incident_materiel RENAME TO type_incident_materiel_old;
CREATE TYPE type_incident_materiel AS ENUM ('retard', 'negligence', 'erreur_protocole', 'autre');

-- Mettre à jour les valeurs existantes
ALTER TABLE agenda_entries 
  ALTER COLUMN type_incident TYPE type_incident_materiel 
  USING (
    CASE type_incident::text
      WHEN 'retard' THEN 'retard'::type_incident_materiel
      WHEN 'oubli_materiel' THEN 'autre'::type_incident_materiel
      WHEN 'erreur_protocole' THEN 'erreur_protocole'::type_incident_materiel
      WHEN 'autre' THEN 'autre'::type_incident_materiel
      ELSE 'autre'::type_incident_materiel
    END
  );

DROP TYPE type_incident_materiel_old;

-- 2. Modifier l'enum type_absence
ALTER TYPE type_absence RENAME TO type_absence_old;
CREATE TYPE type_absence AS ENUM ('demande_conges', 'arret_maladie', 'injustifie');

-- Mettre à jour les valeurs existantes
ALTER TABLE agenda_entries 
  ALTER COLUMN type_absence TYPE type_absence 
  USING (
    CASE type_absence::text
      WHEN 'retard' THEN 'injustifie'::type_absence
      WHEN 'absence' THEN 'injustifie'::type_absence
      ELSE 'injustifie'::type_absence
    END
  );

DROP TYPE type_absence_old;

-- 3. Modifier l'enum categorie_agenda pour remplacer 'formation' par 'a_faire'
ALTER TYPE categorie_agenda RENAME TO categorie_agenda_old;
CREATE TYPE categorie_agenda AS ENUM (
  'protocoles', 'objectifs', 'horaires', 'materiel', 
  'attitude', 'absence', 'incident', 'a_faire'
);

-- Mettre à jour les valeurs existantes
ALTER TABLE agenda_entries 
  ALTER COLUMN categorie TYPE categorie_agenda 
  USING (
    CASE categorie::text
      WHEN 'formation' THEN 'a_faire'::categorie_agenda
      ELSE categorie::text::categorie_agenda
    END
  );

DROP TYPE categorie_agenda_old;

-- 4. Créer la table tasks
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titre TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES public.employees(id) NOT NULL,
  assigned_to UUID REFERENCES public.employees(id) NOT NULL,
  date_echeance DATE NOT NULL,
  statut TEXT DEFAULT 'en_cours' CHECK (statut IN ('en_cours', 'terminee', 'annulee')),
  priorite TEXT DEFAULT 'normale' CHECK (priorite IN ('basse', 'normale', 'haute')),
  recurrence JSONB DEFAULT NULL,
  depend_de UUID REFERENCES public.employees(id),
  parent_task_id UUID REFERENCES public.tasks(id),
  commentaires JSONB DEFAULT '[]'::jsonb,
  rappels JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Activer RLS sur tasks
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Trigger pour updated_at
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Créer les policies RLS pour tasks

-- Tout le monde peut voir les tâches qui le concernent
CREATE POLICY "Users can view their tasks"
ON public.tasks
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.employees
    WHERE id = tasks.assigned_to AND user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.employees
    WHERE id = tasks.depend_de AND user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.employees
    WHERE id = tasks.created_by AND user_id = auth.uid()
  )
);

-- Utilisateurs peuvent créer des tâches pour eux-mêmes
CREATE POLICY "Users can create tasks for themselves"
ON public.tasks
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.employees e1, public.employees e2
    WHERE e1.id = tasks.created_by
    AND e2.id = tasks.assigned_to
    AND e1.user_id = auth.uid()
    AND e2.user_id = auth.uid()
  )
);

-- Managers et admins peuvent créer des tâches pour n'importe qui
CREATE POLICY "Managers and admins can create tasks for anyone"
ON public.tasks
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR is_manager()
);

-- Utilisateurs peuvent modifier leurs propres tâches
CREATE POLICY "Users can update their own tasks"
ON public.tasks
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.employees
    WHERE (id = tasks.assigned_to OR id = tasks.created_by)
    AND user_id = auth.uid()
  )
);

-- Managers et admins peuvent tout modifier
CREATE POLICY "Managers and admins can update all tasks"
ON public.tasks
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR is_manager());

-- Managers et admins peuvent supprimer toutes les tâches
CREATE POLICY "Managers and admins can delete all tasks"
ON public.tasks
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role) OR is_manager());

-- Utilisateurs peuvent supprimer leurs propres tâches
CREATE POLICY "Users can delete their own tasks"
ON public.tasks
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.employees
    WHERE id = tasks.created_by AND user_id = auth.uid()
  )
);

-- 6. Créer un index sur les tâches pour optimiser les requêtes
CREATE INDEX idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX idx_tasks_depend_de ON public.tasks(depend_de);
CREATE INDEX idx_tasks_date_echeance ON public.tasks(date_echeance);
CREATE INDEX idx_tasks_created_by ON public.tasks(created_by);
CREATE INDEX idx_tasks_parent_task_id ON public.tasks(parent_task_id) WHERE parent_task_id IS NOT NULL;