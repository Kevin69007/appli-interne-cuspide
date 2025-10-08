-- Drop existing broad policy and recreate with explicit policies
DROP POLICY IF EXISTS "Managers can manage team agenda entries" ON public.agenda_entries;

-- Policy for SELECT
CREATE POLICY "Managers can view team agenda entries"
ON public.agenda_entries
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR 
  (is_manager() AND is_employee_team_member(employee_id))
);

-- Policy for INSERT - Allow managers to insert entries for their team
CREATE POLICY "Managers can insert team agenda entries"
ON public.agenda_entries
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) 
  OR 
  (is_manager() AND is_employee_team_member(employee_id))
);

-- Policy for UPDATE
CREATE POLICY "Managers can update team agenda entries"
ON public.agenda_entries
FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR 
  (is_manager() AND is_employee_team_member(employee_id))
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) 
  OR 
  (is_manager() AND is_employee_team_member(employee_id))
);

-- Policy for DELETE
CREATE POLICY "Managers can delete team agenda entries"
ON public.agenda_entries
FOR DELETE
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR 
  (is_manager() AND is_employee_team_member(employee_id))
);