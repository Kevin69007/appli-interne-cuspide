-- Ajouter la colonne created_by à projects
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.employees(id);

-- Mettre à jour les projets existants (attribuer au responsable par défaut)
UPDATE public.projects
SET created_by = responsable_id
WHERE created_by IS NULL;

-- Supprimer toutes les anciennes policies de projects
DROP POLICY IF EXISTS "Admins et managers peuvent créer des projets" ON public.projects;
DROP POLICY IF EXISTS "Admins et managers peuvent modifier les projets" ON public.projects;
DROP POLICY IF EXISTS "Admins et managers peuvent supprimer les projets" ON public.projects;
DROP POLICY IF EXISTS "Tout le monde peut voir les projets" ON public.projects;
DROP POLICY IF EXISTS "Admins et managers peuvent tout gérer sur projects" ON public.projects;
DROP POLICY IF EXISTS "Responsables peuvent voir leurs projets" ON public.projects;

-- Nouvelle policy : Tout le monde peut voir les projets
CREATE POLICY "Tous peuvent voir les projets"
ON public.projects FOR SELECT
USING (true);

-- Nouvelle policy : Seuls admins et managers peuvent créer
CREATE POLICY "Admin et manager peuvent créer"
ON public.projects FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_manager());

-- Nouvelle policy : Seuls admins et managers peuvent modifier
CREATE POLICY "Admin et manager peuvent modifier"
ON public.projects FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR is_manager())
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_manager());

-- Nouvelle policy : Seuls admins et managers peuvent supprimer
CREATE POLICY "Admin et manager peuvent supprimer"
ON public.projects FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role) OR is_manager());

-- Fonction pour vérifier si l'utilisateur est le créateur du projet
CREATE OR REPLACE FUNCTION public.is_project_creator(project_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM projects p
    JOIN employees e ON e.id = p.created_by
    WHERE p.id = project_id
      AND e.user_id = auth.uid()
  )
$$;

-- Fonction pour autoriser la clôture uniquement par le créateur ou admin
CREATE OR REPLACE FUNCTION public.can_close_project(project_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (
    has_role(auth.uid(), 'admin'::app_role) 
    OR is_project_creator(project_id)
  )
$$;