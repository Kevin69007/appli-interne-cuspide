-- Create surveys table
CREATE TABLE public.surveys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titre TEXT NOT NULL,
  description TEXT,
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  date_debut DATE,
  date_fin DATE,
  is_active BOOLEAN DEFAULT true,
  type_destinataire destinataire_type NOT NULL DEFAULT 'tout_le_monde',
  equipes TEXT[],
  groupes TEXT[],
  allow_anonymous BOOLEAN DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create survey_responses table
CREATE TABLE public.survey_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  survey_id UUID NOT NULL REFERENCES public.surveys(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES public.employees(id),
  reponses JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_anonymous BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ideas table
CREATE TYPE public.statut_idee AS ENUM ('soumise', 'en_examen', 'approuvee', 'rejetee', 'implementee');

CREATE TABLE public.ideas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titre TEXT NOT NULL,
  description TEXT NOT NULL,
  employee_id UUID REFERENCES public.employees(id),
  is_anonymous BOOLEAN DEFAULT false,
  statut statut_idee DEFAULT 'soumise',
  commentaire_manager TEXT,
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;

-- RLS Policies for surveys
CREATE POLICY "Admins et managers peuvent gérer surveys"
ON public.surveys
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR is_manager());

CREATE POLICY "Employés peuvent voir surveys actives"
ON public.surveys
FOR SELECT
USING (
  is_active = true AND (
    type_destinataire = 'tout_le_monde' OR
    (type_destinataire = 'selection_equipe' AND EXISTS (
      SELECT 1 FROM employees WHERE user_id = auth.uid() AND equipe = ANY(surveys.equipes)
    )) OR
    (type_destinataire = 'groupe' AND EXISTS (
      SELECT 1 FROM employees e JOIN user_roles ur ON ur.user_id = e.user_id
      WHERE e.user_id = auth.uid() AND (ur.role::text = ANY(surveys.groupes) OR e.poste = ANY(surveys.groupes))
    ))
  )
);

-- RLS Policies for survey_responses
CREATE POLICY "Employés peuvent créer réponses"
ON public.survey_responses
FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM employees WHERE id = survey_responses.employee_id AND user_id = auth.uid())
  OR (is_anonymous = true AND auth.uid() IS NOT NULL)
);

CREATE POLICY "Admins et managers peuvent voir toutes réponses"
ON public.survey_responses
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR is_manager());

CREATE POLICY "Employés peuvent voir leurs réponses non-anonymes"
ON public.survey_responses
FOR SELECT
USING (
  is_anonymous = false AND EXISTS (
    SELECT 1 FROM employees WHERE id = survey_responses.employee_id AND user_id = auth.uid()
  )
);

-- RLS Policies for ideas
CREATE POLICY "Tous peuvent créer idées"
ON public.ideas
FOR INSERT
WITH CHECK (
  (EXISTS (SELECT 1 FROM employees WHERE id = ideas.employee_id AND user_id = auth.uid()))
  OR (is_anonymous = true AND auth.uid() IS NOT NULL)
);

CREATE POLICY "Admins et managers peuvent gérer idées"
ON public.ideas
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR is_manager());

CREATE POLICY "Employés peuvent voir leurs idées non-anonymes"
ON public.ideas
FOR SELECT
USING (
  is_anonymous = false AND EXISTS (
    SELECT 1 FROM employees WHERE id = ideas.employee_id AND user_id = auth.uid()
  )
);

-- Trigger for updated_at on surveys
CREATE TRIGGER update_surveys_updated_at
BEFORE UPDATE ON public.surveys
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for updated_at on ideas
CREATE TRIGGER update_ideas_updated_at
BEFORE UPDATE ON public.ideas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();