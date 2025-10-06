
-- Add the missing columns to the pets table to support odd stats
ALTER TABLE pets 
ADD COLUMN IF NOT EXISTS is_odd_stat boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS extra_stats jsonb DEFAULT NULL;

-- Now update pet #798 with the correct data
UPDATE pets 
SET 
  is_odd_stat = true,
  extra_stats = jsonb_build_object(
    'duplicate_pattern', 'loyalty_friendliness',
    'loyalty_alt', 85,
    'friendliness_alt', 90
  )
WHERE id = '798';
