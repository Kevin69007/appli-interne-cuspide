
-- Remove any old endurance-related constraints that might still exist
ALTER TABLE pets DROP CONSTRAINT IF EXISTS pets_base_endurance_check;
ALTER TABLE pets DROP CONSTRAINT IF EXISTS petsbaseendurance_check;

-- Also remove any other old stat constraints that might cause similar issues
ALTER TABLE pets DROP CONSTRAINT IF EXISTS pets_base_agility_check;
ALTER TABLE pets DROP CONSTRAINT IF EXISTS pets_base_intelligence_check;
ALTER TABLE pets DROP CONSTRAINT IF EXISTS pets_base_obedience_check;
ALTER TABLE pets DROP CONSTRAINT IF EXISTS pets_base_bravery_check;

-- Ensure all current stat constraints allow negative values for lost stats
ALTER TABLE pets DROP CONSTRAINT IF EXISTS pets_base_friendliness_check;
ALTER TABLE pets DROP CONSTRAINT IF EXISTS pets_base_playfulness_check;
ALTER TABLE pets DROP CONSTRAINT IF EXISTS pets_base_energy_check;
ALTER TABLE pets DROP CONSTRAINT IF EXISTS pets_base_loyalty_check;
ALTER TABLE pets DROP CONSTRAINT IF EXISTS pets_base_curiosity_check;

-- Re-add the correct constraints that allow lost stats (-25 to 100)
ALTER TABLE pets ADD CONSTRAINT pets_base_friendliness_check CHECK (base_friendliness >= -25 AND base_friendliness <= 100);
ALTER TABLE pets ADD CONSTRAINT pets_base_playfulness_check CHECK (base_playfulness >= -25 AND base_playfulness <= 100);
ALTER TABLE pets ADD CONSTRAINT pets_base_energy_check CHECK (base_energy >= -25 AND base_energy <= 100);
ALTER TABLE pets ADD CONSTRAINT pets_base_loyalty_check CHECK (base_loyalty >= -25 AND base_loyalty <= 100);
ALTER TABLE pets ADD CONSTRAINT pets_base_curiosity_check CHECK (base_curiosity >= -25 AND base_curiosity <= 100);
