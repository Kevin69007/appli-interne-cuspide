
-- Fix missing babies for breeding pairs that should have them
CREATE OR REPLACE FUNCTION public.generate_missing_babies()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  pair_record RECORD;
  baby_count INTEGER;
  missing_babies INTEGER;
  i INTEGER;
  baby_breed TEXT;
  baby_gender TEXT;
  baby_name TEXT;
  mother_record RECORD;
  father_record RECORD;
BEGIN
  -- Find breeding pairs that are born but missing babies
  FOR pair_record IN 
    SELECT bp.*, 
           up1.breed as parent1_breed, up1.friendliness as p1_friendliness, up1.playfulness as p1_playfulness,
           up1.energy as p1_energy, up1.loyalty as p1_loyalty, up1.curiosity as p1_curiosity,
           up2.breed as parent2_breed, up2.friendliness as p2_friendliness, up2.playfulness as p2_playfulness,
           up2.energy as p2_energy, up2.loyalty as p2_loyalty, up2.curiosity as p2_curiosity
    FROM breeding_pairs bp
    JOIN user_pets up1 ON bp.parent1_id = up1.id
    JOIN user_pets up2 ON bp.parent2_id = up2.id
    WHERE bp.is_born = true AND bp.litter_size > 0
  LOOP
    -- Count existing babies
    SELECT COUNT(*) INTO baby_count
    FROM litter_babies
    WHERE breeding_pair_id = pair_record.id;
    
    missing_babies := pair_record.litter_size - baby_count;
    
    -- Generate missing babies
    IF missing_babies > 0 THEN
      RAISE NOTICE 'Generating % missing babies for breeding pair %', missing_babies, pair_record.id;
      
      FOR i IN 1..missing_babies LOOP
        -- Randomly choose parent breed
        IF random() < 0.5 THEN
          baby_breed := pair_record.parent1_breed;
        ELSE
          baby_breed := pair_record.parent2_breed;
        END IF;
        
        -- Random gender
        IF random() < 0.5 THEN
          baby_gender := 'Male';
        ELSE
          baby_gender := 'Female';
        END IF;
        
        -- Generate random name
        baby_name := 'Baby ' || (array['Luna', 'Max', 'Bella', 'Charlie', 'Lucy', 'Cooper', 'Daisy', 'Milo', 'Sadie', 'Buddy'])[floor(random() * 10 + 1)];
        
        -- Insert baby with corrected stats
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
        ) VALUES (
          pair_record.id,
          baby_name,
          baby_breed,
          baby_gender,
          pair_record.parent1_breed,
          pair_record.parent2_breed,
          CURRENT_DATE,
          LEAST(80, GREATEST(20, (pair_record.p1_friendliness + pair_record.p2_friendliness) / 2 + (random() * 20 - 10)::integer)),
          LEAST(80, GREATEST(20, (pair_record.p1_playfulness + pair_record.p2_playfulness) / 2 + (random() * 20 - 10)::integer)),
          LEAST(80, GREATEST(20, (pair_record.p1_energy + pair_record.p2_energy) / 2 + (random() * 20 - 10)::integer)),
          LEAST(80, GREATEST(20, (pair_record.p1_loyalty + pair_record.p2_loyalty) / 2 + (random() * 20 - 10)::integer)),
          LEAST(80, GREATEST(20, (pair_record.p1_curiosity + pair_record.p2_curiosity) / 2 + (random() * 20 - 10)::integer)),
          'Generated baby from breeding pair'
        );
      END LOOP;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Missing baby generation complete';
END;
$$;

-- Fix over-stat babies in litter_babies table
CREATE OR REPLACE FUNCTION public.fix_over_stat_babies()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Fix any stats over 100 in litter_babies
  UPDATE litter_babies
  SET 
    friendliness = LEAST(80, friendliness),
    playfulness = LEAST(80, playfulness),
    energy = LEAST(80, energy),
    loyalty = LEAST(80, loyalty),
    curiosity = LEAST(80, curiosity)
  WHERE friendliness > 80 OR playfulness > 80 OR energy > 80 OR loyalty > 80 OR curiosity > 80;
  
  RAISE NOTICE 'Over-stat baby correction complete';
END;
$$;

-- Execute the repair functions
SELECT public.generate_missing_babies();
SELECT public.fix_over_stat_babies();
