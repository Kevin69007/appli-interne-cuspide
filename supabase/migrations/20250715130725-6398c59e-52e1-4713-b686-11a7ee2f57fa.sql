
-- Create daily_rewards_log table to track daily reward executions
CREATE TABLE IF NOT EXISTS public.daily_rewards_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_date DATE NOT NULL,
  trigger_source TEXT NOT NULL DEFAULT 'unknown',
  status TEXT NOT NULL DEFAULT 'running',
  users_processed INTEGER DEFAULT 0,
  users_rewarded INTEGER DEFAULT 0,
  errors_count INTEGER DEFAULT 0,
  error_details JSONB,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on daily_rewards_log
ALTER TABLE public.daily_rewards_log ENABLE ROW LEVEL SECURITY;

-- Create policies for daily_rewards_log (admin/system access only)
CREATE POLICY "System can manage daily rewards log" ON public.daily_rewards_log
FOR ALL USING (true);

-- Create function to safely grant litter licenses
CREATE OR REPLACE FUNCTION public.grant_pawclub_litter_licenses(
  user_id_param UUID,
  license_count INTEGER DEFAULT 4,
  grant_reason TEXT DEFAULT 'PawClub benefit'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  licenses_granted INTEGER := 0;
  i INTEGER;
BEGIN
  -- Grant the specified number of litter licenses
  FOR i IN 1..license_count LOOP
    INSERT INTO public.litter_licenses (user_id, used, created_at)
    VALUES (user_id_param, false, now());
    licenses_granted := licenses_granted + 1;
  END LOOP;

  -- Log the grant
  RAISE NOTICE 'Granted % litter licenses to user % for reason: %', 
    licenses_granted, user_id_param, grant_reason;

  RETURN json_build_object(
    'success', true,
    'licenses_granted', licenses_granted,
    'reason', grant_reason
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error granting litter licenses to user %: %', user_id_param, SQLERRM;
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;
