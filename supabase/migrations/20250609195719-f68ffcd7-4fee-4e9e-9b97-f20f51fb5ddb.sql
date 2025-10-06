
-- Remove "and partnerships" from breeding forum description
UPDATE public.forums 
SET description = 'Share breeding experiences and tips with other pet owners'
WHERE name = 'Breeding and Partnerships';

-- Swap the order positions of Adoption and Breeding forums
-- First, get current positions to understand the swap
-- Assuming Adoption is currently position 2 and Breeding is position 1
-- We'll set Adoption to position 1 and Breeding to position 2

UPDATE public.forums 
SET order_position = 1
WHERE name = 'Adoption';

UPDATE public.forums 
SET order_position = 2
WHERE name = 'Breeding and Partnerships';
