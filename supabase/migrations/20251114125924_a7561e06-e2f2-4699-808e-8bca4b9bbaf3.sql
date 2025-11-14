-- Ajouter la colonne manager_id dans la table employees
ALTER TABLE employees 
ADD COLUMN manager_id UUID REFERENCES employees(id);

-- Index pour améliorer les performances des requêtes
CREATE INDEX idx_employees_manager_id ON employees(manager_id);

-- Commentaire pour documenter la colonne
COMMENT ON COLUMN employees.manager_id IS 'Manager direct de cet employé';

-- Fonction pour vérifier si l'utilisateur connecté est le manager direct d'un employé
CREATE OR REPLACE FUNCTION is_direct_manager(p_employee_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM employees e1
    JOIN employees e2 ON e2.id = e1.manager_id
    WHERE e1.id = p_employee_id 
    AND e2.user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Nouvelle policy pour que les managers puissent voir leurs employés directs
DROP POLICY IF EXISTS "Managers can view their direct reports" ON employees;

CREATE POLICY "Managers can view their direct reports"
ON employees FOR SELECT
USING (
  manager_id IN (
    SELECT id FROM employees WHERE user_id = auth.uid()
  )
);

-- Nouvelle policy pour les tâches : managers peuvent voir les tâches de leurs employés directs
DROP POLICY IF EXISTS "Managers can view direct reports tasks" ON tasks;

CREATE POLICY "Managers can view direct reports tasks"
ON tasks FOR SELECT
USING (
  assigned_to IN (
    SELECT id FROM employees 
    WHERE manager_id IN (
      SELECT id FROM employees WHERE user_id = auth.uid()
    )
  )
);