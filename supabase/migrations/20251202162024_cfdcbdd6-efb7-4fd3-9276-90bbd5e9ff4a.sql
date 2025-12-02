-- Add columns for task completion tracking and validation workflow
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS completed_by UUID REFERENCES employees(id);

-- Add index for faster queries on pending validation tasks
CREATE INDEX IF NOT EXISTS idx_tasks_validation_pending 
ON tasks(created_by, assigned_to, statut) 
WHERE statut = 'en_attente_validation';