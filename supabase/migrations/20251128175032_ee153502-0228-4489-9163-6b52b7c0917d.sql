-- Make videos bucket public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'videos';