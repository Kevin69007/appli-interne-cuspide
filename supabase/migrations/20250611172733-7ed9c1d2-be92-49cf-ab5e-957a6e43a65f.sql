
-- Fix all pets with stats that exceed their breed's natural ranges
-- This addresses pets like "Sai" and others with over stats

-- First, let's create a function to generate proper stats within breed ranges
CREATE OR REPLACE FUNCTION fix_pet_stats()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    pet_record RECORD;
    new_friendliness INTEGER;
    new_playfulness INTEGER;
    new_energy INTEGER;
    new_loyalty INTEGER;
    new_curiosity INTEGER;
    breed_lower TEXT;
BEGIN
    -- Loop through all pets that have stats outside their breed ranges
    FOR pet_record IN 
        SELECT 
            up.id,
            up.pet_name,
            up.breed,
            up.friendliness,
            up.playfulness,
            up.energy,
            up.loyalty,
            up.curiosity
        FROM user_pets up
        WHERE 
            -- Only fix pets with positive stats that exceed breed ranges
            -- (preserve legitimate lost stats which are negative)
            up.friendliness >= 0 AND up.playfulness >= 0 AND up.energy >= 0 AND up.loyalty >= 0 AND up.curiosity >= 0
            AND (
                -- Tuxedo Cat violations
                (up.breed ILIKE '%tuxedo cat%' AND (
                    up.friendliness > 80 OR up.playfulness > 85 OR up.energy > 80 OR up.loyalty > 80 OR up.curiosity > 95
                ))
                -- German Shepherd violations  
                OR (up.breed ILIKE '%german shepherd%' AND (
                    up.friendliness > 85 OR up.playfulness > 75 OR up.energy > 90 OR up.loyalty > 95 OR up.curiosity > 80
                ))
                -- Golden Retriever violations
                OR (up.breed ILIKE '%golden retriever%' AND (
                    up.friendliness > 95 OR up.playfulness > 90 OR up.energy > 85 OR up.loyalty > 90 OR up.curiosity > 80
                ))
                -- Husky violations
                OR (up.breed ILIKE '%husky%' AND (
                    up.friendliness > 80 OR up.playfulness > 95 OR up.energy > 100 OR up.loyalty > 80 OR up.curiosity > 90
                ))
                -- Yellow Lab violations
                OR (up.breed ILIKE '%yellow lab%' AND (
                    up.friendliness > 95 OR up.playfulness > 85 OR up.energy > 85 OR up.loyalty > 95 OR up.curiosity > 75
                ))
                -- Chihuahua violations
                OR (up.breed ILIKE '%chihuahua%' AND (
                    up.friendliness > 70 OR up.playfulness > 85 OR up.energy > 80 OR up.loyalty > 90 OR up.curiosity > 85
                ))
                -- Dalmatian violations
                OR (up.breed ILIKE '%dalmatian%' AND (
                    up.friendliness > 85 OR up.playfulness > 90 OR up.energy > 95 OR up.loyalty > 85 OR up.curiosity > 80
                ))
                -- Black Cat violations
                OR (up.breed ILIKE '%black cat%' AND (
                    up.friendliness > 75 OR up.playfulness > 90 OR up.energy > 85 OR up.loyalty > 75 OR up.curiosity > 95
                ))
                -- Orange Cat violations
                OR (up.breed ILIKE '%orange cat%' AND (
                    up.friendliness > 85 OR up.playfulness > 90 OR up.energy > 85 OR up.loyalty > 80 OR up.curiosity > 90
                ))
                -- Persian violations
                OR (up.breed ILIKE '%persian%' AND (
                    up.friendliness > 80 OR up.playfulness > 70 OR up.energy > 60 OR up.loyalty > 85 OR up.curiosity > 80
                ))
            )
    LOOP
        -- Normalize breed name for comparison
        breed_lower := LOWER(pet_record.breed);
        
        -- Generate new stats within proper breed ranges
        IF breed_lower LIKE '%tuxedo cat%' THEN
            new_friendliness := LEAST(pet_record.friendliness, 80);
            new_playfulness := LEAST(pet_record.playfulness, 85);
            new_energy := LEAST(pet_record.energy, 80);
            new_loyalty := LEAST(pet_record.loyalty, 80);
            new_curiosity := LEAST(pet_record.curiosity, 95);
        ELSIF breed_lower LIKE '%german shepherd%' THEN
            new_friendliness := LEAST(pet_record.friendliness, 85);
            new_playfulness := LEAST(pet_record.playfulness, 75);
            new_energy := LEAST(pet_record.energy, 90);
            new_loyalty := LEAST(pet_record.loyalty, 95);
            new_curiosity := LEAST(pet_record.curiosity, 80);
        ELSIF breed_lower LIKE '%golden retriever%' THEN
            new_friendliness := LEAST(pet_record.friendliness, 95);
            new_playfulness := LEAST(pet_record.playfulness, 90);
            new_energy := LEAST(pet_record.energy, 85);
            new_loyalty := LEAST(pet_record.loyalty, 90);
            new_curiosity := LEAST(pet_record.curiosity, 80);
        ELSIF breed_lower LIKE '%husky%' THEN
            new_friendliness := LEAST(pet_record.friendliness, 80);
            new_playfulness := LEAST(pet_record.playfulness, 95);
            new_energy := LEAST(pet_record.energy, 100);
            new_loyalty := LEAST(pet_record.loyalty, 80);
            new_curiosity := LEAST(pet_record.curiosity, 90);
        ELSIF breed_lower LIKE '%yellow lab%' THEN
            new_friendliness := LEAST(pet_record.friendliness, 95);
            new_playfulness := LEAST(pet_record.playfulness, 85);
            new_energy := LEAST(pet_record.energy, 85);
            new_loyalty := LEAST(pet_record.loyalty, 95);
            new_curiosity := LEAST(pet_record.curiosity, 75);
        ELSIF breed_lower LIKE '%chihuahua%' THEN
            new_friendliness := LEAST(pet_record.friendliness, 70);
            new_playfulness := LEAST(pet_record.playfulness, 85);
            new_energy := LEAST(pet_record.energy, 80);
            new_loyalty := LEAST(pet_record.loyalty, 90);
            new_curiosity := LEAST(pet_record.curiosity, 85);
        ELSIF breed_lower LIKE '%dalmatian%' THEN
            new_friendliness := LEAST(pet_record.friendliness, 85);
            new_playfulness := LEAST(pet_record.playfulness, 90);
            new_energy := LEAST(pet_record.energy, 95);
            new_loyalty := LEAST(pet_record.loyalty, 85);
            new_curiosity := LEAST(pet_record.curiosity, 80);
        ELSIF breed_lower LIKE '%black cat%' THEN
            new_friendliness := LEAST(pet_record.friendliness, 75);
            new_playfulness := LEAST(pet_record.playfulness, 90);
            new_energy := LEAST(pet_record.energy, 85);
            new_loyalty := LEAST(pet_record.loyalty, 75);
            new_curiosity := LEAST(pet_record.curiosity, 95);
        ELSIF breed_lower LIKE '%orange cat%' THEN
            new_friendliness := LEAST(pet_record.friendliness, 85);
            new_playfulness := LEAST(pet_record.playfulness, 90);
            new_energy := LEAST(pet_record.energy, 85);
            new_loyalty := LEAST(pet_record.loyalty, 80);
            new_curiosity := LEAST(pet_record.curiosity, 90);
        ELSIF breed_lower LIKE '%persian%' THEN
            new_friendliness := LEAST(pet_record.friendliness, 80);
            new_playfulness := LEAST(pet_record.playfulness, 70);
            new_energy := LEAST(pet_record.energy, 60);
            new_loyalty := LEAST(pet_record.loyalty, 85);
            new_curiosity := LEAST(pet_record.curiosity, 80);
        ELSE
            -- For unknown breeds, cap at 100
            new_friendliness := LEAST(pet_record.friendliness, 100);
            new_playfulness := LEAST(pet_record.playfulness, 100);
            new_energy := LEAST(pet_record.energy, 100);
            new_loyalty := LEAST(pet_record.loyalty, 100);
            new_curiosity := LEAST(pet_record.curiosity, 100);
        END IF;
        
        -- Update the pet with corrected stats
        UPDATE user_pets 
        SET 
            friendliness = new_friendliness,
            playfulness = new_playfulness,
            energy = new_energy,
            loyalty = new_loyalty,
            curiosity = new_curiosity
        WHERE id = pet_record.id;
        
        -- Log the correction
        RAISE NOTICE 'Fixed stats for pet % (%) - breed: %', 
            pet_record.pet_name, pet_record.id, pet_record.breed;
            
    END LOOP;
END;
$$;

-- Execute the function to fix all pets
SELECT fix_pet_stats();

-- Drop the function as it's no longer needed
DROP FUNCTION fix_pet_stats();

-- Add a comment for the migration
COMMENT ON TABLE user_pets IS 'Stats corrected for pets with over stats on 2025-01-13';
