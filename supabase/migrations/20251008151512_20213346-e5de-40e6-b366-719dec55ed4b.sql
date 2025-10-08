-- Add maintenance-specific columns to tasks table
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS machine_piece TEXT,
ADD COLUMN IF NOT EXISTS maintenance_type TEXT CHECK (maintenance_type IN ('machine', 'piece', NULL)),
ADD COLUMN IF NOT EXISTS photos TEXT[] DEFAULT '{}';

-- Create maintenance_log table for tracking maintenance history
CREATE TABLE IF NOT EXISTS maintenance_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  machine_piece TEXT NOT NULL,
  maintenance_type TEXT NOT NULL CHECK (maintenance_type IN ('machine', 'piece')),
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_by UUID REFERENCES employees(id),
  photos TEXT[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on maintenance_log
ALTER TABLE maintenance_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for maintenance_log
CREATE POLICY "Managers and admins can view all maintenance logs"
ON maintenance_log FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR is_manager()
);

CREATE POLICY "Managers and admins can insert maintenance logs"
ON maintenance_log FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR is_manager()
);

CREATE POLICY "Users can view their maintenance logs"
ON maintenance_log FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM employees
    WHERE employees.id = maintenance_log.completed_by
    AND employees.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their maintenance logs"
ON maintenance_log FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM employees
    WHERE employees.id = maintenance_log.completed_by
    AND employees.user_id = auth.uid()
  )
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_maintenance_log_task_id ON maintenance_log(task_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_log_machine_piece ON maintenance_log(machine_piece);
CREATE INDEX IF NOT EXISTS idx_tasks_maintenance_type ON tasks(maintenance_type) WHERE maintenance_type IS NOT NULL;