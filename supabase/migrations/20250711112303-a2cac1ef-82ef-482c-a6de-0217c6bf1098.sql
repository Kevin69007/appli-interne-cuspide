
-- Birth litters 20 and 22 and generate their babies
UPDATE breeding_pairs 
SET 
  is_born = true,
  birth_date = NOW(),
  wean_date = NOW() + INTERVAL '14 days'
WHERE litter_number IN (20, 22) AND NOT is_born;

-- Generate babies for litter 20 if they don't exist
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
  (array['Luna', 'Max', 'Bella', 'Charlie', 'Lucy', 'Cooper', 'Daisy', 'Milo', 'Sadie', 'Buddy', 'Oliver', 'Sophie', 'Jack', 'Chloe', 'Oscar'])[floor(random() * 15 + 1)] || '_' || generate_series,
  CASE WHEN random() < 0.5 THEN p1.breed ELSE p2.breed END,
  CASE 
    WHEN (CASE WHEN random() < 0.5 THEN p1.breed ELSE p2.breed END) = 'Tortie' THEN 'Female'
    WHEN random() < 0.5 THEN 'Male' 
    ELSE 'Female' 
  END,
  p1.breed,
  p2.breed,
  CURRENT_DATE,
  LEAST(80, GREATEST(20, (p1.friendliness + p2.friendliness) / 2 + (random() * 20 - 10)::integer)),
  LEAST(80, GREATEST(20, (p1.playfulness + p2.playfulness) / 2 + (random() * 20 - 10)::integer)),
  LEAST(80, GREATEST(20, (p1.energy + p2.energy) / 2 + (random() * 20 - 10)::integer)),
  LEAST(80, GREATEST(20, (p1.loyalty + p2.loyalty) / 2 + (random() * 20 - 10)::integer)),
  LEAST(80, GREATEST(20, (p1.curiosity + p2.curiosity) / 2 + (random() * 20 - 10)::integer)),
  'Baby from litter #20'
FROM breeding_pairs bp
JOIN user_pets p1 ON bp.parent1_id = p1.id
JOIN user_pets p2 ON bp.parent2_id = p2.id
CROSS JOIN generate_series(1, COALESCE(bp.litter_size, 3))
WHERE bp.litter_number = 20
AND NOT EXISTS (
  SELECT 1 FROM litter_babies lb WHERE lb.breeding_pair_id = bp.id
);

-- Generate babies for litter 22 if they don't exist
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
  (array['Luna', 'Max', 'Bella', 'Charlie', 'Lucy', 'Cooper', 'Daisy', 'Milo', 'Sadie', 'Buddy', 'Oliver', 'Sophie', 'Jack', 'Chloe', 'Oscar'])[floor(random() * 15 + 1)] || '_' || generate_series,
  CASE WHEN random() < 0.5 THEN p1.breed ELSE p2.breed END,
  CASE 
    WHEN (CASE WHEN random() < 0.5 THEN p1.breed ELSE p2.breed END) = 'Tortie' THEN 'Female'
    WHEN random() < 0.5 THEN 'Male' 
    ELSE 'Female' 
  END,
  p1.breed,
  p2.breed,
  CURRENT_DATE,
  LEAST(80, GREATEST(20, (p1.friendliness + p2.friendliness) / 2 + (random() * 20 - 10)::integer)),
  LEAST(80, GREATEST(20, (p1.playfulness + p2.playfulness) / 2 + (random() * 20 - 10)::integer)),
  LEAST(80, GREATEST(20, (p1.energy + p2.energy) / 2 + (random() * 20 - 10)::integer)),
  LEAST(80, GREATEST(20, (p1.loyalty + p2.loyalty) / 2 + (random() * 20 - 10)::integer)),
  LEAST(80, GREATEST(20, (p1.curiosity + p2.curiosity) / 2 + (random() * 20 - 10)::integer)),
  'Baby from litter #22'
FROM breeding_pairs bp
JOIN user_pets p1 ON bp.parent1_id = p1.id
JOIN user_pets p2 ON bp.parent2_id = p2.id
CROSS JOIN generate_series(1, COALESCE(bp.litter_size, 3))
WHERE bp.litter_number = 22
AND NOT EXISTS (
  SELECT 1 FROM litter_babies lb WHERE lb.breeding_pair_id = bp.id
);
