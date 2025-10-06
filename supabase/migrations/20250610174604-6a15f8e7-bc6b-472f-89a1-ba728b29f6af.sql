
-- Add CASCADE deletion for breeding_pairs table
ALTER TABLE public.breeding_pairs 
DROP CONSTRAINT IF EXISTS breeding_pairs_user_id_fkey;

ALTER TABLE public.breeding_pairs 
ADD CONSTRAINT breeding_pairs_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
