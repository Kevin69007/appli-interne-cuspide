-- Add weekly_hours column to employee_leave_config
ALTER TABLE employee_leave_config 
ADD COLUMN IF NOT EXISTS weekly_hours NUMERIC DEFAULT 35;

-- Add comment for documentation
COMMENT ON COLUMN employee_leave_config.weekly_hours IS 'Contracted weekly hours for the employee (default 35h)';