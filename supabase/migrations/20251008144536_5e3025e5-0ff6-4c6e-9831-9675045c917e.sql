-- Add schedule_group_id column to work_schedules table for grouping recurring schedules
ALTER TABLE work_schedules 
ADD COLUMN schedule_group_id uuid;

-- Create index for better performance when querying by group
CREATE INDEX idx_work_schedules_group ON work_schedules(schedule_group_id);