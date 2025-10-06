
-- Create paw_dollar_transactions table
CREATE TABLE IF NOT EXISTS public.paw_dollar_transactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  type text NOT NULL CHECK (type IN ('purchase', 'gift', 'spend')),
  description text NOT NULL,
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.paw_dollar_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own transactions" ON public.paw_dollar_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions" ON public.paw_dollar_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_paw_dollar_transactions_user_id ON public.paw_dollar_transactions(user_id);
CREATE INDEX idx_paw_dollar_transactions_created_at ON public.paw_dollar_transactions(created_at DESC);
