
-- Update the test_shelter_insert function to use a real pet ID instead of random UUID
CREATE OR REPLACE FUNCTION public.test_shelter_insert()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  test_pet_id uuid;
BEGIN
  -- Get a real pet ID from the pets table
  SELECT id INTO test_pet_id FROM public.pets LIMIT 1;
  
  IF test_pet_id IS NULL THEN
    RETURN 'ERROR: No pets found in pets table for testing';
  END IF;
  
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
    gen_random_uuid(), -- This is just a reference, no FK constraint
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
    test_pet_id, -- Use real pet ID
    now(),
    now()
  );
  
  RETURN 'SUCCESS: Test insert worked - shelter_pets table is accessible';
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'ERROR: ' || SQLERRM || ' (SQLSTATE: ' || SQLSTATE || ')';
END;
$$;

-- Add a comment to clarify the original_pet_id usage
COMMENT ON COLUMN public.shelter_pets.original_pet_id IS 'References the original pet ID from pets table - maintains pet identity in shelter';
