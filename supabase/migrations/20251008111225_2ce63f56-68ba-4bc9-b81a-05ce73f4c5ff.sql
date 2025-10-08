-- Simplify SELECT policy for managers to view all agenda entries (not just team members)
DROP POLICY IF EXISTS "Managers can view team agenda entries" ON public.agenda_entries;

CREATE POLICY "Managers can view agenda entries"
ON public.agenda_entries
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR 
  is_manager()
  OR
  (EXISTS (
    SELECT 1 FROM employees
    WHERE employees.id = agenda_entries.employee_id 
    AND employees.user_id = auth.uid()
  ))
);