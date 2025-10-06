-- Update adopt_shelter_pet function to handle paw points for shelter adoptions
CREATE OR REPLACE FUNCTION public.adopt_shelter_pet(shelter_pet_id_param uuid, adopter_id_param uuid, adoption_price_param integer)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  shelter_pet_record RECORD;
  adopter_profile_record RECORD;
  new_user_pet_id uuid;
  pet_match_record RECORD;
BEGIN
  -- Verify caller authorization
  IF auth.uid() != adopter_id_param THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized: You can only adopt pets to your own account');
  END IF;

  -- Step 1: Lock and verify shelter pet exists and is available
  SELECT * INTO shelter_pet_record
  FROM public.shelter_pets
  WHERE id = shelter_pet_id_param 
  AND is_available = true
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Pet not found or no longer available'
    );
  END IF;
  
  -- Step 2: Lock and verify adopter profile and funds (using paw_points for shelter adoptions)
  SELECT * INTO adopter_profile_record
  FROM public.profiles
  WHERE id = adopter_id_param
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Adopter profile not found'
    );
  END IF;
  
  -- Check paw_points (70,000 paw points for shelter adoptions)
  IF adopter_profile_record.paw_points < adoption_price_param THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Insufficient paw points'
    );
  END IF;
  
  -- Step 3: Find matching pet_id for the new user_pet record
  SELECT id INTO pet_match_record
  FROM public.pets
  WHERE id = shelter_pet_record.original_pet_id
  LIMIT 1;
  
  IF pet_match_record IS NULL THEN
    -- Fallback: find by name/breed
    SELECT id INTO pet_match_record
    FROM public.pets
    WHERE LOWER(name) = LOWER(shelter_pet_record.breed)
    LIMIT 1;
  END IF;
  
  -- Step 4: Create new user_pet record
  INSERT INTO public.user_pets (
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
    hunger,
    water,
    adopted_at,
    pet_number
  ) VALUES (
    adopter_id_param,
    pet_match_record.id,
    shelter_pet_record.pet_name,
    shelter_pet_record.breed,
    shelter_pet_record.gender,
    shelter_pet_record.friendliness,
    shelter_pet_record.playfulness,
    shelter_pet_record.energy,
    shelter_pet_record.loyalty,
    shelter_pet_record.curiosity,
    shelter_pet_record.birthday,
    100,
    100,
    NOW(),
    shelter_pet_record.pet_number
  ) RETURNING id INTO new_user_pet_id;
  
  -- Step 5: Remove pet from shelter
  UPDATE public.shelter_pets
  SET is_available = false
  WHERE id = shelter_pet_id_param;
  
  -- Step 6: Update adopter's paw_points instead of paw_dollars
  UPDATE public.profiles
  SET paw_points = paw_points - adoption_price_param
  WHERE id = adopter_id_param;
  
  -- Step 7: Record transaction using paw_points
  INSERT INTO public.pet_transactions (
    user_id,
    pet_id,
    paw_points,
    description
  ) VALUES (
    adopter_id_param,
    new_user_pet_id,
    -adoption_price_param,
    'Adopted ' || shelter_pet_record.pet_name || ' from shelter'
  );
  
  RETURN json_build_object(
    'success', true,
    'message', 'Pet adopted successfully',
    'pet_name', shelter_pet_record.pet_name,
    'new_pet_id', new_user_pet_id
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Adoption failed: ' || SQLERRM
    );
END;
$function$;