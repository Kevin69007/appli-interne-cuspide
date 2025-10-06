
-- Add CASCADE deletion for litter_licenses table
ALTER TABLE public.litter_licenses 
DROP CONSTRAINT IF EXISTS litter_licenses_user_id_fkey;

ALTER TABLE public.litter_licenses 
ADD CONSTRAINT litter_licenses_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
