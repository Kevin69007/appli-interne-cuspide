-- Add missing columns to project_meetings table
ALTER TABLE public.project_meetings 
ADD COLUMN IF NOT EXISTS duree_minutes INTEGER,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS audio_url TEXT;

-- Update existing audio URLs
UPDATE public.project_meetings 
SET audio_url = fichier_audio_url 
WHERE fichier_audio_url IS NOT NULL AND audio_url IS NULL;