
-- First, let's check the current stats of the problematic pets
SELECT pet_name, breed, friendliness, playfulness, energy, loyalty, curiosity
FROM user_pets 
WHERE pet_name IN ('Sai', 'Scherzo', 'Sophie', 'Sylvester', 'Rue')
ORDER BY pet_name;

-- Now let's create a corrected function with proper random seeding
CREATE OR REPLACE FUNCTION fix_overstated_pets()
RETURNS TABLE(pet_name TEXT, breed TEXT, old_stats TEXT, new_stats TEXT)
LANGUAGE plpgsql
AS $$
DECLARE
    pet_record RECORD;
    old_stats_text TEXT;
    new_stats_text TEXT;
    new_friendliness INTEGER;
    new_playfulness INTEGER;
    new_energy INTEGER;
    new_loyalty INTEGER;
    new_curiosity INTEGER;
    seed_value NUMERIC;
BEGIN
    -- Generate a proper seed value between -1 and 1
    seed_value := (extract(epoch from now())::numeric - floor(extract(epoch from now())::numeric)) * 2 - 1;
    PERFORM setseed(seed_value);
    
    -- Process each problematic pet individually
    FOR pet_record IN 
        SELECT up.id, up.pet_name, up.breed, up.friendliness, up.playfulness, up.energy, up.loyalty, up.curiosity
        FROM user_pets up
        WHERE up.pet_name IN ('Sai', 'Scherzo', 'Sophie', 'Sylvester', 'Rue')
    LOOP
        -- Store old stats for logging
        old_stats_text := pet_record.friendliness || '/' || pet_record.playfulness || '/' || 
                         pet_record.energy || '/' || pet_record.loyalty || '/' || pet_record.curiosity;
        
        -- Generate stats for each breed with proper randomization
        CASE LOWER(pet_record.breed)
            WHEN 'tuxedo cat' THEN
                new_friendliness := 25 + floor(random() * 56)::int;  -- 25-80
                new_playfulness := 35 + floor(random() * 51)::int;   -- 35-85
                new_energy := 30 + floor(random() * 51)::int;        -- 30-80
                new_loyalty := 25 + floor(random() * 56)::int;       -- 25-80
                new_curiosity := 45 + floor(random() * 51)::int;     -- 45-95
            WHEN 'golden retriever' THEN
                new_friendliness := 50 + floor(random() * 46)::int;  -- 50-95
                new_playfulness := 45 + floor(random() * 46)::int;   -- 45-90
                new_energy := 35 + floor(random() * 51)::int;        -- 35-85
                new_loyalty := 45 + floor(random() * 46)::int;       -- 45-90
                new_curiosity := 30 + floor(random() * 51)::int;     -- 30-80
            WHEN 'german shepherd' THEN
                new_friendliness := 30 + floor(random() * 56)::int;  -- 30-85
                new_playfulness := 20 + floor(random() * 56)::int;   -- 20-75
                new_energy := 40 + floor(random() * 51)::int;        -- 40-90
                new_loyalty := 50 + floor(random() * 46)::int;       -- 50-95
                new_curiosity := 25 + floor(random() * 56)::int;     -- 25-80
            ELSE
                -- Default stats for unknown breeds
                new_friendliness := 30 + floor(random() * 51)::int;
                new_playfulness := 30 + floor(random() * 51)::int;
                new_energy := 30 + floor(random() * 51)::int;
                new_loyalty := 30 + floor(random() * 51)::int;
                new_curiosity := 30 + floor(random() * 51)::int;
        END CASE;
        
        -- Update the pet with new stats
        UPDATE user_pets 
        SET 
            friendliness = new_friendliness,
            playfulness = new_playfulness,
            energy = new_energy,
            loyalty = new_loyalty,
            curiosity = new_curiosity
        WHERE id = pet_record.id;
        
        -- Create new stats text for logging
        new_stats_text := new_friendliness || '/' || new_playfulness || '/' || 
                         new_energy || '/' || new_loyalty || '/' || new_curiosity;
        
        -- Return the changes for verification
        RETURN QUERY SELECT pet_record.pet_name, pet_record.breed, old_stats_text, new_stats_text;
        
    END LOOP;
END;
$$;

-- Execute the function and show the results
SELECT * FROM fix_overstated_pets();

-- Verify the changes by checking the updated stats
SELECT pet_name, breed, friendliness, playfulness, energy, loyalty, curiosity
FROM user_pets 
WHERE pet_name IN ('Sai', 'Scherzo', 'Sophie', 'Sylvester', 'Rue')
ORDER BY pet_name;

-- Clean up the function
DROP FUNCTION fix_overstated_pets();

-- Add a final comment for tracking
COMMENT ON TABLE user_pets IS 'Fixed overstated pets (Sai, Scherzo, Sophie, Sylvester, Rue) with corrected randomization on 2025-06-11';
