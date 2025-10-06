
-- Remove old check constraints that reference non-existent columns
ALTER TABLE pets DROP CONSTRAINT IF EXISTS pets_base_bravery_check;
ALTER TABLE pets DROP CONSTRAINT IF EXISTS pets_base_intelligence_check;
ALTER TABLE pets DROP CONSTRAINT IF EXISTS pets_base_obedience_check;
ALTER TABLE pets DROP CONSTRAINT IF EXISTS pets_base_agility_check;

-- Ensure we have proper check constraints for the actual columns
ALTER TABLE pets ADD CONSTRAINT pets_base_friendliness_check CHECK (base_friendliness >= -25 AND base_friendliness <= 100);
ALTER TABLE pets ADD CONSTRAINT pets_base_playfulness_check CHECK (base_playfulness >= -25 AND base_playfulness <= 100);
ALTER TABLE pets ADD CONSTRAINT pets_base_energy_check CHECK (base_energy >= -25 AND base_energy <= 100);
ALTER TABLE pets ADD CONSTRAINT pets_base_loyalty_check CHECK (base_loyalty >= -25 AND base_loyalty <= 100);
ALTER TABLE pets ADD CONSTRAINT pets_base_curiosity_check CHECK (base_curiosity >= -25 AND base_curiosity <= 100);
