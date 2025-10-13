-- Ajouter la colonne photo_url aux employés
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Créer le bucket pour les photos de profil
INSERT INTO storage.buckets (id, name, public) 
VALUES ('employee-photos', 'employee-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Politique: tout le monde peut voir les photos (bucket public)
CREATE POLICY "Employee photos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'employee-photos');

-- Politique: les employés peuvent uploader leur propre photo
CREATE POLICY "Employees can upload their own photo"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'employee-photos' AND 
  auth.uid() IN (
    SELECT user_id FROM public.employees 
    WHERE id::text = (storage.foldername(name))[1]
  )
);

-- Politique: les employés peuvent mettre à jour leur propre photo
CREATE POLICY "Employees can update their own photo"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'employee-photos' AND 
  auth.uid() IN (
    SELECT user_id FROM public.employees 
    WHERE id::text = (storage.foldername(name))[1]
  )
);

-- Politique: les admins et managers peuvent gérer toutes les photos
CREATE POLICY "Admins and managers can manage all employee photos"
ON storage.objects FOR ALL
USING (
  bucket_id = 'employee-photos' AND 
  (has_role(auth.uid(), 'admin'::app_role) OR is_manager())
);

-- Politique: les employés peuvent supprimer leur propre photo
CREATE POLICY "Employees can delete their own photo"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'employee-photos' AND 
  auth.uid() IN (
    SELECT user_id FROM public.employees 
    WHERE id::text = (storage.foldername(name))[1]
  )
);