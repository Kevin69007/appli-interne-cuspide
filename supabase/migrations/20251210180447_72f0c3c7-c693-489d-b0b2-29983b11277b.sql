-- Add validation_responsable_id column to tasks table
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS validation_responsable_id UUID REFERENCES public.employees(id);

-- For existing tasks, set the creator as the validation responsible
UPDATE public.tasks 
SET validation_responsable_id = created_by 
WHERE validation_responsable_id IS NULL AND created_by IS NOT NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_tasks_validation_responsable_id ON public.tasks(validation_responsable_id);

-- Add comment for documentation
COMMENT ON COLUMN public.tasks.validation_responsable_id IS 'Employee responsible for validating task closure. NULL = no validation required, UUID = this person must validate.';