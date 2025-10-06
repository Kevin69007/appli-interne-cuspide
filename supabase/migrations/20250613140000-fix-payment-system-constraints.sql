
-- Add unique constraint to prevent duplicate Paw Dollar crediting for same session
-- We'll use a partial unique index instead of a constraint with WHERE clause
CREATE UNIQUE INDEX IF NOT EXISTS unique_stripe_session_transaction 
ON public.paw_dollar_transactions (user_id, (regexp_replace(description, '^.*Session: ([^-\s]+).*$', '\1'))) 
WHERE description LIKE '%Session:%';

-- Add index for faster lookup of transactions by session ID
CREATE INDEX IF NOT EXISTS idx_paw_dollar_transactions_session_lookup 
ON public.paw_dollar_transactions (user_id, description) 
WHERE description LIKE '%Session:%';

-- Add index for faster status filtering
CREATE INDEX IF NOT EXISTS idx_paw_dollar_transactions_status 
ON public.paw_dollar_transactions (status, created_at);
