
-- Add "Announcements" forum at the top
INSERT INTO public.forums (name, description, order_position)
VALUES ('Announcements', 'Official announcements and updates from the PawPets team', 0);

-- Update existing forums' order_position to make room for Announcements
UPDATE public.forums 
SET order_position = order_position + 1
WHERE name != 'Announcements';

-- Remove "and partnerships" from breeding forum description
UPDATE public.forums 
SET description = 'Share breeding experiences and tips with other pet owners'
WHERE name = 'Breeding and Partnerships';

-- Replace description in adoption forum
UPDATE public.forums 
SET description = 'Buy and Sell Pets'
WHERE name = 'Adoption';

-- Replace "novapets" with "PawPets" in Site Feedback description
UPDATE public.forums 
SET description = REPLACE(description, 'novapets', 'PawPets')
WHERE name = 'Site Feedback';

-- Swap placement of breeding and adoption forums by updating their order_position values directly
-- First get the current positions
WITH forum_positions AS (
  SELECT 
    name,
    order_position,
    CASE 
      WHEN name = 'Adoption' THEN (SELECT order_position FROM public.forums WHERE name = 'Breeding and Partnerships')
      WHEN name = 'Breeding and Partnerships' THEN (SELECT order_position FROM public.forums WHERE name = 'Adoption')
    END as new_position
  FROM public.forums 
  WHERE name IN ('Adoption', 'Breeding and Partnerships')
)
UPDATE public.forums 
SET order_position = fp.new_position
FROM forum_positions fp
WHERE forums.name = fp.name 
AND fp.new_position IS NOT NULL;
