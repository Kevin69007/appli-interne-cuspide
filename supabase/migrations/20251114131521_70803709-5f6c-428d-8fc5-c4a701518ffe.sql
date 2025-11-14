-- Allow managers and admins to view all user roles
CREATE POLICY "Managers can view all user roles"
ON public.user_roles
FOR SELECT
TO public
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'manager'::app_role)
);