
-- Add 200 Paw Dollars to leoandoreosmom's account
UPDATE profiles 
SET paw_dollars = paw_dollars + 200 
WHERE username = 'leoandoreosmom';

-- Create a transaction record for the manual adjustment
INSERT INTO pet_transactions (user_id, pet_id, paw_dollars, description)
SELECT 
  id,
  id,
  200,
  'Manual adjustment - compensation for payment issue'
FROM profiles 
WHERE username = 'leoandoreosmom';
