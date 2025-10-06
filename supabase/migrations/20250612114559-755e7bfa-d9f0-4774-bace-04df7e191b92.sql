
-- Create forum-images storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('forum-images', 'forum-images', true);

-- Create RLS policies for the forum-images bucket
CREATE POLICY "Forum images are publicly accessible" ON storage.objects
FOR SELECT USING (bucket_id = 'forum-images');

CREATE POLICY "Users can upload forum images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'forum-images' AND 
  auth.uid() IS NOT NULL
);

CREATE POLICY "Users can update their own forum images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'forum-images' AND 
  auth.uid() IS NOT NULL
);

CREATE POLICY "Users can delete their own forum images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'forum-images' AND 
  auth.uid() IS NOT NULL
);
