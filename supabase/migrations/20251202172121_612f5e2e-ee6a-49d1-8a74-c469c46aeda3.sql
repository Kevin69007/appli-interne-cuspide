-- Add sort_order column to tasks table for drag-and-drop reordering
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Initialize sort_order based on created_at for existing tasks (per user)
UPDATE tasks 
SET sort_order = subquery.row_num
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY assigned_to ORDER BY created_at) as row_num
  FROM tasks
) AS subquery
WHERE tasks.id = subquery.id;