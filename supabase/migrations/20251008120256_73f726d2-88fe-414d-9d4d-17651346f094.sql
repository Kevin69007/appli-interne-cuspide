-- Add validation tracking fields to agenda_entries
ALTER TABLE public.agenda_entries
ADD COLUMN IF NOT EXISTS valide_par uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS date_validation timestamp with time zone;