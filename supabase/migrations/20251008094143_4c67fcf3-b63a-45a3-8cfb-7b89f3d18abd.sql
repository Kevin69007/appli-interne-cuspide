-- Allow managers to view all employees instead of just their team
DROP POLICY IF EXISTS "Managers can view team employees" ON public.employees;

CREATE POLICY "Managers can view all employees"
ON public.employees
FOR SELECT
USING (is_manager());