-- Clean up duplicate user roles (keep only the highest role)
-- Priority: admin > manager > user
DELETE FROM public.user_roles
WHERE id IN (
  SELECT ur.id
  FROM public.user_roles ur
  WHERE ur.role = 'user'
  AND EXISTS (
    SELECT 1 FROM public.user_roles ur2
    WHERE ur2.user_id = ur.user_id
    AND ur2.role IN ('admin', 'manager')
  )
);

-- Create missing employee entries for existing users
-- Only insert if the employee doesn't already exist
INSERT INTO public.employees (user_id, nom, prenom, poste)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data->>'nom', split_part(u.email, '@', 1)),
  COALESCE(u.raw_user_meta_data->>'prenom', 'Utilisateur'),
  COALESCE(u.raw_user_meta_data->>'poste', 'Non spécifié')
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.employees e WHERE e.user_id = u.id
)
ON CONFLICT DO NOTHING;