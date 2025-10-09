-- Modifier les RLS policies pour permettre à tout le monde de créer des tâches pour n'importe qui
DROP POLICY IF EXISTS "Users can create tasks for themselves" ON tasks;
DROP POLICY IF EXISTS "Managers and admins can create tasks for anyone" ON tasks;

-- Nouvelle policy : Tout le monde peut créer des tâches pour n'importe qui (sauf admin)
CREATE POLICY "Everyone can create tasks for non-admins"
ON tasks
FOR INSERT
WITH CHECK (
  -- L'utilisateur doit être authentifié et associé à un employé
  EXISTS (
    SELECT 1 FROM employees 
    WHERE id = tasks.created_by 
    AND user_id = auth.uid()
  )
  -- L'employé assigné ne doit pas être un admin
  AND NOT EXISTS (
    SELECT 1 FROM employees e
    JOIN user_roles ur ON ur.user_id = e.user_id
    WHERE e.id = tasks.assigned_to 
    AND ur.role = 'admin'
  )
);