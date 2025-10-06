
-- Update wean date to today for litter #14 so babies can be collected
UPDATE breeding_pairs 
SET 
  wean_date = NOW(),
  is_weaned = true
WHERE litter_number = 14;
