-- Table de configuration des congés par employé
CREATE TABLE public.employee_leave_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  -- Période de référence (mois de début, 1-12)
  period_start_month INTEGER NOT NULL DEFAULT 1,
  -- Nombre total de jours de congés alloués
  total_days_allowed INTEGER NOT NULL DEFAULT 25,
  -- Année de référence actuelle
  reference_year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
  -- Type de calcul: 'ouvre' (lun-ven) ou 'ouvrable' (lun-sam)
  day_type TEXT NOT NULL DEFAULT 'ouvre' CHECK (day_type IN ('ouvre', 'ouvrable')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(employee_id, reference_year)
);

-- Enable RLS
ALTER TABLE public.employee_leave_config ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins and managers can manage leave config"
ON public.employee_leave_config
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR is_manager())
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_manager());

CREATE POLICY "Employees can view their own leave config"
ON public.employee_leave_config
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM employees
  WHERE employees.id = employee_leave_config.employee_id
  AND employees.user_id = auth.uid()
));

-- Trigger for updated_at
CREATE TRIGGER update_employee_leave_config_updated_at
BEFORE UPDATE ON public.employee_leave_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();