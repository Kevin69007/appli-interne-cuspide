-- Check and fix manager_id foreign key

-- First, set any invalid manager_id to NULL
UPDATE public.employees
SET manager_id = NULL
WHERE manager_id IS NOT NULL 
  AND manager_id NOT IN (SELECT id FROM public.employees);

-- Drop constraint if it exists (but might be broken)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'employees_manager_id_fkey'
  ) THEN
    ALTER TABLE public.employees DROP CONSTRAINT employees_manager_id_fkey;
  END IF;
END $$;

-- Create the foreign key constraint
ALTER TABLE public.employees
ADD CONSTRAINT employees_manager_id_fkey 
FOREIGN KEY (manager_id) 
REFERENCES public.employees(id) 
ON DELETE SET NULL
ON UPDATE CASCADE;