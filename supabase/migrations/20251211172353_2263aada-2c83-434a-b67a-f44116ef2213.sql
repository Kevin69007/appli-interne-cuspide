-- Table pour stocker les souscriptions push de chaque appareil
CREATE TABLE public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  device_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(employee_id, endpoint)
);

-- Table pour les préférences de notification par utilisateur
CREATE TABLE public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID UNIQUE NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  push_enabled BOOLEAN DEFAULT true,
  task_assigned BOOLEAN DEFAULT true,
  task_reminder BOOLEAN DEFAULT true,
  task_overdue BOOLEAN DEFAULT true,
  task_completed BOOLEAN DEFAULT true,
  leave_request BOOLEAN DEFAULT true,
  leave_approved BOOLEAN DEFAULT true,
  meeting_reminder BOOLEAN DEFAULT true,
  communication_new BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Policies for push_subscriptions
CREATE POLICY "Employees can manage their own subscriptions"
ON public.push_subscriptions
FOR ALL
USING (EXISTS (
  SELECT 1 FROM employees
  WHERE employees.id = push_subscriptions.employee_id
  AND employees.user_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM employees
  WHERE employees.id = push_subscriptions.employee_id
  AND employees.user_id = auth.uid()
));

CREATE POLICY "Admins can view all subscriptions"
ON public.push_subscriptions
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Policies for notification_preferences
CREATE POLICY "Employees can manage their own preferences"
ON public.notification_preferences
FOR ALL
USING (EXISTS (
  SELECT 1 FROM employees
  WHERE employees.id = notification_preferences.employee_id
  AND employees.user_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM employees
  WHERE employees.id = notification_preferences.employee_id
  AND employees.user_id = auth.uid()
));

CREATE POLICY "Admins can view all preferences"
ON public.notification_preferences
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_push_subscriptions_updated_at
  BEFORE UPDATE ON public.push_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();