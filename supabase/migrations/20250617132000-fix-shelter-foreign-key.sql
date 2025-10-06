
-- Fix shelter_pets foreign key constraint that's blocking inserts
-- The issue is that user_pet_id references a pet that gets deleted during the shelter process

-- Step 1: Drop the problematic foreign key constraint
ALTER TABLE public.shelter_pets 
DROP CONSTRAINT IF EXISTS shelter_pets_user_pet_id_fkey;

-- Step 2: Update the sell_pet_to_shelter function to NOT reference user_pet_id
-- since the pet gets deleted from user_pets during the process
CREATE OR REPLACE FUNCTION public.sell_pet_to_shelter(
  pet_id_param uuid, 
  seller_id_param uuid, 
  sale_price_pd integer DEFAULT 70, 
  shelter_price_pd integer DEFAULT 100
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  pet_data record;
  pet_type_name_var text;
  seller_balance integer;
  shelter_pet_id uuid;
  step_counter integer := 0;
BEGIN
  step_counter := step_counter + 1;
  RAISE NOTICE '🏠 STEP %: SHELTER SALE STARTED - Pet: %, Seller: %', step_counter, pet_id_param, seller_id_param;
  
  -- Step 1: Lock and verify pet ownership
  step_counter := step_counter + 1;
  RAISE NOTICE '🔒 STEP %: Locking and verifying pet ownership', step_counter;
  
  SELECT up.*
  INTO pet_data
  FROM public.user_pets up
  WHERE up.id = pet_id_param 
  AND up.user_id = seller_id_param
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE NOTICE '❌ STEP %: FAILED - Pet not found or ownership mismatch', step_counter;
    RETURN json_build_object('success', false, 'error', 'Pet not found or not owned by seller');
  END IF;
  
  step_counter := step_counter + 1;
  RAISE NOTICE '✅ STEP %: Pet ownership verified - Name: %, Breed: %', step_counter, pet_data.pet_name, pet_data.breed;
  
  -- Step 2: Get pet type name
  step_counter := step_counter + 1;
  RAISE NOTICE '🔍 STEP %: Getting pet type for pet_id: %', step_counter, pet_data.pet_id;
  
  SELECT p.name INTO pet_type_name_var
  FROM public.pets p
  WHERE p.id = pet_data.pet_id;
  
  step_counter := step_counter + 1;
  RAISE NOTICE '📝 STEP %: Pet type retrieved: %', step_counter, COALESCE(pet_type_name_var, 'NULL');
  
  -- Step 3: Check if pet is already in shelter
  step_counter := step_counter + 1;
  RAISE NOTICE '🔄 STEP %: Checking if pet already in shelter', step_counter;
  
  IF EXISTS (
    SELECT 1 FROM public.shelter_pets 
    WHERE original_pet_id = pet_data.pet_id 
    AND pet_name = pet_data.pet_name
    AND seller_id = seller_id_param
    AND is_available = true
  ) THEN
    RAISE NOTICE '⚠️ STEP %: FAILED - Pet already in shelter', step_counter;
    RETURN json_build_object('success', false, 'error', 'Pet is already in shelter');
  END IF;
  
  step_counter := step_counter + 1;
  RAISE NOTICE '✅ STEP %: Pet not in shelter, proceeding', step_counter;
  
  -- Step 4: Get seller balance
  step_counter := step_counter + 1;
  RAISE NOTICE '💰 STEP %: Getting seller balance', step_counter;
  
  SELECT paw_dollars INTO seller_balance
  FROM public.profiles
  WHERE id = seller_id_param
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE NOTICE '❌ STEP %: FAILED - Seller profile not found', step_counter;
    RETURN json_build_object('success', false, 'error', 'Seller profile not found');
  END IF;
  
  step_counter := step_counter + 1;
  RAISE NOTICE '💰 STEP %: Seller balance: % PD', step_counter, seller_balance;
  
  -- Step 5: Insert into shelter_pets (without user_pet_id foreign key)
  step_counter := step_counter + 1;
  RAISE NOTICE '🏠 STEP %: INSERTING INTO SHELTER_PETS', step_counter;
  RAISE NOTICE '📋 INSERT DATA: seller_id=%, price_nd=%, pet_name=%', 
    seller_id_param, shelter_price_pd, pet_data.pet_name;
  
  BEGIN
    INSERT INTO public.shelter_pets (
      user_pet_id,
      seller_id,
      price_nd,
      description,
      is_available,
      pet_name,
      breed,
      gender,
      friendliness,
      playfulness,
      energy,
      loyalty,
      curiosity,
      pet_type,
      original_pet_id,
      listed_at,
      last_fed
    ) VALUES (
      pet_data.id, -- Keep this for reference but no FK constraint
      seller_id_param,
      shelter_price_pd,
      COALESCE('A lovely ' || pet_data.pet_name || ' looking for a new home', 'Looking for a loving home'),
      true,
      pet_data.pet_name,
      COALESCE(pet_data.breed, 'Mixed Breed'),
      COALESCE(pet_data.gender, 'Unknown'),
      pet_data.friendliness,
      pet_data.playfulness,
      pet_data.energy,
      pet_data.loyalty,
      pet_data.curiosity,
      COALESCE(pet_type_name_var, pet_data.breed, 'Pet'),
      pet_data.pet_id,
      now(),
      now()
    ) RETURNING id INTO shelter_pet_id;
    
    step_counter := step_counter + 1;
    RAISE NOTICE '🎉 STEP %: SUCCESS - Shelter pet created with ID: %', step_counter, shelter_pet_id;
    
  EXCEPTION
    WHEN OTHERS THEN
      step_counter := step_counter + 1;
      RAISE NOTICE '💥 STEP %: CRITICAL ERROR during INSERT: % (SQLSTATE: %)', step_counter, SQLERRM, SQLSTATE;
      RETURN json_build_object('success', false, 'error', 'Failed to insert into shelter: ' || SQLERRM || ' (SQLSTATE: ' || SQLSTATE || ')');
  END;
  
  -- Step 6: Remove pet from user's collection
  step_counter := step_counter + 1;
  RAISE NOTICE '🗑️ STEP %: Removing pet from user collection', step_counter;
  
  DELETE FROM public.user_pets
  WHERE id = pet_id_param 
  AND user_id = seller_id_param;
  
  step_counter := step_counter + 1;
  RAISE NOTICE '✅ STEP %: Pet removed from user collection', step_counter;
  
  -- Step 7: Update seller balance
  step_counter := step_counter + 1;
  RAISE NOTICE '💰 STEP %: Updating seller balance (+% PD)', step_counter, sale_price_pd;
  
  UPDATE public.profiles
  SET paw_dollars = paw_dollars + sale_price_pd
  WHERE id = seller_id_param;
  
  step_counter := step_counter + 1;
  RAISE NOTICE '✅ STEP %: Seller balance updated', step_counter;
  
  -- Step 8: Record transaction
  step_counter := step_counter + 1;
  RAISE NOTICE '📊 STEP %: Recording transaction', step_counter;
  
  INSERT INTO public.pet_transactions (user_id, pet_id, paw_dollars, description)
  VALUES (
    seller_id_param, 
    pet_id_param, 
    sale_price_pd, 
    'Sold pet to shelter'
  );
  
  step_counter := step_counter + 1;
  RAISE NOTICE '🎊 STEP %: ALL STEPS COMPLETED SUCCESSFULLY!', step_counter;
  
  RETURN json_build_object(
    'success', true, 
    'message', 'Pet successfully sold to shelter',
    'pet_name', pet_data.pet_name,
    'paw_dollars_earned', sale_price_pd,
    'shelter_pet_id', shelter_pet_id
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '💥 FATAL ERROR in sell_pet_to_shelter: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
    RETURN json_build_object('success', false, 'error', 'FATAL: ' || SQLERRM || ' (SQLSTATE: ' || SQLSTATE || ')');
END;
$function$;

-- Step 3: Update the test function to work without foreign key constraint
CREATE OR REPLACE FUNCTION public.test_shelter_insert()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Test if we can insert directly into shelter_pets
  INSERT INTO public.shelter_pets (
    user_pet_id,
    seller_id,
    price_nd,
    description,
    is_available,
    pet_name,
    breed,
    gender,
    friendliness,
    playfulness,
    energy,
    loyalty,
    curiosity,
    pet_type,
    original_pet_id,
    listed_at,
    last_fed
  ) VALUES (
    gen_random_uuid(), -- This won't have FK constraint now
    gen_random_uuid(),
    100,
    'Test pet for debugging',
    false, -- Not available so it won't show up in shelter
    'Test Pet',
    'Test Breed',
    'Male',
    50,
    50,
    50,
    50,
    50,
    'Test Type',
    gen_random_uuid(),
    now(),
    now()
  );
  
  RETURN 'SUCCESS: Test insert worked - shelter_pets table is accessible';
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'ERROR: ' || SQLERRM || ' (SQLSTATE: ' || SQLSTATE || ')';
END;
$$;

-- Step 4: Add comment for tracking this fix
COMMENT ON TABLE public.shelter_pets IS 'Fixed foreign key constraint issue - 2025-06-17 13:20';
