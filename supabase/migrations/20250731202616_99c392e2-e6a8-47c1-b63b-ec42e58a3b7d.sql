
-- Check current stats for pet #331 and their breed limits
SELECT 
  pet_name, 
  pet_number,
  breed,
  friendliness,
  playfulness, 
  energy,
  loyalty,
  curiosity,
  extra_stats
FROM user_pets 
WHERE pet_number = 331;

-- Check Golden Retriever breed limits (assuming this pet is Golden Retriever)
-- Golden Retriever max stats are: friendliness=95, playfulness=90, energy=85, loyalty=90, curiosity=80
-- If any stats exceed these limits, we need to fix them

-- Update pet #331 to ensure no over-stats while keeping green appearance
UPDATE user_pets 
SET 
  friendliness = LEAST(friendliness, 85),  -- Cap at 85 (well under 95 max)
  playfulness = LEAST(playfulness, 80),    -- Cap at 80 (well under 90 max)
  energy = LEAST(energy, 75),              -- Cap at 75 (well under 85 max)
  loyalty = LEAST(loyalty, 85),            -- Cap at 85 (well under 90 max)
  curiosity = LEAST(curiosity, 75),        -- Cap at 75 (well under 80 max)
  extra_stats = jsonb_set(
    extra_stats,
    '{friendliness_alt}',
    to_jsonb(LEAST((extra_stats->>'friendliness_alt')::int, 85))
  )
WHERE pet_number = 331;

-- Verify no over-stats remain
SELECT 
  pet_name, 
  pet_number,
  breed,
  friendliness,
  playfulness, 
  energy,
  loyalty,
  curiosity,
  extra_stats
FROM user_pets 
WHERE pet_number = 331;
