-- Supprimer l'ancienne policy qui bloque les admins
DROP POLICY IF EXISTS "Everyone can create tasks for non-admins" ON tasks;

-- Créer la nouvelle policy sans restriction admin
CREATE POLICY "Everyone can create tasks" ON tasks
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM employees
    WHERE employees.id = tasks.created_by 
    AND employees.user_id = auth.uid()
  )
);