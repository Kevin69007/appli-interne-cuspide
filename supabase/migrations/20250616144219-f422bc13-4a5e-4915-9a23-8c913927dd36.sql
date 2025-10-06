
-- Add columns to shelter_pets table to store pet data directly
ALTER TABLE public.shelter_pets ADD COLUMN IF NOT EXISTS original_pet_id uuid;
ALTER TABLE public.shelter_pets ADD COLUMN IF NOT EXISTS pet_name text;
ALTER TABLE public.shelter_pets ADD COLUMN IF NOT EXISTS breed text;
ALTER TABLE public.shelter_pets ADD COLUMN IF NOT EXISTS gender text;
ALTER TABLE public.shelter_pets ADD COLUMN IF NOT EXISTS friendliness integer;
ALTER TABLE public.shelter_pets ADD COLUMN IF NOT EXISTS playfulness integer;
ALTER TABLE public.shelter_pets ADD COLUMN IF NOT EXISTS energy integer;
ALTER TABLE public.shelter_pets ADD COLUMN IF NOT EXISTS loyalty integer;
ALTER TABLE public.shelter_pets ADD COLUMN IF NOT EXISTS curiosity integer;
ALTER TABLE public.shelter_pets ADD COLUMN IF NOT EXISTS pet_type text;

-- Update existing shelter pets to have the original_pet_id set to user_pet_id for backward compatibility
UPDATE public.shelter_pets 
SET original_pet_id = user_pet_id 
WHERE original_pet_id IS NULL;
