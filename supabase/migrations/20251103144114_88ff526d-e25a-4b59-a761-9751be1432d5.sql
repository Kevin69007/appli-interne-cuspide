-- Corriger les dernières fonctions sans search_path

CREATE OR REPLACE FUNCTION public.check_test_submission_rate()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  submission_count INTEGER;
BEGIN
  -- Count submissions from this email in the last 24 hours
  SELECT COUNT(*)
  INTO submission_count
  FROM public.test_results
  WHERE candidate_email = NEW.candidate_email
    AND created_at > NOW() - INTERVAL '24 hours';
  
  -- Allow max 3 submissions per email per day
  IF submission_count >= 3 THEN
    RAISE EXCEPTION 'Too many test submissions from this email address. Please contact support if you need to retake the test.';
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_test_result_data()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Sanitize candidate name (remove potentially harmful characters)
  NEW.candidate_name := trim(regexp_replace(NEW.candidate_name, '[<>&"'']', '', 'g'));
  
  -- Ensure candidate_email is properly formatted and not too long
  NEW.candidate_email := lower(trim(NEW.candidate_email));
  
  -- Validate email format
  IF NEW.candidate_email !~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;
  
  -- Check for existing completed test (all 5 tests completed)
  IF EXISTS (
    SELECT 1 FROM public.test_results 
    WHERE candidate_email = NEW.candidate_email 
    AND tests_completed = 5
  ) THEN
    RAISE EXCEPTION 'Ce candidat a déjà complété tous les tests. Un seul test complet est autorisé par email.';
  END IF;
  
  -- Validate score ranges
  IF NEW.global_score < 0 OR NEW.global_score > 100 THEN
    RAISE EXCEPTION 'Global score must be between 0 and 100';
  END IF;
  
  -- Validate individual game scores
  IF NEW.speed_score IS NOT NULL AND (NEW.speed_score < 0 OR NEW.speed_score > 100) THEN
    RAISE EXCEPTION 'Speed score must be between 0 and 100';
  END IF;
  
  IF NEW.memory_score IS NOT NULL AND (NEW.memory_score < 0 OR NEW.memory_score > 100) THEN
    RAISE EXCEPTION 'Memory score must be between 0 and 100';
  END IF;
  
  IF NEW.rigor_score IS NOT NULL AND (NEW.rigor_score < 0 OR NEW.rigor_score > 100) THEN
    RAISE EXCEPTION 'Rigor score must be between 0 and 100';
  END IF;
  
  IF NEW.logic_score IS NOT NULL AND (NEW.logic_score < 0 OR NEW.logic_score > 100) THEN
    RAISE EXCEPTION 'Logic score must be between 0 and 100';
  END IF;
  
  IF NEW.observation_score IS NOT NULL AND (NEW.observation_score < 0 OR NEW.observation_score > 100) THEN
    RAISE EXCEPTION 'Observation score must be between 0 and 100';
  END IF;
  
  -- Validate tests completed count
  IF NEW.tests_completed < 0 OR NEW.tests_completed > 5 THEN
    RAISE EXCEPTION 'Tests completed must be between 0 and 5';
  END IF;
  
  -- Limit raw_details JSON size to prevent abuse
  IF NEW.raw_details IS NOT NULL AND length(NEW.raw_details::text) > 10000 THEN
    RAISE EXCEPTION 'Raw details data is too large';
  END IF;
  
  RETURN NEW;
END;
$function$;