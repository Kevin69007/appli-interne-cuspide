-- Création de la table pour les communications générales
CREATE TYPE public.destinataire_type AS ENUM ('tout_le_monde', 'selection_equipe', 'groupe');

CREATE TABLE public.communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titre TEXT NOT NULL,
  contenu TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  
  -- Paramètres de destinataire
  type_destinataire destinataire_type NOT NULL DEFAULT 'tout_le_monde',
  equipes TEXT[], -- Liste des équipes si sélection manuelle
  groupes TEXT[], -- Liste des groupes (admin, prothesiste, etc.)
  
  -- Options
  require_confirmation BOOLEAN DEFAULT false,
  show_in_calendar BOOLEAN DEFAULT false,
  date_expiration DATE,
  
  is_active BOOLEAN DEFAULT true
);

-- Table pour tracker les lectures
CREATE TABLE public.communication_lectures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  communication_id UUID REFERENCES public.communications(id) ON DELETE CASCADE NOT NULL,
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
  lu_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(communication_id, employee_id)
);

-- Enable RLS
ALTER TABLE public.communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_lectures ENABLE ROW LEVEL SECURITY;

-- Policies pour communications
CREATE POLICY "Admins et managers peuvent gérer communications"
ON public.communications
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR is_manager());

CREATE POLICY "Employés peuvent voir leurs communications"
ON public.communications
FOR SELECT
USING (
  is_active = true AND (
    type_destinataire = 'tout_le_monde'
    OR (type_destinataire = 'selection_equipe' AND EXISTS (
      SELECT 1 FROM employees 
      WHERE user_id = auth.uid() 
      AND equipe = ANY(communications.equipes)
    ))
    OR (type_destinataire = 'groupe' AND EXISTS (
      SELECT 1 FROM employees e
      JOIN user_roles ur ON ur.user_id = e.user_id
      WHERE e.user_id = auth.uid()
      AND (
        (ur.role::text = ANY(communications.groupes))
        OR (e.poste = ANY(communications.groupes))
      )
    ))
  )
);

-- Policies pour lectures
CREATE POLICY "Admins et managers peuvent voir lectures"
ON public.communication_lectures
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR is_manager());

CREATE POLICY "Employés peuvent marquer comme lu"
ON public.communication_lectures
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM employees 
    WHERE id = communication_lectures.employee_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Employés peuvent voir leurs lectures"
ON public.communication_lectures
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM employees 
    WHERE id = communication_lectures.employee_id 
    AND user_id = auth.uid()
  )
);

-- Trigger pour updated_at
CREATE TRIGGER update_communications_updated_at
BEFORE UPDATE ON public.communications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();