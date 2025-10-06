
-- Create the xp_transactions table for tracking XP gains
CREATE TABLE public.xp_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  xp_amount INTEGER NOT NULL,
  activity_type TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS) to ensure users can only see their own XP transactions
ALTER TABLE public.xp_transactions ENABLE ROW LEVEL SECURITY;

-- Create policy that allows users to view their own XP transactions
CREATE POLICY "Users can view their own XP transactions" 
  ON public.xp_transactions 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Create policy that allows users to insert their own XP transactions
CREATE POLICY "Users can create their own XP transactions" 
  ON public.xp_transactions 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Add index for better performance on user queries
CREATE INDEX idx_xp_transactions_user_id ON public.xp_transactions(user_id);
CREATE INDEX idx_xp_transactions_created_at ON public.xp_transactions(created_at DESC);
