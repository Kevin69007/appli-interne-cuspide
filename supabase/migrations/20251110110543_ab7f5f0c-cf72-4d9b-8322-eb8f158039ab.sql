-- Create meeting_timestamps table for tracking when projects/tasks are discussed in meetings
CREATE TABLE meeting_timestamps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES project_meetings(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  timestamp_seconds INTEGER NOT NULL,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_meeting_timestamps_meeting_id ON meeting_timestamps(meeting_id);
CREATE INDEX idx_meeting_timestamps_project_id ON meeting_timestamps(project_id);
CREATE INDEX idx_meeting_timestamps_task_id ON meeting_timestamps(task_id);

-- Enable RLS
ALTER TABLE meeting_timestamps ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins and managers can manage timestamps"
ON meeting_timestamps
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR is_manager());

CREATE POLICY "Users can insert timestamps during meeting creation"
ON meeting_timestamps
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM employees
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Everyone can view timestamps of meetings they have access to"
ON meeting_timestamps
FOR SELECT
USING (
  meeting_id IN (
    SELECT id FROM project_meetings
    WHERE project_id IN (
      SELECT id FROM projects
    )
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_meeting_timestamps_updated_at
BEFORE UPDATE ON meeting_timestamps
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();