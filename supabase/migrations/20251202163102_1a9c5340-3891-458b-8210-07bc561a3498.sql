-- Table for personal daily task planning (time slots)
CREATE TABLE public.daily_task_planning (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  planning_date DATE NOT NULL,
  start_hour INTEGER NOT NULL DEFAULT 8,
  duration_slots INTEGER NOT NULL DEFAULT 2,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(employee_id, task_id, planning_date)
);

-- Add columns for date change validation workflow
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS date_change_pending BOOLEAN DEFAULT false;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS date_change_requested_by UUID REFERENCES public.employees(id);
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS date_change_requested_at TIMESTAMPTZ;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS date_change_original_date DATE;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS date_change_new_date DATE;

-- Enable RLS on daily_task_planning
ALTER TABLE public.daily_task_planning ENABLE ROW LEVEL SECURITY;

-- Employees can manage their own planning
CREATE POLICY "Employees can manage their own planning"
ON public.daily_task_planning
FOR ALL
USING (EXISTS (
  SELECT 1 FROM employees WHERE employees.id = daily_task_planning.employee_id AND employees.user_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM employees WHERE employees.id = daily_task_planning.employee_id AND employees.user_id = auth.uid()
));

-- Managers can view all planning
CREATE POLICY "Managers can view all planning"
ON public.daily_task_planning
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR is_manager());

-- Index for faster queries
CREATE INDEX idx_daily_task_planning_employee_date ON public.daily_task_planning(employee_id, planning_date);
CREATE INDEX idx_tasks_date_change_pending ON public.tasks(created_by) WHERE date_change_pending = true;