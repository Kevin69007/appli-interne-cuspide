-- Create employee_badges table for gamification
CREATE TABLE IF NOT EXISTS employee_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  progress INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, badge_id)
);

-- Enable RLS
ALTER TABLE employee_badges ENABLE ROW LEVEL SECURITY;

-- Admins can manage all badges
CREATE POLICY "Admins can manage all badges"
  ON employee_badges
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Managers can view all badges
CREATE POLICY "Managers can view all badges"
  ON employee_badges
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR is_manager());

-- Employees can view their own badges
CREATE POLICY "Employees can view their own badges"
  ON employee_badges
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = employee_badges.employee_id
      AND employees.user_id = auth.uid()
    )
  );

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_employee_badges_employee_id ON employee_badges(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_badges_badge_id ON employee_badges(badge_id);