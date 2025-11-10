-- Add support for multiple projects per meeting
ALTER TABLE project_meetings 
ADD COLUMN IF NOT EXISTS project_ids JSONB DEFAULT '[]'::jsonb;

-- Add comment for clarity
COMMENT ON COLUMN project_meetings.project_ids IS 'Array of project UUIDs associated with this meeting. Use this for multi-project meetings.';

-- Create index for better query performance on project_ids
CREATE INDEX IF NOT EXISTS idx_project_meetings_project_ids ON project_meetings USING gin(project_ids);

-- Note: The participants column already exists and can store either:
-- - Legacy format: comma-separated names as text
-- - New format: JSONB array of employee UUIDs
-- We'll handle both formats in the application layer for backward compatibility