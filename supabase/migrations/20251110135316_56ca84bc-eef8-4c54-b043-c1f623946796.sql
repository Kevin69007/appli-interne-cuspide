-- Create storage bucket for meeting recordings
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'meetings',
  'meetings',
  false,
  104857600, -- 100MB limit
  ARRAY['audio/webm', 'audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/mp4', 'audio/ogg']
);

-- Storage policies for meetings bucket
-- Only admins can upload recordings
CREATE POLICY "Admins can upload meeting recordings"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'meetings' AND
  has_role(auth.uid(), 'admin'::app_role)
);

-- Only admins can download meeting recordings
CREATE POLICY "Admins can download meeting recordings"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'meetings' AND
  has_role(auth.uid(), 'admin'::app_role)
);

-- Admins can update meeting recordings
CREATE POLICY "Admins can update meeting recordings"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'meetings' AND
  has_role(auth.uid(), 'admin'::app_role)
);

-- Admins can delete meeting recordings
CREATE POLICY "Admins can delete meeting recordings"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'meetings' AND
  has_role(auth.uid(), 'admin'::app_role)
);

-- Create meeting_permissions table
CREATE TABLE IF NOT EXISTS meeting_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  can_access_meetings boolean NOT NULL DEFAULT false,
  granted_by uuid REFERENCES auth.users(id),
  granted_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(employee_id)
);

-- Enable RLS on meeting_permissions
ALTER TABLE meeting_permissions ENABLE ROW LEVEL SECURITY;

-- Admins can manage meeting permissions
CREATE POLICY "Admins can manage meeting permissions"
ON meeting_permissions
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Users can view their own permissions
CREATE POLICY "Users can view their own permissions"
ON meeting_permissions
FOR SELECT
TO authenticated
USING (
  employee_id IN (
    SELECT id FROM employees WHERE user_id = auth.uid()
  )
);

-- Update project_meetings RLS policies
-- Drop existing policies first
DROP POLICY IF EXISTS "Admins and managers can manage meetings" ON project_meetings;
DROP POLICY IF EXISTS "Everyone can view meetings" ON project_meetings;
DROP POLICY IF EXISTS "Users can insert meetings during creation" ON project_meetings;

-- Admins can manage all meetings
CREATE POLICY "Admins can manage all meetings"
ON project_meetings
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Users can view meetings they participate in
-- participants is stored as jsonb array
CREATE POLICY "Users can view their related meetings"
ON project_meetings
FOR SELECT
TO authenticated
USING (
  -- Check if user's employee_id exists in participants jsonb array
  EXISTS (
    SELECT 1 FROM employees e
    WHERE e.user_id = auth.uid()
    AND participants::jsonb @> to_jsonb(e.id::text)
  )
  OR
  -- Or user is admin
  has_role(auth.uid(), 'admin'::app_role)
);

-- Update meeting_timestamps policies
DROP POLICY IF EXISTS "Admins and managers can manage timestamps" ON meeting_timestamps;
DROP POLICY IF EXISTS "Everyone can view timestamps of meetings they have access to" ON meeting_timestamps;
DROP POLICY IF EXISTS "Users can insert timestamps during meeting creation" ON meeting_timestamps;

-- Admins can manage timestamps
CREATE POLICY "Admins can manage timestamps"
ON meeting_timestamps
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Users can view timestamps of meetings they have access to
CREATE POLICY "Users can view their meeting timestamps"
ON meeting_timestamps
FOR SELECT
TO authenticated
USING (
  meeting_id IN (
    SELECT pm.id FROM project_meetings pm
    WHERE EXISTS (
      SELECT 1 FROM employees e
      WHERE e.user_id = auth.uid()
      AND pm.participants::jsonb @> to_jsonb(e.id::text)
    )
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);

-- Create updated_at trigger for meeting_permissions
CREATE TRIGGER update_meeting_permissions_updated_at
  BEFORE UPDATE ON meeting_permissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();