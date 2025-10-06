
-- Birth litter #14 and set birthday to today
UPDATE breeding_pairs 
SET 
  is_born = true,
  birth_date = NOW(),
  wean_date = NOW() + INTERVAL '14 days'
WHERE litter_number = 14 AND NOT is_born;

-- Update any existing babies for litter #14 to have today's birthday
UPDATE litter_babies 
SET birthday = CURRENT_DATE
WHERE breeding_pair_id = (
  SELECT id FROM breeding_pairs WHERE litter_number = 14 LIMIT 1
);
