
-- First, let's clean up excess litter licenses for PawClub members
-- Remove excess unused litter licenses, keeping only 4 per user
WITH user_license_counts AS (
  SELECT 
    user_id,
    COUNT(*) as total_licenses,
    COUNT(*) - 4 as excess_licenses
  FROM litter_licenses 
  WHERE used = false
  GROUP BY user_id
  HAVING COUNT(*) > 4
),
licenses_to_delete AS (
  SELECT ll.id
  FROM litter_licenses ll
  JOIN user_license_counts ulc ON ll.user_id = ulc.user_id
  WHERE ll.used = false
  ORDER BY ll.created_at DESC
  LIMIT (SELECT SUM(excess_licenses) FROM user_license_counts)
  OFFSET 4
)
DELETE FROM litter_licenses 
WHERE id IN (SELECT id FROM licenses_to_delete);

-- Add a field to track the last subscription period end date for proper renewal detection
ALTER TABLE public.subscribers 
ADD COLUMN IF NOT EXISTS last_license_grant_period_end TIMESTAMPTZ DEFAULT NULL;

-- Reset the monthly tracking field to prevent future issues
UPDATE public.profiles 
SET pawclub_litter_licenses_granted_month = NULL 
WHERE pawclub_member = true;

-- Update the last_license_grant_period_end for existing subscribers to their current subscription_end
UPDATE public.subscribers 
SET last_license_grant_period_end = subscription_end 
WHERE subscribed = true AND subscription_end IS NOT NULL;
