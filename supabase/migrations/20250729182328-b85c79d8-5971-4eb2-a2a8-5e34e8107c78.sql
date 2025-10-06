
-- Phase 1: Critical Database Security Fixes

-- 1. Add missing SET search_path to database functions that lack it
CREATE OR REPLACE FUNCTION public.feed_shelter_pets()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  -- Update hunger to 100 for shelter pets that haven't been fed in 24+ hours
  UPDATE public.shelter_pets 
  SET 
    last_fed = now(),
    -- Also update the actual pet's hunger in user_pets table
    user_pet_id = (
      SELECT up.id FROM public.user_pets up 
      WHERE up.id = shelter_pets.user_pet_id
    )
  WHERE 
    is_available = true 
    AND last_fed < (now() - interval '24 hours');
    
  -- Update the actual pets' hunger
  UPDATE public.user_pets 
  SET 
    hunger = 100,
    last_fed = now()
  WHERE id IN (
    SELECT user_pet_id 
    FROM public.shelter_pets 
    WHERE is_available = true 
    AND last_fed < (now() - interval '24 hours')
  );
END;
$function$;

-- 2. Create secure alpha key validation function
CREATE OR REPLACE FUNCTION public.validate_alpha_key(key_input text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  valid_key text := 'NOVA2025'; -- This should be configurable in production
BEGIN
  -- Input validation
  IF key_input IS NULL OR length(trim(key_input)) = 0 THEN
    RETURN json_build_object('valid', false, 'error', 'Alpha key is required');
  END IF;
  
  -- Normalize and validate
  IF upper(trim(key_input)) = valid_key THEN
    RETURN json_build_object('valid', true, 'message', 'Alpha key accepted');
  ELSE
    RETURN json_build_object('valid', false, 'error', 'Invalid alpha key');
  END IF;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('valid', false, 'error', 'Validation failed');
END;
$function$;

-- 3. Create secure financial transaction validation
CREATE OR REPLACE FUNCTION public.validate_financial_transaction(
  user_id_param uuid,
  amount_param integer,
  transaction_type text
)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  user_balance integer;
  max_transaction_limit integer := 10000;
BEGIN
  -- Verify caller authorization
  IF auth.uid() != user_id_param THEN
    RETURN json_build_object('valid', false, 'error', 'Unauthorized transaction attempt');
  END IF;
  
  -- Input validation
  IF amount_param <= 0 OR amount_param > max_transaction_limit THEN
    RETURN json_build_object('valid', false, 'error', 'Invalid transaction amount');
  END IF;
  
  -- Check user balance for debit transactions
  IF transaction_type IN ('purchase', 'transfer_out', 'withdrawal') THEN
    SELECT paw_dollars INTO user_balance
    FROM public.profiles
    WHERE id = user_id_param;
    
    IF user_balance IS NULL THEN
      RETURN json_build_object('valid', false, 'error', 'User profile not found');
    END IF;
    
    IF user_balance < amount_param THEN
      RETURN json_build_object('valid', false, 'error', 'Insufficient funds');
    END IF;
  END IF;
  
  RETURN json_build_object('valid', true, 'message', 'Transaction validated');
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('valid', false, 'error', 'Transaction validation failed');
END;
$function$;

-- 4. Add input validation to existing RPC functions
CREATE OR REPLACE FUNCTION public.increment_paw_dollars(user_id uuid, amount integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  -- Input validation
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'User ID cannot be null';
  END IF;
  
  IF amount <= 0 OR amount > 10000 THEN
    RAISE EXCEPTION 'Invalid amount: must be between 1 and 10000';
  END IF;
  
  -- Verify user exists
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = user_id) THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;
  
  UPDATE public.profiles 
  SET paw_dollars = paw_dollars + amount 
  WHERE id = user_id;
END;
$function$;

-- 5. Add role-based access control validation function
CREATE OR REPLACE FUNCTION public.validate_admin_action(action_type text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  user_role app_role;
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;
  
  -- Get user role
  user_role := public.get_user_role(auth.uid());
  
  -- Validate admin actions
  IF action_type IN ('user_management', 'system_configuration', 'security_audit') THEN
    RETURN user_role = 'admin';
  END IF;
  
  -- Validate moderator actions
  IF action_type IN ('content_moderation', 'user_warnings') THEN
    RETURN user_role IN ('admin', 'moderator');
  END IF;
  
  RETURN false;
END;
$function$;

-- 6. Create audit logging for security events
CREATE TABLE IF NOT EXISTS public.security_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  event_data jsonb,
  ip_address inet,
  user_agent text,
  severity text NOT NULL DEFAULT 'info',
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on security events
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

-- Create policy for security events (admin only)
CREATE POLICY "Admins can view security events" 
  ON public.security_events 
  FOR SELECT 
  USING (public.has_role(auth.uid(), 'admin'));

-- 7. Create function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  event_type_param text,
  event_data_param jsonb DEFAULT NULL,
  severity_param text DEFAULT 'info'
)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO public.security_events (
    event_type,
    user_id,
    event_data,
    severity
  ) VALUES (
    event_type_param,
    auth.uid(),
    event_data_param,
    severity_param
  );
END;
$function$;
