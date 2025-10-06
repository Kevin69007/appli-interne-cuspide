
-- Update the Creative Services forum to just "Creative" with shorter description
UPDATE public.forums 
SET 
  name = 'Creative',
  description = 'Commission custom artwork, profile pictures, and graphics'
WHERE name = 'Creative Services';
