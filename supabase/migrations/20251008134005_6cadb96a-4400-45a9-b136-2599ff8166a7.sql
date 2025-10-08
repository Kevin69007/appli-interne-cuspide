-- Create table for work schedules/shifts
CREATE TABLE public.work_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  heure_debut TIME NOT NULL,
  heure_fin TIME NOT NULL,
  pause_minutes INTEGER DEFAULT 0,
  commentaire TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.work_schedules ENABLE ROW LEVEL SECURITY;

-- Admins and managers can manage all schedules
CREATE POLICY "Admins and managers can manage schedules"
ON public.work_schedules
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR is_manager())
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_manager());

-- Employees can view their own schedules and team schedules
CREATE POLICY "Employees can view schedules"
ON public.work_schedules
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM employees e1, employees e2
    WHERE e1.id = work_schedules.employee_id
    AND e2.user_id = auth.uid()
    AND (e1.id = e2.id OR e1.equipe = e2.equipe)
  )
);

-- Create index for performance
CREATE INDEX idx_work_schedules_employee_date ON public.work_schedules(employee_id, date);
CREATE INDEX idx_work_schedules_date ON public.work_schedules(date);

-- Trigger for updated_at
CREATE TRIGGER update_work_schedules_updated_at
BEFORE UPDATE ON public.work_schedules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();