-- Add admin role to kevin.jean1@gmail.com
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'admin'::app_role
FROM public.profiles
WHERE email = 'kevin.jean1@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;