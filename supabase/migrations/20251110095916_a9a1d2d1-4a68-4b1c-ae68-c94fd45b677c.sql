-- Supprimer toutes les policies existantes sur projects
DROP POLICY IF EXISTS "Admins et managers peuvent tout gérer sur projects" ON projects;
DROP POLICY IF EXISTS "Responsables peuvent voir leurs projets" ON projects;
DROP POLICY IF EXISTS "Membres peuvent voir projets liés à leurs tâches" ON projects;

-- Créer des policies explicites pour les admins et managers

-- Policy SELECT : Admins et managers peuvent voir tous les projets
CREATE POLICY "Admins et managers peuvent voir tous les projets" ON projects
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR is_manager());

-- Policy INSERT : Admins et managers peuvent créer des projets
CREATE POLICY "Admins et managers peuvent créer des projets" ON projects
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_manager());

-- Policy UPDATE : Admins et managers peuvent modifier tous les projets
CREATE POLICY "Admins et managers peuvent modifier tous les projets" ON projects
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR is_manager())
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_manager());

-- Policy DELETE : Admins et managers peuvent supprimer tous les projets
CREATE POLICY "Admins et managers peuvent supprimer tous les projets" ON projects
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role) OR is_manager());

-- Policy SELECT pour les responsables de projets
CREATE POLICY "Responsables peuvent voir leurs projets" ON projects
FOR SELECT
USING (
  responsable_id IN (
    SELECT id FROM employees WHERE user_id = auth.uid()
  )
);

-- Policy SELECT pour les membres d'équipe ayant des tâches liées
CREATE POLICY "Membres peuvent voir projets liés à leurs tâches" ON projects
FOR SELECT
USING (
  id IN (
    SELECT DISTINCT pt.project_id
    FROM project_tasks pt
    JOIN tasks t ON t.id = pt.task_id
    WHERE t.assigned_to IN (
      SELECT id FROM employees WHERE user_id = auth.uid()
    )
  )
);