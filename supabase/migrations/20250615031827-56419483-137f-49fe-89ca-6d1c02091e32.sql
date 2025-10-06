
-- Clean up duplicate Persian cats while preserving the original EtherealSnailfish
-- First, identify and delete duplicate Persian cats created after EtherealSnailfish
WITH original_persian AS (
  SELECT adopted_at, user_id 
  FROM user_pets 
  WHERE pet_name = 'EtherealSnailfish' AND breed = 'Persian' AND energy = -5
  LIMIT 1
),
duplicate_persians AS (
  SELECT up.id
  FROM user_pets up
  CROSS JOIN original_persian op
  WHERE up.breed = 'Persian' 
  AND up.energy = -5
  AND up.pet_name != 'EtherealSnailfish'
  AND up.user_id = op.user_id
  AND up.adopted_at > op.adopted_at
)
DELETE FROM user_pets 
WHERE id IN (SELECT id FROM duplicate_persians);

-- Clean up any orphaned records
DELETE FROM shelter_pets WHERE user_pet_id NOT IN (SELECT id FROM user_pets);
UPDATE pet_sales SET is_active = false WHERE user_pet_id NOT IN (SELECT id FROM user_pets);
DELETE FROM pet_transactions WHERE pet_id NOT IN (SELECT id FROM user_pets);
DELETE FROM breeding_pairs WHERE parent1_id NOT IN (SELECT id FROM user_pets) OR parent2_id NOT IN (SELECT id FROM user_pets);
DELETE FROM litter_babies WHERE breeding_pair_id NOT IN (SELECT id FROM breeding_pairs);

-- Enable pg_cron extension for daily rewards
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create daily rewards cron job for 12 AM EST (5 AM UTC)
SELECT cron.schedule(
  'daily-paw-points-reward',
  '0 5 * * *', -- 5 AM UTC = 12 AM EST
  $$
  SELECT
    net.http_post(
        url:='https://tqsbvqpxtzecyhjtqojj.supabase.co/functions/v1/daily-rewards',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxc2J2cXB4dHplY3loanRxb2pqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkyMDg5NzgsImV4cCI6MjA2NDc4NDk3OH0.6xfyjsVrLli9t69M5qeQdEYbo5g5dmCg4_feuw0KRoU"}'::jsonb,
        body:='{"action": "daily_rewards"}'::jsonb
    ) as request_id;
  $$
);
