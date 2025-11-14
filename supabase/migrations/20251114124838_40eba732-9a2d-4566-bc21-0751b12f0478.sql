-- Supprimer les anciennes policies UPDATE et DELETE
DROP POLICY IF EXISTS "Admin et manager peuvent modifier" ON public.projects;
DROP POLICY IF EXISTS "Admin et manager peuvent supprimer" ON public.projects;

-- Nouvelle policy UPDATE : seul l'admin ou le créateur peut modifier
CREATE POLICY "Admin ou créateur peuvent modifier"
ON public.projects FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR is_project_creator(id)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) 
  OR is_project_creator(id)
);

-- Nouvelle policy DELETE : seul l'admin ou le créateur peut supprimer
CREATE POLICY "Admin ou créateur peuvent supprimer"
ON public.projects FOR DELETE
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR is_project_creator(id)
);