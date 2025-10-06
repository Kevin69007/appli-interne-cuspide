
-- Add pet lock columns to user_pets table
ALTER TABLE public.user_pets 
ADD COLUMN is_locked boolean DEFAULT false,
ADD COLUMN lock_pin text,
ADD COLUMN locked_at timestamp with time zone;

-- Create function to hash PIN (using built-in crypt function)
CREATE OR REPLACE FUNCTION public.hash_pet_pin(pin_text text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Use built-in gen_salt and crypt functions for secure hashing
  RETURN crypt(pin_text, gen_salt('bf'));
END;
$$;

-- Create function to verify PIN
CREATE OR REPLACE FUNCTION public.verify_pet_pin(pet_id_param uuid, provided_pin text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  stored_hash text;
BEGIN
  -- Get the stored PIN hash for the pet
  SELECT lock_pin INTO stored_hash
  FROM public.user_pets
  WHERE id = pet_id_param AND user_id = auth.uid();
  
  -- If no hash found or pet not owned by user, return false
  IF stored_hash IS NULL THEN
    RETURN false;
  END IF;
  
  -- Verify the PIN using crypt
  RETURN crypt(provided_pin, stored_hash) = stored_hash;
END;
$$;

-- Create function to lock a pet
CREATE OR REPLACE FUNCTION public.lock_pet(pet_id_param uuid, pin_text text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  pin_hash text;
BEGIN
  -- Validate PIN format (exactly 4 digits)
  IF pin_text !~ '^[0-9]{4}$' THEN
    RETURN json_build_object('success', false, 'error', 'PIN must be exactly 4 digits');
  END IF;
  
  -- Hash the PIN
  pin_hash := public.hash_pet_pin(pin_text);
  
  -- Update the pet to set lock
  UPDATE public.user_pets
  SET 
    is_locked = true,
    lock_pin = pin_hash,
    locked_at = now()
  WHERE id = pet_id_param AND user_id = auth.uid();
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Pet not found or not owned by user');
  END IF;
  
  RETURN json_build_object('success', true, 'message', 'Pet locked successfully');
END;
$$;

-- Create function to unlock a pet
CREATE OR REPLACE FUNCTION public.unlock_pet(pet_id_param uuid, provided_pin text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify the PIN first
  IF NOT public.verify_pet_pin(pet_id_param, provided_pin) THEN
    RETURN json_build_object('success', false, 'error', 'Invalid PIN');
  END IF;
  
  -- Remove the lock
  UPDATE public.user_pets
  SET 
    is_locked = false,
    lock_pin = NULL,
    locked_at = NULL
  WHERE id = pet_id_param AND user_id = auth.uid();
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Pet not found or not owned by user');
  END IF;
  
  RETURN json_build_object('success', true, 'message', 'Pet unlocked successfully');
END;
$$;

-- Update the pet sale validation trigger to check for locks
CREATE OR REPLACE FUNCTION public.validate_pet_sale_with_lock_check()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only validate during INSERT, not during transfers or updates
  IF TG_OP = 'INSERT' THEN
    -- Check if the seller actually owns the pet
    IF NOT EXISTS (
      SELECT 1 FROM public.user_pets 
      WHERE id = NEW.user_pet_id AND user_id = NEW.seller_id
    ) THEN
      RAISE EXCEPTION 'Seller must own the pet to create a sale';
    END IF;
    
    -- Check if the pet is locked
    IF EXISTS (
      SELECT 1 FROM public.user_pets 
      WHERE id = NEW.user_pet_id AND user_id = NEW.seller_id AND is_locked = true
    ) THEN
      RAISE EXCEPTION 'Cannot sell a locked pet. Please unlock the pet first.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Replace the existing trigger with the new one
DROP TRIGGER IF EXISTS validate_pet_sale_trigger ON public.pet_sales;
CREATE TRIGGER validate_pet_sale_trigger
  BEFORE INSERT ON public.pet_sales
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_pet_sale_with_lock_check();

-- Update sell_pet_to_shelter function to check for locks
CREATE OR REPLACE FUNCTION public.sell_pet_to_shelter(pet_id_param uuid, seller_id_param uuid, sale_price_pd integer DEFAULT 70, shelter_price_pd integer DEFAULT 100)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  pet_data record;
  pet_type_name_var text;
  seller_balance integer;
  shelter_pet_id uuid;
  step_counter integer := 0;
BEGIN
  -- Initialize logging
  step_counter := step_counter + 1;
  RAISE NOTICE '🏠 STEP %: SHELTER SALE STARTED - Pet: %, Seller: %', step_counter, pet_id_param, seller_id_param;
  
  -- Step 1: Lock and verify pet ownership and lock status
  step_counter := step_counter + 1;
  RAISE NOTICE '🔒 STEP %: Locking and verifying pet ownership and lock status', step_counter;
  
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
  
  -- Check if pet is locked
  IF pet_data.is_locked = true THEN
    RAISE NOTICE '🔒 STEP %: FAILED - Pet is locked', step_counter;
    RETURN json_build_object('success', false, 'error', 'Cannot sell a locked pet. Please unlock the pet first.');
  END IF;
  
  step_counter := step_counter + 1;
  RAISE NOTICE '✅ STEP %: Pet ownership verified and pet is not locked - Name: %, Breed: %, Number: %', step_counter, pet_data.pet_name, pet_data.breed, pet_data.pet_number;
  
  -- Continue with the rest of the existing logic...
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
  
  -- Step 5: Insert into shelter_pets (CRITICAL STEP - PRESERVE PET NUMBER AND BIRTHDAY)
  step_counter := step_counter + 1;
  RAISE NOTICE '🏠 STEP %: INSERTING INTO SHELTER_PETS WITH PRESERVED DATA', step_counter;
  RAISE NOTICE '📋 INSERT DATA: seller_id=%, price_nd=%, pet_name=%, pet_number=%, birthday=%', 
    seller_id_param, shelter_price_pd, pet_data.pet_name, pet_data.pet_number, pet_data.birthday;
  
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
      last_fed,
      pet_number,
      birthday
    ) VALUES (
      pet_data.id, -- Keep this for reference but NO FK constraint
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
      now(),
      pet_data.pet_number,
      pet_data.birthday
    ) RETURNING id INTO shelter_pet_id;
    
    step_counter := step_counter + 1;
    RAISE NOTICE '🎉 STEP %: SUCCESS - Shelter pet created with ID: %, preserved pet_number: %, birthday: %', step_counter, shelter_pet_id, pet_data.pet_number, pet_data.birthday;
    
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
    'shelter_pet_id', shelter_pet_id,
    'pet_number_preserved', pet_data.pet_number,
    'birthday_preserved', pet_data.birthday
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '💥 FATAL ERROR in sell_pet_to_shelter: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
    RETURN json_build_object('success', false, 'error', 'FATAL: ' || SQLERRM || ' (SQLSTATE: ' || SQLSTATE || ')');
END;
$$;
