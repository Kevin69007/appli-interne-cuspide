
-- Update pet #798 to have odd stats with loyalty and friendliness duplication
UPDATE pets 
SET 
  is_odd_stat = true,
  extra_stats = jsonb_build_object(
    'duplicate_pattern', 'loyalty_friendliness',
    'loyalty_alt', 85,
    'friendliness_alt', 90
  )
WHERE id = 798;
