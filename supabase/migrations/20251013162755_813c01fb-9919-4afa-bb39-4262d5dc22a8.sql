-- Add boomerang columns to tasks table
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS boomerang_active boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS boomerang_original_owner uuid REFERENCES public.employees(id),
ADD COLUMN IF NOT EXISTS boomerang_current_holder uuid REFERENCES public.employees(id),
ADD COLUMN IF NOT EXISTS boomerang_deadline timestamp with time zone,
ADD COLUMN IF NOT EXISTS boomerang_duration_hours integer,
ADD COLUMN IF NOT EXISTS boomerang_history jsonb DEFAULT '[]'::jsonb;

-- Update RLS policies to include boomerang visibility
DROP POLICY IF EXISTS "Users can view their tasks" ON public.tasks;

CREATE POLICY "Users can view their tasks"
ON public.tasks
FOR SELECT
USING (
  -- Tasks assigned to the user
  EXISTS (
    SELECT 1 FROM employees
    WHERE employees.id = tasks.assigned_to
    AND employees.user_id = auth.uid()
  )
  OR
  -- Tasks created by the user
  EXISTS (
    SELECT 1 FROM employees
    WHERE employees.id = tasks.created_by
    AND employees.user_id = auth.uid()
  )
  OR
  -- Tasks where user is boomerang current holder
  EXISTS (
    SELECT 1 FROM employees
    WHERE employees.id = tasks.boomerang_current_holder
    AND employees.user_id = auth.uid()
  )
  OR
  -- Tasks where user is boomerang original owner
  EXISTS (
    SELECT 1 FROM employees
    WHERE employees.id = tasks.boomerang_original_owner
    AND employees.user_id = auth.uid()
  )
);