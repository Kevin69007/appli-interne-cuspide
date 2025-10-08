-- Fix 1: Simplify RLS policy for managers to insert agenda entries
DROP POLICY IF EXISTS "Managers can insert team agenda entries" ON public.agenda_entries;

CREATE POLICY "Managers can insert agenda entries"
ON public.agenda_entries
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) 
  OR 
  is_manager()
);

-- Fix 2: Correct gravite_erreur enum values
-- First, set all existing gravite values to NULL to avoid conflicts
UPDATE public.agenda_entries SET gravite = NULL WHERE gravite IS NOT NULL;

-- Drop and recreate the enum with correct values
ALTER TYPE gravite_erreur RENAME TO gravite_erreur_old;

CREATE TYPE gravite_erreur AS ENUM ('mineure', 'moyenne', 'majeure', 'critique');

-- Update the column to use the new enum
ALTER TABLE public.agenda_entries 
  ALTER COLUMN gravite DROP DEFAULT,
  ALTER COLUMN gravite TYPE gravite_erreur USING gravite::text::gravite_erreur;

-- Drop the old enum
DROP TYPE gravite_erreur_old;