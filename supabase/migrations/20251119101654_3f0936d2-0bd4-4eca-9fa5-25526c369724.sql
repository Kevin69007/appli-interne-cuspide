-- Add justification columns to pointage table
ALTER TABLE pointage 
ADD COLUMN IF NOT EXISTS justification_requise BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS raison_ecart TEXT,
ADD COLUMN IF NOT EXISTS details_justification JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS ecart_totalement_justifie BOOLEAN DEFAULT TRUE;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_pointage_employee_date ON pointage(employee_id, date DESC);

-- Add RLS policies for employees to manage their own declarations
CREATE POLICY "Employees can view own time declarations"
ON pointage FOR SELECT
USING (
  employee_id IN (
    SELECT id FROM employees WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Employees can insert own time declarations"
ON pointage FOR INSERT
WITH CHECK (
  employee_id IN (
    SELECT id FROM employees WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Employees can update own today declarations"
ON pointage FOR UPDATE
USING (
  employee_id IN (
    SELECT id FROM employees WHERE user_id = auth.uid()
  )
  AND date = CURRENT_DATE
)
WITH CHECK (
  employee_id IN (
    SELECT id FROM employees WHERE user_id = auth.uid()
  )
  AND date = CURRENT_DATE
);