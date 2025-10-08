-- Fix RLS policy for employees table to allow admins to insert
DROP POLICY IF EXISTS "Admins can manage all employees" ON public.employees;

CREATE POLICY "Admins can manage all employees" 
ON public.employees 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));