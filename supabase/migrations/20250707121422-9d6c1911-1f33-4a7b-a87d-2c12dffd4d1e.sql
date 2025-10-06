
-- Step 1: Fix the over-stat baby and ensure all litters have correct baby counts
UPDATE litter_babies 
SET 
  friendliness = LEAST(80, friendliness),
  playfulness = LEAST(80, playfulness),
  energy = LEAST(80, energy),
  loyalty = LEAST(80, loyalty),
  curiosity = LEAST(80, curiosity)
WHERE friendliness > 80 OR playfulness > 80 OR energy > 80 OR loyalty > 80 OR curiosity > 80;

-- Step 2: Generate any missing babies for breeding pairs that should have them
WITH breeding_pairs_needing_babies AS (
  SELECT 
    bp.id,
    bp.litter_size,
    COALESCE(lb_count.baby_count, 0) as current_babies,
    (bp.litter_size - COALESCE(lb_count.baby_count, 0)) as missing_babies,
    up1.breed as parent1_breed,
    up2.breed as parent2_breed,
    up1.friendliness as p1_friendliness,
    up1.playfulness as p1_playfulness,
    up1.energy as p1_energy,
    up1.loyalty as p1_loyalty,
    up1.curiosity as p1_curiosity,
    up2.friendliness as p2_friendliness,
    up2.playfulness as p2_playfulness,
    up2.energy as p2_energy,
    up2.loyalty as p2_loyalty,
    up2.curiosity as p2_curiosity
  FROM breeding_pairs bp
  JOIN user_pets up1 ON bp.parent1_id = up1.id
  JOIN user_pets up2 ON bp.parent2_id = up2.id
  LEFT JOIN (
    SELECT breeding_pair_id, COUNT(*) as baby_count
    FROM litter_babies
    GROUP BY breeding_pair_id
  ) lb_count ON bp.id = lb_count.breeding_pair_id
  WHERE bp.is_born = true 
  AND bp.litter_size > 0
  AND (bp.litter_size - COALESCE(lb_count.baby_count, 0)) > 0
)
INSERT INTO litter_babies (
  breeding_pair_id,
  pet_name,
  breed,
  gender,
  parent1_breed,
  parent2_breed,
  birthday,
  friendliness,
  playfulness,
  energy,
  loyalty,
  curiosity,
  description
)
SELECT 
  bp.id,
  'Baby ' || (array['Luna', 'Max', 'Bella', 'Charlie', 'Lucy', 'Cooper', 'Daisy', 'Milo', 'Sadie', 'Buddy'])[floor(random() * 10 + 1)],
  CASE WHEN random() < 0.5 THEN bp.parent1_breed ELSE bp.parent2_breed END,
  CASE WHEN random() < 0.5 THEN 'Male' ELSE 'Female' END,
  bp.parent1_breed,
  bp.parent2_breed,
  CURRENT_DATE,
  LEAST(80, GREATEST(20, (bp.p1_friendliness + bp.p2_friendliness) / 2 + (random() * 20 - 10)::integer)),
  LEAST(80, GREATEST(20, (bp.p1_playfulness + bp.p2_playfulness) / 2 + (random() * 20 - 10)::integer)),
  LEAST(80, GREATEST(20, (bp.p1_energy + bp.p2_energy) / 2 + (random() * 20 - 10)::integer)),
  LEAST(80, GREATEST(20, (bp.p1_loyalty + bp.p2_loyalty) / 2 + (random() * 20 - 10)::integer)),
  LEAST(80, GREATEST(20, (bp.p1_curiosity + bp.p2_curiosity) / 2 + (random() * 20 - 10)::integer)),
  'Generated baby from breeding pair'
FROM breeding_pairs_needing_babies bp,
     generate_series(1, bp.missing_babies);

-- Step 3: Create the bulletproof collection function
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
BEGIN
  -- Step 1: Lock and verify breeding pair
  SELECT * INTO breeding_pair_record
  FROM breeding_pairs
  WHERE id = breeding_pair_id_param 
  AND user_id = user_id_param
  AND is_born = true
  AND is_weaned = true
  AND NOT is_completed
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'Breeding pair not found, not ready, or already completed'
    );
  END IF;
  
  -- Step 2: Verify weaning period is complete
  IF NOW() < breeding_pair_record.wean_date THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'Babies are still weaning. Please wait until ' || breeding_pair_record.wean_date::date
    );
  END IF;
  
  -- Step 3: Get and count babies
  SELECT COUNT(*) INTO total_babies
  FROM litter_babies
  WHERE breeding_pair_id = breeding_pair_id_param;
  
  IF total_babies = 0 THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'No babies found for this breeding pair'
    );
  END IF;
  
  -- Step 4: Transfer each baby to user_pets
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
    
    -- Insert baby into user_pets
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
      baby_record.gender,
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
  
  -- Step 5: Clean up litter babies
  DELETE FROM litter_babies
  WHERE breeding_pair_id = breeding_pair_id_param;
  
  -- Step 6: Mark breeding pair as completed
  UPDATE breeding_pairs
  SET is_completed = true
  WHERE id = breeding_pair_id_param;
  
  -- Step 7: Release parents from breeding
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
