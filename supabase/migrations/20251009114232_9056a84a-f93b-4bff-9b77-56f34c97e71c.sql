-- Fonction générique pour enregistrer les actions dans audit_log
CREATE OR REPLACE FUNCTION public.log_audit_action()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    INSERT INTO public.audit_log (
      table_name,
      action,
      record_id,
      user_id,
      ancien_contenu,
      nouveau_contenu
    ) VALUES (
      TG_TABLE_NAME,
      TG_OP,
      OLD.id::text,
      auth.uid(),
      to_jsonb(OLD),
      NULL
    );
    RETURN OLD;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO public.audit_log (
      table_name,
      action,
      record_id,
      user_id,
      ancien_contenu,
      nouveau_contenu
    ) VALUES (
      TG_TABLE_NAME,
      TG_OP,
      NEW.id::text,
      auth.uid(),
      to_jsonb(OLD),
      to_jsonb(NEW)
    );
    RETURN NEW;
  ELSIF (TG_OP = 'INSERT') THEN
    INSERT INTO public.audit_log (
      table_name,
      action,
      record_id,
      user_id,
      ancien_contenu,
      nouveau_contenu
    ) VALUES (
      TG_TABLE_NAME,
      TG_OP,
      NEW.id::text,
      auth.uid(),
      NULL,
      to_jsonb(NEW)
    );
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

-- Trigger pour la table employees
DROP TRIGGER IF EXISTS audit_employees ON public.employees;
CREATE TRIGGER audit_employees
  AFTER INSERT OR UPDATE OR DELETE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_action();

-- Trigger pour la table agenda_entries
DROP TRIGGER IF EXISTS audit_agenda_entries ON public.agenda_entries;
CREATE TRIGGER audit_agenda_entries
  AFTER INSERT OR UPDATE OR DELETE ON public.agenda_entries
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_action();

-- Trigger pour la table tasks
DROP TRIGGER IF EXISTS audit_tasks ON public.tasks;
CREATE TRIGGER audit_tasks
  AFTER INSERT OR UPDATE OR DELETE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_action();

-- Trigger pour la table monthly_scores
DROP TRIGGER IF EXISTS audit_monthly_scores ON public.monthly_scores;
CREATE TRIGGER audit_monthly_scores
  AFTER INSERT OR UPDATE OR DELETE ON public.monthly_scores
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_action();

-- Trigger pour la table work_schedules
DROP TRIGGER IF EXISTS audit_work_schedules ON public.work_schedules;
CREATE TRIGGER audit_work_schedules
  AFTER INSERT OR UPDATE OR DELETE ON public.work_schedules
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_action();

-- Trigger pour la table communications
DROP TRIGGER IF EXISTS audit_communications ON public.communications;
CREATE TRIGGER audit_communications
  AFTER INSERT OR UPDATE OR DELETE ON public.communications
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_action();

-- Trigger pour la table quiz_monthly
DROP TRIGGER IF EXISTS audit_quiz_monthly ON public.quiz_monthly;
CREATE TRIGGER audit_quiz_monthly
  AFTER INSERT OR UPDATE OR DELETE ON public.quiz_monthly
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_action();

-- Trigger pour la table configuration
DROP TRIGGER IF EXISTS audit_configuration ON public.configuration;
CREATE TRIGGER audit_configuration
  AFTER INSERT OR UPDATE OR DELETE ON public.configuration
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_action();

-- Trigger pour la table user_roles
DROP TRIGGER IF EXISTS audit_user_roles ON public.user_roles;
CREATE TRIGGER audit_user_roles
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_action();

-- Trigger pour la table protocols
DROP TRIGGER IF EXISTS audit_protocols ON public.protocols;
CREATE TRIGGER audit_protocols
  AFTER INSERT OR UPDATE OR DELETE ON public.protocols
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_action();

-- Trigger pour la table job_documents
DROP TRIGGER IF EXISTS audit_job_documents ON public.job_documents;
CREATE TRIGGER audit_job_documents
  AFTER INSERT OR UPDATE OR DELETE ON public.job_documents
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_action();

-- Trigger pour la table quiz
DROP TRIGGER IF EXISTS audit_quiz ON public.quiz;
CREATE TRIGGER audit_quiz
  AFTER INSERT OR UPDATE OR DELETE ON public.quiz
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_action();