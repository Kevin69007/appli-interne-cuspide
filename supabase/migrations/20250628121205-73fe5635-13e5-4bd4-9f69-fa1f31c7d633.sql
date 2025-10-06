
-- Phase 1: Clean up data inconsistencies
-- First, identify and remove pets that exist in both user_pets and shelter_pets
-- These are "ghost pets" that should only exist in shelter

-- Remove user_pets that have corresponding entries in shelter_pets
DELETE FROM user_pets 
WHERE id IN (
  SELECT up.id 
  FROM user_pets up
  INNER JOIN shelter_pets sp ON up.id = sp.user_pet_id
  WHERE sp.is_available = true
);

-- Phase 2: Release breeding parents from completed litters
-- Update breeding pairs that are completed but parents are still marked for breeding
UPDATE user_pets 
SET 
  is_for_breeding = false,
  breeding_cooldown_until = NULL,
  last_bred = NULL
WHERE id IN (
  SELECT DISTINCT parent_id
  FROM (
    SELECT bp.parent1_id as parent_id
    FROM breeding_pairs bp
    WHERE bp.is_completed = true
    
    UNION
    
    SELECT bp.parent2_id as parent_id  
    FROM breeding_pairs bp
    WHERE bp.is_completed = true
  ) as completed_parents
  WHERE parent_id IS NOT NULL
)
AND (is_for_breeding = true OR breeding_cooldown_until IS NOT NULL);

-- Phase 3: Clean up any orphaned shelter pets that reference non-existent user pets
-- (This is preventive cleanup)
DELETE FROM shelter_pets 
WHERE user_pet_id NOT IN (
  SELECT id FROM user_pets
) 
AND user_pet_id IS NOT NULL;

-- Create a function to automatically release breeding parents when litter is completed
CREATE OR REPLACE FUNCTION public.release_breeding_parents(breeding_pair_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Release both parents from breeding status
  UPDATE public.user_pets
  SET 
    is_for_breeding = false,
    breeding_cooldown_until = NULL,
    last_bred = now() -- Set last bred to now for cooldown tracking
  WHERE id IN (
    SELECT parent1_id FROM public.breeding_pairs WHERE id = breeding_pair_id_param
    UNION
    SELECT parent2_id FROM public.breeding_pairs WHERE id = breeding_pair_id_param
  )
  AND id IS NOT NULL;
  
  RAISE NOTICE 'Released breeding parents for pair %', breeding_pair_id_param;
END;
$function$;

-- Create a function to ensure clean shelter sales
CREATE OR REPLACE FUNCTION public.ensure_clean_shelter_sale(pet_id_param uuid, seller_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  existing_shelter_pet uuid;
BEGIN
  -- Check if pet already exists in shelter
  SELECT id INTO existing_shelter_pet
  FROM public.shelter_pets
  WHERE user_pet_id = pet_id_param AND is_available = true;
  
  IF existing_shelter_pet IS NOT NULL THEN
    RAISE NOTICE 'Pet already exists in shelter with ID: %', existing_shelter_pet;
    RETURN false;
  END IF;
  
  -- Verify pet ownership
  IF NOT EXISTS (
    SELECT 1 FROM public.user_pets 
    WHERE id = pet_id_param AND user_id = seller_id_param
  ) THEN
    RAISE NOTICE 'Pet not found or not owned by seller';
    RETURN false;
  END IF;
  
  RETURN true;
END;
$function$;
