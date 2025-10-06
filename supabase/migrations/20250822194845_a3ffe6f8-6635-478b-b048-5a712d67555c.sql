
-- Create a one-off function to generate babies specifically for given litter numbers
CREATE OR REPLACE FUNCTION public.force_generate_babies_for_litter_numbers(target_litters integer[])
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  pair RECORD;
  existing_count integer;
  to_create integer;
  i integer;
  created integer;
  summary jsonb := '{}'::jsonb;
  baby_breed text;
  baby_gender text;
  baby_name text;
BEGIN
  FOR pair IN
    SELECT 
      bp.*,
      up1.friendliness AS p1_friendliness, up1.playfulness AS p1_playfulness,
      up1.energy AS p1_energy, up1.loyalty AS p1_loyalty, up1.curiosity AS p1_curiosity,
      up2.friendliness AS p2_friendliness, up2.playfulness AS p2_playfulness,
      up2.energy AS p2_energy, up2.loyalty AS p2_loyalty, up2.curiosity AS p2_curiosity
    FROM public.breeding_pairs bp
    JOIN public.user_pets up1 ON up1.id = bp.parent1_id
    JOIN public.user_pets up2 ON up2.id = bp.parent2_id
    WHERE bp.litter_number = ANY(target_litters)
  LOOP
    -- Count existing babies
    SELECT COUNT(*) INTO existing_count
    FROM public.litter_babies
    WHERE breeding_pair_id = pair.id;

    created := 0;

    -- Validate litter_size
    IF pair.litter_size IS NULL OR pair.litter_size <= 0 THEN
      summary := summary || jsonb_build_object(pair.litter_number::text, jsonb_build_object(
        'skipped', true,
        'reason', 'invalid_litter_size'
      ));
      CONTINUE;
    END IF;

    -- Determine how many babies we still need to create
    to_create := pair.litter_size - existing_count;

    IF to_create <= 0 THEN
      summary := summary || jsonb_build_object(pair.litter_number::text, jsonb_build_object(
        'skipped', true,
        'reason', 'already_has_babies',
        'existing', existing_count,
        'target', pair.litter_size
      ));
      CONTINUE;
    END IF;

    -- Mark the pair as born so UI shows babies
    UPDATE public.breeding_pairs
    SET is_born = true
    WHERE id = pair.id;

    -- Generate missing babies
    FOR i IN 1..to_create LOOP
      -- Choose baby breed from stored parent breeds (ensures valid breed names)
      IF random() < 0.5 THEN
        baby_breed := pair.parent1_breed;
      ELSE
        baby_breed := pair.parent2_breed;
      END IF;

      -- Enforce genetics: Tortie must be Female
      IF baby_breed = 'Tortie' THEN
        baby_gender := 'Female';
      ELSE
        IF random() < 0.5 THEN
          baby_gender := 'Male';
        ELSE
          baby_gender := 'Female';
        END IF;
      END IF;

      baby_name := 'Baby ' || (existing_count + i);

      -- Insert baby with bounded stats (average of parents ±10, clamped to 20..80)
      INSERT INTO public.litter_babies (
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
        pair.id,
        baby_name,
        baby_breed,
        baby_gender,
        pair.parent1_breed,
        pair.parent2_breed,
        CURRENT_DATE,
        LEAST(80, GREATEST(20, ((COALESCE(pair.p1_friendliness, 50) + COALESCE(pair.p2_friendliness, 50)) / 2)::int + (random()*20 - 10)::int)),
        LEAST(80, GREATEST(20, ((COALESCE(pair.p1_playfulness, 50) + COALESCE(pair.p2_playfulness, 50)) / 2)::int + (random()*20 - 10)::int)),
        LEAST(80, GREATEST(20, ((COALESCE(pair.p1_energy, 50) + COALESCE(pair.p2_energy, 50)) / 2)::int + (random()*20 - 10)::int)),
        LEAST(80, GREATEST(20, ((COALESCE(pair.p1_loyalty, 50) + COALESCE(pair.p2_loyalty, 50)) / 2)::int + (random()*20 - 10)::int)),
        LEAST(80, GREATEST(20, ((COALESCE(pair.p1_curiosity, 50) + COALESCE(pair.p2_curiosity, 50)) / 2)::int + (random()*20 - 10)::int)),
        'Generated for litter ' || pair.litter_number
      );

      created := created + 1;
    END LOOP;

    summary := summary || jsonb_build_object(pair.litter_number::text, jsonb_build_object(
      'created', created,
      'final_count', existing_count + created,
      'target', pair.litter_size
    ));
  END LOOP;

  RETURN json_build_object('success', true, 'summary', summary);
END;
$$;

-- Execute the function for the requested litters now
SELECT public.force_generate_babies_for_litter_numbers(ARRAY[92,93,94,112]);
