-- Correction de la fonction log_audit_action pour utiliser UUID au lieu de text
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
      OLD.id,
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
      NEW.id,
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
      NEW.id,
      auth.uid(),
      NULL,
      to_jsonb(NEW)
    );
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;