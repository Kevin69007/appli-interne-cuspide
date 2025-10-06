
-- Update the check constraint on paw_dollar_transactions to allow gift transaction types
ALTER TABLE public.paw_dollar_transactions 
DROP CONSTRAINT IF EXISTS paw_dollar_transactions_type_check;

-- Add a new constraint that includes gift transaction types
ALTER TABLE public.paw_dollar_transactions 
ADD CONSTRAINT paw_dollar_transactions_type_check 
CHECK (type IN (
  'daily_reward',
  'wheel_spin',
  'purchase',
  'gift_sent',
  'gift_received',
  'pet_adoption',
  'first_pet_adoption',
  'pet_sale_received',
  'pet_purchase',
  'breeding_reward',
  'care_reward',
  'forum_post',
  'forum_reply'
));
