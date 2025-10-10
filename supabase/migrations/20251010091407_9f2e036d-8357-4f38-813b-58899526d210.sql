-- Correction des politiques RLS pour la table employees
-- Permet aux admins d'insérer des employés

DROP POLICY IF EXISTS "Admins can manage all employees" ON public.employees;

-- Politique pour permettre aux admins de tout faire (INSERT, UPDATE, DELETE)
CREATE POLICY "Admins can manage all employees"
ON public.employees
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));