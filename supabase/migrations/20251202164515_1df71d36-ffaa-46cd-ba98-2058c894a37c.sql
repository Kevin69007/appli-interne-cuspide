-- Change start_hour from INTEGER to NUMERIC to support decimal values (7.5, 8.5, etc.)
ALTER TABLE daily_task_planning 
  ALTER COLUMN start_hour TYPE NUMERIC USING start_hour::numeric;