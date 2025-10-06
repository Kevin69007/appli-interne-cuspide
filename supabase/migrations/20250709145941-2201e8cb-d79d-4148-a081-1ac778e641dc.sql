
-- Birth litter #14 and set birthday to today
UPDATE breeding_pairs 
SET 
  is_born = true,
  birth_date = NOW(),
  wean_date = NOW() + INTERVAL '14 days'
WHERE litter_number = 14 AND NOT is_born;

-- Generate babies for litter #14 if they don't exist
INSERT INTO litter_babies (
  breeding_pair_id,
  pet_name,
  breed,
  gender,
  parent1_breed,
  parent2_breed,
  birthday,
  friendliness,
  playfulness,
  energy,
  loyalty,
  curiosity,
  description
)
SELECT 
  bp.id,
  'Baby ' || generate_series,
  CASE WHEN random() < 0.5 THEN p1.breed ELSE p2.breed END,
  CASE WHEN random() < 0.5 THEN 'Male' ELSE 'Female' END,
  p1.breed,
  p2.breed,
  CURRENT_DATE,
  LEAST(80, GREATEST(20, (p1.friendliness + p2.friendliness) / 2 + (random() * 20 - 10)::integer)),
  LEAST(80, GREATEST(20, (p1.playfulness + p2.playfulness) / 2 + (random() * 20 - 10)::integer)),
  LEAST(80, GREATEST(20, (p1.energy + p2.energy) / 2 + (random() * 20 - 10)::integer)),
  LEAST(80, GREATEST(20, (p1.loyalty + p2.loyalty) / 2 + (random() * 20 - 10)::integer)),
  LEAST(80, GREATEST(20, (p1.curiosity + p2.curiosity) / 2 + (random() * 20 - 10)::integer)),
  'Baby from litter #14'
FROM breeding_pairs bp
JOIN user_pets p1 ON bp.parent1_id = p1.id
JOIN user_pets p2 ON bp.parent2_id = p2.id
CROSS JOIN generate_series(1, 4) -- Generate 4 babies
WHERE bp.litter_number = 14
AND NOT EXISTS (
  SELECT 1 FROM litter_babies lb WHERE lb.breeding_pair_id = bp.id
);
