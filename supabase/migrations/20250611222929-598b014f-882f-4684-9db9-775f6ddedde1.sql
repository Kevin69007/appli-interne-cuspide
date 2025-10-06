
-- Add missing image_url column to the pets table
ALTER TABLE public.pets ADD COLUMN IF NOT EXISTS image_url text;

-- Ensure the pet type enum includes the correct values
DO $$ 
BEGIN
    -- Check if the enum type exists and has the correct values
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum e 
        JOIN pg_type t ON e.enumtypid = t.oid 
        WHERE t.typname = 'pet_type' AND e.enumlabel = 'dog'
    ) THEN
        -- If the enum doesn't have 'dog', we need to recreate it
        -- First, let's see what values exist
        DROP TYPE IF EXISTS pet_type CASCADE;
        CREATE TYPE pet_type AS ENUM ('dog', 'cat');
        
        -- Update the pets table to use the new enum
        ALTER TABLE public.pets ALTER COLUMN type TYPE pet_type USING type::text::pet_type;
    END IF;
END $$;

-- Add constraint to ensure gender values are consistent
ALTER TABLE public.user_pets DROP CONSTRAINT IF EXISTS user_pets_gender_check;
ALTER TABLE public.user_pets ADD CONSTRAINT user_pets_gender_check 
CHECK (gender IN ('male', 'female'));

-- Add constraint to ensure pet type is valid
ALTER TABLE public.pets DROP CONSTRAINT IF EXISTS pets_type_check;
ALTER TABLE public.pets ADD CONSTRAINT pets_type_check 
CHECK (type IN ('dog', 'cat'));
