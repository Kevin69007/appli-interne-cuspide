
-- Add 3125 Paw Dollars to MistressKitty's account
UPDATE profiles 
SET paw_dollars = paw_dollars + 3125 
WHERE username = 'MistressKitty';

-- Create a transaction record for the manual adjustment
INSERT INTO paw_dollar_transactions (user_id, amount, type, description)
SELECT 
  id,
  3125,
  'purchase',
  'Manual adjustment - $99.99 package credit for MistressKitty'
FROM profiles 
WHERE username = 'MistressKitty';
