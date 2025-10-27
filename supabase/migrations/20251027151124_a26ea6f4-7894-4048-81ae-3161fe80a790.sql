-- Create enum types
CREATE TYPE project_status AS ENUM ('a_venir', 'en_cours', 'termine', 'en_pause');
CREATE TYPE postponement_status AS ENUM ('en_attente', 'approuve', 'refuse');

-- Table projects
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titre TEXT NOT NULL,
  description TEXT,
  responsable_id UUID REFERENCES public.employees(id),
  statut project_status DEFAULT 'a_venir',
  date_creation TIMESTAMP WITH TIME ZONE DEFAULT now(),
  date_echeance DATE,
  progression NUMERIC DEFAULT 0,
  is_priority BOOLEAN DEFAULT false,
  created_by UUID REFERENCES public.employees(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table project_tasks (liaison projet <-> tâches)
CREATE TABLE IF NOT EXISTS public.project_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  ordre INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(project_id, task_id)
);

-- Table project_meetings
CREATE TABLE IF NOT EXISTS public.project_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  titre TEXT NOT NULL,
  date_reunion TIMESTAMP WITH TIME ZONE NOT NULL,
  transcription TEXT,
  resume_ia TEXT,
  fichier_audio_url TEXT,
  participants JSONB DEFAULT '[]'::jsonb,
  decisions JSONB DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES public.employees(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table task_progress_comments
CREATE TABLE IF NOT EXISTS public.task_progress_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id),
  commentaire TEXT NOT NULL,
  pourcentage_avancement INTEGER CHECK (pourcentage_avancement >= 0 AND pourcentage_avancement <= 100),
  date_avancement TIMESTAMP WITH TIME ZONE DEFAULT now(),
  photos TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table task_postponements
CREATE TABLE IF NOT EXISTS public.task_postponements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  demandeur_id UUID NOT NULL REFERENCES public.employees(id),
  raison_imprevue TEXT NOT NULL,
  ancienne_date DATE NOT NULL,
  nouvelle_date_proposee DATE NOT NULL,
  statut postponement_status DEFAULT 'en_attente',
  validateur_id UUID REFERENCES public.employees(id),
  date_validation TIMESTAMP WITH TIME ZONE,
  commentaire_validateur TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add new columns to tasks table
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS is_priority BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS dernier_commentaire_avancement TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS avancement_pourcentage INTEGER DEFAULT 0 CHECK (avancement_pourcentage >= 0 AND avancement_pourcentage <= 100);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_project_tasks_project ON project_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_task ON project_tasks(task_id);
CREATE INDEX IF NOT EXISTS idx_meetings_project ON project_meetings(project_id);
CREATE INDEX IF NOT EXISTS idx_meetings_task ON project_meetings(task_id);
CREATE INDEX IF NOT EXISTS idx_progress_comments_task ON task_progress_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_postponements_task ON task_postponements(task_id);
CREATE INDEX IF NOT EXISTS idx_postponements_status ON task_postponements(statut);

-- Trigger to update project deadline automatically
CREATE OR REPLACE FUNCTION update_project_deadline()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_project_deadline_trigger
AFTER UPDATE OF date_echeance ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION update_project_deadline();

-- Trigger to update project progress automatically
CREATE OR REPLACE FUNCTION update_project_progress()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_project_progress_trigger
AFTER UPDATE OF statut ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION update_project_progress();

-- Trigger to update updated_at on projects
CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to update updated_at on meetings
CREATE TRIGGER update_meetings_updated_at
BEFORE UPDATE ON public.project_meetings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies for projects
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins et managers peuvent tout gérer sur projects"
ON public.projects FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR is_manager())
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_manager());

CREATE POLICY "Responsables peuvent voir leurs projets"
ON public.projects FOR SELECT
USING (
  responsable_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
);

CREATE POLICY "Membres peuvent voir projets liés à leurs tâches"
ON public.projects FOR SELECT
USING (
  id IN (
    SELECT DISTINCT pt.project_id 
    FROM public.project_tasks pt 
    JOIN public.tasks t ON t.id = pt.task_id 
    WHERE t.assigned_to IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
  )
);

-- RLS Policies for project_tasks
ALTER TABLE public.project_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins et managers peuvent gérer project_tasks"
ON public.project_tasks FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR is_manager())
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_manager());

CREATE POLICY "Membres peuvent voir leurs liaisons projet-tâches"
ON public.project_tasks FOR SELECT
USING (
  task_id IN (SELECT id FROM public.tasks WHERE assigned_to IN (SELECT id FROM public.employees WHERE user_id = auth.uid()))
);

-- RLS Policies for project_meetings
ALTER TABLE public.project_meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins et managers peuvent gérer meetings"
ON public.project_meetings FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR is_manager())
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_manager());

CREATE POLICY "Participants peuvent voir leurs meetings"
ON public.project_meetings FOR SELECT
USING (
  participants @> jsonb_build_array((SELECT id::text FROM public.employees WHERE user_id = auth.uid()))
);

-- RLS Policies for task_progress_comments
ALTER TABLE public.task_progress_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tout le monde peut voir les commentaires d'avancement"
ON public.task_progress_comments FOR SELECT
USING (true);

CREATE POLICY "Employés peuvent créer commentaires sur leurs tâches"
ON public.task_progress_comments FOR INSERT
WITH CHECK (
  task_id IN (SELECT id FROM public.tasks WHERE assigned_to IN (SELECT id FROM public.employees WHERE user_id = auth.uid()))
);

CREATE POLICY "Admins et managers peuvent créer commentaires"
ON public.task_progress_comments FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_manager());

-- RLS Policies for task_postponements
ALTER TABLE public.task_postponements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Demandeurs peuvent voir leurs reports"
ON public.task_postponements FOR SELECT
USING (
  demandeur_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
);

CREATE POLICY "Managers peuvent voir tous les reports"
ON public.task_postponements FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR is_manager());

CREATE POLICY "Employés peuvent créer reports sur leurs tâches"
ON public.task_postponements FOR INSERT
WITH CHECK (
  demandeur_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
  AND task_id IN (SELECT id FROM public.tasks WHERE assigned_to IN (SELECT id FROM public.employees WHERE user_id = auth.uid()))
);

CREATE POLICY "Managers peuvent mettre à jour reports"
ON public.task_postponements FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR is_manager())
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_manager());