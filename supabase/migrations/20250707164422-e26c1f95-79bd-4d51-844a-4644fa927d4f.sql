
-- Ensure parents can always be fed regardless of breeding status
-- Update the RLS policy for user_pets to allow feeding during breeding
DROP POLICY IF EXISTS "Users can update their own pets for all activities" ON user_pets;

CREATE POLICY "Users can update their own pets for all activities"
ON user_pets
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Fix message deletion policy to ensure users can delete their own sent messages
DROP POLICY IF EXISTS "Users can delete their own sent messages or messages on their p" ON user_messages;

CREATE POLICY "Users can delete their own sent messages or messages on their profile"
ON user_messages
FOR DELETE
USING (
  (auth.uid() = sender_id) OR 
  (auth.uid() = receiver_id AND is_profile_message = true)
);

-- Ensure the collect_breeding_babies function properly releases parents
-- This function already exists and handles parent release, but let's verify it's working
-- by checking that parents are released when breeding is completed
UPDATE user_pets 
SET is_for_breeding = false, breeding_cooldown_until = NULL
WHERE id IN (
  SELECT DISTINCT parent1_id FROM breeding_pairs WHERE is_completed = true
  UNION
  SELECT DISTINCT parent2_id FROM breeding_pairs WHERE is_completed = true
)
AND (is_for_breeding = true OR breeding_cooldown_until IS NOT NULL);
