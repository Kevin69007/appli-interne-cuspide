
-- Add 200 Paw Dollars to leoandoreosmom's account
UPDATE profiles 
SET paw_dollars = paw_dollars + 200 
WHERE username = 'leoandoreosmom';

-- Create a transaction record for the manual adjustment
INSERT INTO paw_dollar_transactions (user_id, amount, type, description)
SELECT 
  id,
  200,
  'purchase',
  'Manual adjustment - admin credit'
FROM profiles 
WHERE username = 'leoandoreosmom';
