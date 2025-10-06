-- First, let's see what the current constraint is and drop it if it exists
ALTER TABLE pet_sales DROP CONSTRAINT IF EXISTS pet_sales_price_nd_check;

-- Add a new constraint that allows minimum 30 paw dollars
ALTER TABLE pet_sales ADD CONSTRAINT pet_sales_price_nd_check CHECK (price_nd >= 30);

-- Deactivate existing sales for pawshelter account (profile 126)
UPDATE pet_sales 
SET is_active = false 
WHERE seller_id = (
  SELECT id FROM profiles WHERE profile_number = 126
);

-- Create new sales for all pets owned by pawshelter account at 30 paw dollars
INSERT INTO pet_sales (user_pet_id, seller_id, price_nd, is_active)
SELECT 
  up.id as user_pet_id,
  up.user_id as seller_id,
  30 as price_nd,
  true as is_active
FROM user_pets up
JOIN profiles p ON up.user_id = p.id
WHERE p.profile_number = 126;