-- Update the videos bucket to allow files up to 100MB
UPDATE storage.buckets 
SET file_size_limit = 104857600  -- 100MB in bytes
WHERE id = 'videos';