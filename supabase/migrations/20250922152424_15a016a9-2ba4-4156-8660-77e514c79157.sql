-- Remove the previous extra_energy column since we need to use extra_stats instead
ALTER TABLE public.pets 
DROP COLUMN IF EXISTS extra_energy;

-- Update pet 106 to be an odd stat pet with an extra energy stat
UPDATE public.pets 
SET extra_stats = jsonb_build_object(
  'is_odd_stat', true,
  'duplicate_pattern', 'energy_duplicate',
  'energy_alt', 106
)
WHERE id = '106c3b6a-1b12-42d6-b00b-c1da8f44e6ff';