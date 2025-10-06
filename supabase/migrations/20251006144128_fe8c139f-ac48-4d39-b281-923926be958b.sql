-- Create storage bucket for job documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('job-documents', 'job-documents', true);

-- Allow admins to upload files
CREATE POLICY "Admins can upload job documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'job-documents' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Allow admins to update files
CREATE POLICY "Admins can update job documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'job-documents' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Allow admins to delete files
CREATE POLICY "Admins can delete job documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'job-documents' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Allow authenticated users to view files
CREATE POLICY "Authenticated users can view job documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'job-documents');