-- Add extra_energy column to pets table
ALTER TABLE public.pets 
ADD COLUMN extra_energy integer DEFAULT 0;

-- Set extra_energy to 106 for pet with id '106'
UPDATE public.pets 
SET extra_energy = 106 
WHERE id = '106';