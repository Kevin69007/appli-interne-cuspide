-- Fix infinite recursion in employees RLS policies

-- Drop all existing policies on employees
DROP POLICY IF EXISTS "Admins can manage all employees" ON public.employees;
DROP POLICY IF EXISTS "Managers can view all employees" ON public.employees;
DROP POLICY IF EXISTS "Managers can view their direct reports" ON public.employees;
DROP POLICY IF EXISTS "Managers can view their team employees" ON public.employees;
DROP POLICY IF EXISTS "Users can view their own employee record" ON public.employees;
DROP POLICY IF EXISTS "Managers can update their team" ON public.employees;
DROP POLICY IF EXISTS "Users can update their own employee record" ON public.employees;

-- Create simple, non-recursive policies

-- Admins: full access
CREATE POLICY "Admins have full access"
ON public.employees
FOR ALL
TO public
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Managers: can view and update all employees
CREATE POLICY "Managers can view all"
ON public.employees
FOR SELECT
TO public
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'manager'::app_role)
);

CREATE POLICY "Managers can update all"
ON public.employees
FOR UPDATE
TO public
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'manager'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'manager'::app_role)
);

-- Users: can view and update their own record
CREATE POLICY "Users can view own record"
ON public.employees
FOR SELECT
TO public
USING (
  user_id = auth.uid() 
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'manager'::app_role)
);

CREATE POLICY "Users can update own record"
ON public.employees
FOR UPDATE
TO public
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());