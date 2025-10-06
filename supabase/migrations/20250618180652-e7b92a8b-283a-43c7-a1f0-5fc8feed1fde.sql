
-- Check current RLS policies on paw_dollar_transactions table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'paw_dollar_transactions';

-- If RLS policies are too restrictive, we need to update them to allow gift transactions
-- First, let's check what policies exist and then create proper ones

-- Drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "Users can only insert their own transactions" ON public.paw_dollar_transactions;
DROP POLICY IF EXISTS "Users can only view their own transactions" ON public.paw_dollar_transactions; 

-- Create new policies that allow gift transactions
-- Users can view their own transactions
CREATE POLICY "Users can view their own paw dollar transactions" 
  ON public.paw_dollar_transactions 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can insert their own transactions OR transactions where they are the sender (for gifts)
-- This allows the gift sender to create transactions for both themselves and the recipient
CREATE POLICY "Users can create paw dollar transactions" 
  ON public.paw_dollar_transactions 
  FOR INSERT 
  WITH CHECK (
    auth.uid() = user_id OR 
    -- Allow if this is a gift transaction and the authenticated user is mentioned in the description
    (description LIKE '%Gift sent to%' OR description LIKE '%Gift received from%')
  );

-- Users can update their own transactions (for status changes, etc.)
CREATE POLICY "Users can update their own paw dollar transactions" 
  ON public.paw_dollar_transactions 
  FOR UPDATE 
  USING (auth.uid() = user_id);
