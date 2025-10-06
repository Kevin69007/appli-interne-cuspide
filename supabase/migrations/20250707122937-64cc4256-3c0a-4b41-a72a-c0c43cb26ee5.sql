
-- Step 1: Fix existing breeding pairs that are past their wean date but not marked as weaned
UPDATE breeding_pairs 
SET is_weaned = true 
WHERE is_born = true 
  AND is_weaned = false 
  AND NOW() >= wean_date;

-- Step 2: Create a function to automatically update weaning status for overdue pairs
CREATE OR REPLACE FUNCTION public.update_overdue_weaning_status()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update breeding pairs that are past their wean date but not marked as weaned
  UPDATE breeding_pairs 
  SET is_weaned = true 
  WHERE is_born = true 
    AND is_weaned = false 
    AND NOW() >= wean_date;
    
  RAISE NOTICE 'Updated weaning status for overdue breeding pairs';
END;
$$;

-- Step 3: Enhance the collect_breeding_babies function to auto-wean if past due date
CREATE OR REPLACE FUNCTION public.collect_breeding_babies(
  breeding_pair_id_param uuid,
  user_id_param uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  breeding_pair_record RECORD;
  baby_record RECORD;
  pet_match_record RECORD;
  babies_transferred INTEGER := 0;
  total_babies INTEGER := 0;
  is_past_wean_date BOOLEAN := false;
BEGIN
  -- Step 1: Lock and verify breeding pair
  SELECT * INTO breeding_pair_record
  FROM breeding_pairs
  WHERE id = breeding_pair_id_param 
  AND user_id = user_id_param
  AND is_born = true
  AND NOT is_completed
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'Breeding pair not found, not ready, or already completed'
    );
  END IF;
  
  -- Step 2: Check if we're past the wean date
  is_past_wean_date := NOW() >= breeding_pair_record.wean_date;
  
  -- Step 3: Auto-wean if past due date but not marked as weaned
  IF is_past_wean_date AND NOT breeding_pair_record.is_weaned THEN
    UPDATE breeding_pairs
    SET is_weaned = true
    WHERE id = breeding_pair_id_param;
    
    -- Update our local record
    breeding_pair_record.is_weaned := true;
  END IF;
  
  -- Step 4: Verify weaning is complete (either marked as weaned or past due date)
  IF NOT breeding_pair_record.is_weaned AND NOT is_past_wean_date THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'Babies are still weaning. Please wait until ' || breeding_pair_record.wean_date::date
    );
  END IF;
  
  -- Step 5: Get and count babies
  SELECT COUNT(*) INTO total_babies
  FROM litter_babies
  WHERE breeding_pair_id = breeding_pair_id_param;
  
  IF total_babies = 0 THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'No babies found for this breeding pair'
    );
  END IF;
  
  -- Step 6: Transfer each baby to user_pets
  FOR baby_record IN 
    SELECT * FROM litter_babies 
    WHERE breeding_pair_id = breeding_pair_id_param
  LOOP
    -- Find matching pet_id (robust matching)
    SELECT id INTO pet_match_record
    FROM pets
    WHERE LOWER(name) = LOWER(baby_record.breed)
    LIMIT 1;
    
    -- If no exact match, find a reasonable fallback
    IF pet_match_record IS NULL THEN
      SELECT id INTO pet_match_record
      FROM pets
      WHERE LOWER(name) LIKE '%' || LOWER(SPLIT_PART(baby_record.breed, ' ', 1)) || '%'
      LIMIT 1;
    END IF;
    
    -- Absolute fallback - use first available pet
    IF pet_match_record IS NULL THEN
      SELECT id INTO pet_match_record
      FROM pets
      LIMIT 1;
    END IF;
    
    -- Insert baby into user_pets (ensure torties are always female)
    INSERT INTO user_pets (
      user_id,
      pet_id,
      pet_name,
      breed,
      gender,
      friendliness,
      playfulness,
      energy,
      loyalty,
      curiosity,
      birthday,
      parent1_id,
      parent2_id,
      description,
      hunger,
      water,
      adopted_at
    ) VALUES (
      user_id_param,
      pet_match_record.id,
      baby_record.pet_name,
      baby_record.breed,
      CASE WHEN baby_record.breed = 'Tortie' THEN 'Female' ELSE baby_record.gender END,
      baby_record.friendliness,
      baby_record.playfulness,
      baby_record.energy,
      baby_record.loyalty,
      baby_record.curiosity,
      baby_record.birthday,
      breeding_pair_record.parent1_id,
      breeding_pair_record.parent2_id,
      baby_record.description,
      100,
      100,
      NOW()
    );
    
    babies_transferred := babies_transferred + 1;
  END LOOP;
  
  -- Step 7: Clean up litter babies
  DELETE FROM litter_babies
  WHERE breeding_pair_id = breeding_pair_id_param;
  
  -- Step 8: Mark breeding pair as completed
  UPDATE breeding_pairs
  SET is_completed = true
  WHERE id = breeding_pair_id_param;
  
  -- Step 9: Release parents from breeding
  UPDATE user_pets
  SET 
    is_for_breeding = false,
    breeding_cooldown_until = NULL
  WHERE id IN (breeding_pair_record.parent1_id, breeding_pair_record.parent2_id);
  
  RETURN json_build_object(
    'success', true,
    'message', 'Successfully collected ' || babies_transferred || ' babies',
    'babies_transferred', babies_transferred
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Collection failed: ' || SQLERRM
    );
END;
$$;
