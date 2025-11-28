-- Create videos storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('videos', 'videos', false);

-- Create video_tutorials table for module help videos
CREATE TABLE public.video_tutorials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_key TEXT NOT NULL,
  titre TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.employees(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Create video_communications table for video announcements
CREATE TABLE public.video_communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titre TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  type_destinataire destinataire_type NOT NULL DEFAULT 'tout_le_monde',
  equipes TEXT[],
  groupes TEXT[],
  employee_ids UUID[],
  require_confirmation BOOLEAN NOT NULL DEFAULT true,
  show_on_homepage BOOLEAN NOT NULL DEFAULT true,
  date_expiration DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.employees(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create video_communication_lectures table for tracking views
CREATE TABLE public.video_communication_lectures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_communication_id UUID NOT NULL REFERENCES public.video_communications(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(video_communication_id, employee_id)
);

-- Enable RLS
ALTER TABLE public.video_tutorials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_communication_lectures ENABLE ROW LEVEL SECURITY;

-- RLS Policies for video_tutorials
CREATE POLICY "Admins peuvent gérer les tutoriels vidéo"
  ON public.video_tutorials
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Tout le monde peut voir les tutoriels actifs"
  ON public.video_tutorials
  FOR SELECT
  USING (is_active = true);

-- RLS Policies for video_communications
CREATE POLICY "Admins et managers peuvent gérer vidéos communications"
  ON public.video_communications
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR is_manager())
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_manager());

CREATE POLICY "Employés peuvent voir leurs vidéos communications"
  ON public.video_communications
  FOR SELECT
  USING (
    is_active = true AND (
      type_destinataire = 'tout_le_monde' OR
      (type_destinataire = 'selection_equipe' AND EXISTS (
        SELECT 1 FROM employees 
        WHERE employees.user_id = auth.uid() 
        AND employees.equipe = ANY(video_communications.equipes)
      )) OR
      (type_destinataire = 'groupe' AND EXISTS (
        SELECT 1 FROM employees e
        JOIN user_roles ur ON ur.user_id = e.user_id
        WHERE e.user_id = auth.uid() 
        AND (ur.role::text = ANY(video_communications.groupes) OR e.poste = ANY(video_communications.groupes))
      )) OR
      (type_destinataire = 'selection_employes' AND EXISTS (
        SELECT 1 FROM employees
        WHERE employees.user_id = auth.uid()
        AND employees.id = ANY(video_communications.employee_ids)
      ))
    )
  );

-- RLS Policies for video_communication_lectures
CREATE POLICY "Employés peuvent marquer vidéo comme vue"
  ON public.video_communication_lectures
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = video_communication_lectures.employee_id
      AND employees.user_id = auth.uid()
    )
  );

CREATE POLICY "Employés peuvent voir leurs lectures vidéo"
  ON public.video_communication_lectures
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = video_communication_lectures.employee_id
      AND employees.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins et managers peuvent voir toutes les lectures vidéo"
  ON public.video_communication_lectures
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR is_manager());

-- Storage policies for videos bucket
CREATE POLICY "Admins peuvent tout faire avec les vidéos"
  ON storage.objects
  FOR ALL
  USING (bucket_id = 'videos' AND has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (bucket_id = 'videos' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Employés peuvent lire les vidéos"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'videos');

-- Trigger for updated_at on video_tutorials
CREATE TRIGGER update_video_tutorials_updated_at
  BEFORE UPDATE ON public.video_tutorials
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for updated_at on video_communications
CREATE TRIGGER update_video_communications_updated_at
  BEFORE UPDATE ON public.video_communications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_video_tutorials_module_key ON public.video_tutorials(module_key);
CREATE INDEX idx_video_tutorials_is_active ON public.video_tutorials(is_active);
CREATE INDEX idx_video_communications_is_active ON public.video_communications(is_active);
CREATE INDEX idx_video_communications_created_at ON public.video_communications(created_at DESC);
CREATE INDEX idx_video_communication_lectures_video_id ON public.video_communication_lectures(video_communication_id);
CREATE INDEX idx_video_communication_lectures_employee_id ON public.video_communication_lectures(employee_id);