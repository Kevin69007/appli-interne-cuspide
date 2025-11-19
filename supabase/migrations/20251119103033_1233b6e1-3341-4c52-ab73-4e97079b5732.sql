-- Phase 3: Add is_remote column to employees
ALTER TABLE employees 
ADD COLUMN is_remote BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN employees.is_remote IS 'Indique si l''employé travaille en distanciel et doit déclarer ses heures quotidiennement';

-- Create index for faster queries on remote employees
CREATE INDEX idx_employees_is_remote ON employees(is_remote) WHERE is_remote = true;