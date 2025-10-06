-- Create RLS policy to allow friends to feed/water each other's pets
-- First, drop the conflicting policy
DROP POLICY IF EXISTS "Users can update their own pets for all activities" ON user_pets;

-- Create a comprehensive policy that allows:
-- 1. Users to update their own pets
-- 2. Friends to feed/water pets when privacy allows it
-- 3. Pet transfers during sales
CREATE POLICY "Users can update own pets or feed friends pets" ON user_pets
FOR UPDATE
USING (
  -- Own pets
  (auth.uid() = user_id) 
  OR 
  -- Active pet sales (for transfers)
  (EXISTS (
    SELECT 1 FROM pet_sales 
    WHERE pet_sales.user_pet_id = user_pets.id 
    AND pet_sales.is_active = true
  ))
  OR
  -- Friends can feed/water when privacy allows
  (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = user_pets.user_id 
    AND (
      -- Everyone can feed/water
      profiles.feeding_privacy = 'everyone'
      OR
      -- Friends can feed/water
      (profiles.feeding_privacy = 'friends_only' AND EXISTS (
        SELECT 1 FROM friendships 
        WHERE (
          (friendships.user1_id = auth.uid() AND friendships.user2_id = user_pets.user_id)
          OR 
          (friendships.user2_id = auth.uid() AND friendships.user1_id = user_pets.user_id)
        )
      ))
    )
  ))
)
WITH CHECK (
  -- Same conditions for WITH CHECK
  (auth.uid() = user_id) 
  OR 
  (EXISTS (
    SELECT 1 FROM pet_sales 
    WHERE pet_sales.user_pet_id = user_pets.id 
    AND pet_sales.is_active = true
  ))
  OR
  (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = user_pets.user_id 
    AND (
      profiles.feeding_privacy = 'everyone'
      OR
      (profiles.feeding_privacy = 'friends_only' AND EXISTS (
        SELECT 1 FROM friendships 
        WHERE (
          (friendships.user1_id = auth.uid() AND friendships.user2_id = user_pets.user_id)
          OR 
          (friendships.user2_id = auth.uid() AND friendships.user1_id = user_pets.user_id)
        )
      ))
    )
  ))
);