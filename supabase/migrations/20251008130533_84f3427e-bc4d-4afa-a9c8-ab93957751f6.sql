-- Drop existing policy
DROP POLICY IF EXISTS "Employees can manage their own notifications" ON public.notifications;

-- Create separate policies for better control
CREATE POLICY "Employees can view their own notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM employees
    WHERE employees.id = notifications.employee_id
    AND employees.user_id = auth.uid()
  )
);

CREATE POLICY "Employees can update their own notifications"
ON public.notifications
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM employees
    WHERE employees.id = notifications.employee_id
    AND employees.user_id = auth.uid()
  )
);

CREATE POLICY "Employees can delete their own notifications"
ON public.notifications
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM employees
    WHERE employees.id = notifications.employee_id
    AND employees.user_id = auth.uid()
  )
);

CREATE POLICY "Authenticated users can create notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (true);