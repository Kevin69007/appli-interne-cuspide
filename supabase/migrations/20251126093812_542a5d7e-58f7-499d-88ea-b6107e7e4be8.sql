-- Create module_visibility table
CREATE TABLE IF NOT EXISTS public.module_visibility (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_key text UNIQUE NOT NULL,
  module_name text NOT NULL,
  icon text NOT NULL,
  path text NOT NULL,
  is_external boolean DEFAULT false,
  visible_to_admin boolean DEFAULT true,
  visible_to_manager boolean DEFAULT true,
  visible_to_user boolean DEFAULT true,
  is_enabled boolean DEFAULT true,
  display_order int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.module_visibility ENABLE ROW LEVEL SECURITY;

-- Admins can manage modules
CREATE POLICY "Admins can manage module visibility"
ON public.module_visibility
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Everyone can view enabled modules
CREATE POLICY "Everyone can view enabled modules"
ON public.module_visibility
FOR SELECT
TO authenticated
USING (is_enabled = true);

-- Insert existing modules
INSERT INTO public.module_visibility (module_key, module_name, icon, path, is_external, visible_to_admin, visible_to_manager, visible_to_user, display_order) VALUES
('formation', 'Formation & Documentation', '📚', '/formation', false, true, true, true, 1),
('indicators', 'Indicateurs & Primes', '🎯', '/indicateurs-primes', false, true, true, true, 2),
('tasks', 'Tâches', '✅', '/taches', false, true, true, true, 3),
('communication', 'Communication Générale', '📢', '/communication-generale', false, true, true, true, 4),
('projects', 'Projets', '🗂️', '/projets', false, true, true, true, 5),
('meetings', 'Réunions', '🎤', '/reunions', false, true, true, true, 6),
('rh', 'Ressources Humaines', '🌴', '/conges-mood-bar', false, true, true, false, 7),
('detente', 'Détente', '🎮', '/detente', false, true, true, true, 8),
('translator', 'Traducteur', '🌐', 'https://interne-traducteur.cuspide.fr/', true, true, true, true, 9),
('stock', 'Commandes & Stock', '🛒', '/commandes-stock', false, true, true, true, 10),
('planning', 'Agenda', '📅', '/agenda', false, true, true, true, 11),
('direction', 'Suivi Direction', '📊', '/suivi-direction', false, true, true, false, 12);

-- Trigger to update updated_at
CREATE TRIGGER update_module_visibility_updated_at
BEFORE UPDATE ON public.module_visibility
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();