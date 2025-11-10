-- Make meetings bucket public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'meetings';

-- Add created_by, deleted_at, deleted_by to project_meetings
ALTER TABLE project_meetings 
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS notes text;

-- Update existing meetings to set created_by from participants if needed
-- This is a one-time migration helper
UPDATE project_meetings 
SET created_by = auth.uid()
WHERE created_by IS NULL;

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can manage all meetings" ON project_meetings;
DROP POLICY IF EXISTS "Users can view their meetings" ON project_meetings;

-- Create new RLS policies
CREATE POLICY "Admins can manage all meetings"
ON project_meetings
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Meeting creators can manage their meetings"
ON project_meetings
FOR ALL
USING (created_by = auth.uid() AND deleted_at IS NULL)
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can view non-deleted meetings they participate in"
ON project_meetings
FOR SELECT
USING (
  deleted_at IS NULL AND (
    has_role(auth.uid(), 'admin'::app_role) OR
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.user_id = auth.uid() 
      AND participants @> to_jsonb(e.id::text)
    )
  )
);

-- Create index for performance on deleted_at queries
CREATE INDEX IF NOT EXISTS idx_project_meetings_deleted_at ON project_meetings(deleted_at) WHERE deleted_at IS NOT NULL;