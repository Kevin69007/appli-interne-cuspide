-- Create enums for the gamification system
CREATE TYPE public.categorie_agenda AS ENUM ('protocoles', 'objectifs', 'horaires', 'materiel', 'challenges');
CREATE TYPE public.statut_validation AS ENUM ('en_attente', 'valide', 'refuse');
CREATE TYPE public.gravite_erreur AS ENUM ('mineur', 'majeur', 'critique');
CREATE TYPE public.type_incident_materiel AS ENUM ('poste_sale', 'machine_non_eteinte', 'entretien_non_fait', 'autre');
CREATE TYPE public.statut_objectif AS ENUM ('atteint', 'en_cours', 'non_atteint');
CREATE TYPE public.type_absence AS ENUM ('retard', 'absence');
CREATE TYPE public.statut_score_mensuel AS ENUM ('ouvert', 'cloture', 'publie');
CREATE TYPE public.type_quiz AS ENUM ('technique', 'collegue', 'mood');

-- Create employees table
CREATE TABLE public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  prenom TEXT NOT NULL,
  nom TEXT NOT NULL,
  poste TEXT,
  atelier TEXT,
  equipe TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create agenda_entries table
CREATE TABLE public.agenda_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
  categorie public.categorie_agenda NOT NULL,
  type TEXT,
  motif TEXT,
  detail TEXT,
  photos TEXT[] DEFAULT '{}',
  points INTEGER DEFAULT 0,
  statut_validation public.statut_validation DEFAULT 'en_attente',
  auteur_id UUID REFERENCES public.profiles(id),
  commentaire_validation TEXT,
  gravite public.gravite_erreur,
  statut_objectif public.statut_objectif,
  type_absence public.type_absence,
  duree_minutes INTEGER,
  type_incident public.type_incident_materiel,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create quiz_monthly table
CREATE TABLE public.quiz_monthly (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mois INTEGER NOT NULL CHECK (mois BETWEEN 1 AND 12),
  annee INTEGER NOT NULL,
  titre TEXT NOT NULL,
  type public.type_quiz NOT NULL,
  contenu JSONB NOT NULL DEFAULT '{}',
  bareme JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (mois, annee, type)
);

-- Create quiz_responses table
CREATE TABLE public.quiz_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES public.quiz_monthly(id) ON DELETE CASCADE NOT NULL,
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
  reponses JSONB DEFAULT '{}',
  score NUMERIC,
  mood_note INTEGER CHECK (mood_note BETWEEN 1 AND 5),
  mood_commentaire TEXT,
  vote_collegue_id UUID REFERENCES public.employees(id),
  vote_justification TEXT,
  date_reponse TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (quiz_id, employee_id)
);

-- Create challenges table
CREATE TABLE public.challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titre TEXT NOT NULL,
  description TEXT,
  date_debut DATE NOT NULL,
  date_fin DATE NOT NULL,
  criteres JSONB DEFAULT '{}',
  recompense TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create challenge_progress table
CREATE TABLE public.challenge_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID REFERENCES public.challenges(id) ON DELETE CASCADE NOT NULL,
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
  points INTEGER DEFAULT 0,
  progression JSONB DEFAULT '{}',
  date_completion TIMESTAMPTZ,
  UNIQUE (challenge_id, employee_id)
);

-- Create monthly_scores table
CREATE TABLE public.monthly_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
  mois INTEGER NOT NULL CHECK (mois BETWEEN 1 AND 12),
  annee INTEGER NOT NULL,
  score_protocoles NUMERIC DEFAULT 0,
  score_objectifs NUMERIC DEFAULT 0,
  score_horaires NUMERIC DEFAULT 0,
  score_materiel NUMERIC DEFAULT 0,
  score_attitude NUMERIC DEFAULT 0,
  score_global NUMERIC DEFAULT 0,
  prime_montant NUMERIC DEFAULT 0,
  statut public.statut_score_mensuel DEFAULT 'ouvert',
  cloture_par UUID REFERENCES public.profiles(id),
  date_cloture TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (employee_id, mois, annee)
);

-- Create configuration table
CREATE TABLE public.configuration (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cle TEXT NOT NULL UNIQUE,
  valeur JSONB NOT NULL DEFAULT '{}',
  description TEXT,
  categorie TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  titre TEXT NOT NULL,
  message TEXT,
  lu BOOLEAN DEFAULT false,
  url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create audit_log table
CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  ancien_contenu JSONB,
  nouveau_contenu JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agenda_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_monthly ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuration ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Create security functions
CREATE OR REPLACE FUNCTION public.is_manager()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'manager'
  );
$$;

CREATE OR REPLACE FUNCTION public.can_auto_declare(p_categorie TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_allowed BOOLEAN;
BEGIN
  SELECT (valeur -> 'auto_declaration' ->> p_categorie)::BOOLEAN
  INTO v_allowed
  FROM public.configuration
  WHERE cle = 'permissions';
  
  RETURN COALESCE(v_allowed, false);
END;
$$;

CREATE OR REPLACE FUNCTION public.is_employee_team_member(p_employee_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.employees e1, public.employees e2
    WHERE e1.id = p_employee_id
    AND e2.user_id = auth.uid()
    AND e1.equipe = e2.equipe
  );
$$;

-- RLS Policies for employees
CREATE POLICY "Admins can manage all employees"
ON public.employees FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Managers can view team employees"
ON public.employees FOR SELECT
USING (is_manager() AND is_employee_team_member(id));

CREATE POLICY "Users can view their own employee record"
ON public.employees FOR SELECT
USING (user_id = auth.uid());

-- RLS Policies for agenda_entries
CREATE POLICY "Admins can manage all agenda entries"
ON public.agenda_entries FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Managers can manage team agenda entries"
ON public.agenda_entries FOR ALL
USING (is_manager() AND is_employee_team_member(employee_id));

CREATE POLICY "Employees can view their own entries"
ON public.agenda_entries FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.employees
  WHERE employees.id = agenda_entries.employee_id
  AND employees.user_id = auth.uid()
));

CREATE POLICY "Employees can insert auto-declared entries"
ON public.agenda_entries FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.employees
    WHERE employees.id = employee_id
    AND employees.user_id = auth.uid()
  )
  AND statut_validation = 'en_attente'
);

-- RLS Policies for quiz_monthly
CREATE POLICY "Admins can manage quizzes"
ON public.quiz_monthly FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Everyone can view active quizzes"
ON public.quiz_monthly FOR SELECT
USING (is_active = true);

-- RLS Policies for quiz_responses
CREATE POLICY "Admins and managers can view all responses"
ON public.quiz_responses FOR SELECT
USING (has_role(auth.uid(), 'admin') OR is_manager());

CREATE POLICY "Employees can insert their own responses"
ON public.quiz_responses FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.employees
    WHERE employees.id = employee_id
    AND employees.user_id = auth.uid()
  )
);

CREATE POLICY "Employees can view their own responses"
ON public.quiz_responses FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.employees
    WHERE employees.id = employee_id
    AND employees.user_id = auth.uid()
  )
);

-- RLS Policies for challenges
CREATE POLICY "Admins and managers can manage challenges"
ON public.challenges FOR ALL
USING (has_role(auth.uid(), 'admin') OR is_manager());

CREATE POLICY "Everyone can view active challenges"
ON public.challenges FOR SELECT
USING (is_active = true);

-- RLS Policies for challenge_progress
CREATE POLICY "Admins and managers can view all progress"
ON public.challenge_progress FOR SELECT
USING (has_role(auth.uid(), 'admin') OR is_manager());

CREATE POLICY "Employees can view their own progress"
ON public.challenge_progress FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.employees
    WHERE employees.id = employee_id
    AND employees.user_id = auth.uid()
  )
);

-- RLS Policies for monthly_scores
CREATE POLICY "Admins and managers can manage scores"
ON public.monthly_scores FOR ALL
USING (has_role(auth.uid(), 'admin') OR is_manager());

CREATE POLICY "Employees can view their own scores"
ON public.monthly_scores FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.employees
    WHERE employees.id = employee_id
    AND employees.user_id = auth.uid()
  )
);

-- RLS Policies for configuration
CREATE POLICY "Admins can manage configuration"
ON public.configuration FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Everyone can view configuration"
ON public.configuration FOR SELECT
USING (true);

-- RLS Policies for notifications
CREATE POLICY "Employees can manage their own notifications"
ON public.notifications FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.employees
    WHERE employees.id = employee_id
    AND employees.user_id = auth.uid()
  )
);

-- RLS Policies for audit_log
CREATE POLICY "Admins can view audit log"
ON public.audit_log FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Create triggers for updated_at
CREATE TRIGGER update_employees_updated_at
BEFORE UPDATE ON public.employees
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_agenda_entries_updated_at
BEFORE UPDATE ON public.agenda_entries
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_quiz_monthly_updated_at
BEFORE UPDATE ON public.quiz_monthly
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_challenges_updated_at
BEFORE UPDATE ON public.challenges
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_monthly_scores_updated_at
BEFORE UPDATE ON public.monthly_scores
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_configuration_updated_at
BEFORE UPDATE ON public.configuration
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default configuration
INSERT INTO public.configuration (cle, valeur, description, categorie) VALUES
('ponderations', '{"protocoles": 30, "objectifs": 30, "horaires": 20, "materiel": 10, "attitude": 10}'::jsonb, 'Pondérations pour le calcul du score mensuel', 'scoring'),
('baremes', '{"gravite_erreur": {"mineur": -1, "majeur": -3, "critique": -5}, "retard": {"leger": -1, "important": -3}}'::jsonb, 'Barèmes de points', 'scoring'),
('seuils', '{"prime_minimum": 80, "retard_leger_max_minutes": 15}'::jsonb, 'Seuils de validation', 'scoring'),
('permissions', '{"auto_declaration": {"protocoles": false, "objectifs": true, "horaires": false, "materiel": true, "challenges": false}}'::jsonb, 'Droits d''auto-déclaration par catégorie', 'permissions'),
('motifs_protocoles', '["Non-respect procédure de stérilisation", "Erreur de dosage", "Oubli de contrôle qualité", "Non-respect des délais", "Erreur de traçabilité"]'::jsonb, 'Liste des motifs d''erreur de protocole', 'listes'),
('types_objectifs', '["Production", "Qualité", "Formation", "Innovation", "Collaboration"]'::jsonb, 'Types d''objectifs', 'listes'),
('incidents_materiel', '["Poste non nettoyé", "Machine non éteinte", "Entretien non effectué", "Matériel endommagé", "Consommables gaspillés"]'::jsonb, 'Types d''incidents matériel', 'listes');