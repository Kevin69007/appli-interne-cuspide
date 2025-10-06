
-- Create functions for role management
CREATE OR REPLACE FUNCTION public.grant_user_role(target_user_id uuid, new_role app_role)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check if caller has admin privileges
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized: Admin access required');
  END IF;
  
  -- Check if target user exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = target_user_id) THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;
  
  -- Insert the role (will be ignored if already exists due to unique constraint)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, new_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Log the action
  PERFORM public.log_security_event(
    'role_granted',
    jsonb_build_object(
      'target_user_id', target_user_id,
      'role_granted', new_role,
      'granted_by', auth.uid()
    ),
    'info'
  );
  
  RETURN json_build_object('success', true, 'message', 'Role granted successfully');
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

CREATE OR REPLACE FUNCTION public.revoke_user_role(target_user_id uuid, role_to_revoke app_role)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check if caller has admin privileges
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized: Admin access required');
  END IF;
  
  -- Prevent revoking admin role from self (safety measure)
  IF target_user_id = auth.uid() AND role_to_revoke = 'admin' THEN
    RETURN json_build_object('success', false, 'error', 'Cannot revoke admin role from yourself');
  END IF;
  
  -- Delete the role
  DELETE FROM public.user_roles
  WHERE user_id = target_user_id AND role = role_to_revoke;
  
  -- Log the action
  PERFORM public.log_security_event(
    'role_revoked',
    jsonb_build_object(
      'target_user_id', target_user_id,
      'role_revoked', role_to_revoke,
      'revoked_by', auth.uid()
    ),
    'info'
  );
  
  RETURN json_build_object('success', true, 'message', 'Role revoked successfully');
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_roles_list(target_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  roles_array text[];
BEGIN
  -- Check if caller has admin privileges or is requesting their own roles
  IF NOT (public.has_role(auth.uid(), 'admin') OR auth.uid() = target_user_id) THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized');
  END IF;
  
  -- Get all roles for the user
  SELECT array_agg(role::text) INTO roles_array
  FROM public.user_roles
  WHERE user_id = target_user_id;
  
  RETURN json_build_object(
    'success', true,
    'roles', COALESCE(roles_array, ARRAY[]::text[])
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Update RLS policies for user_roles table to allow admins to manage roles
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

CREATE POLICY "Users can view their own roles or admins can view all"
ON public.user_roles
FOR SELECT
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
