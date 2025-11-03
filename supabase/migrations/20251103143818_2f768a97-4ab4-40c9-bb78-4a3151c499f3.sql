-- Correction des fonctions existantes sans search_path

CREATE OR REPLACE FUNCTION public.update_game_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  next_num INTEGER;
  year_suffix TEXT;
BEGIN
  year_suffix := TO_CHAR(CURRENT_DATE, 'YY');
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 4) AS INTEGER)), 0) + 1
  INTO next_num
  FROM orders
  WHERE order_number LIKE 'CMD' || year_suffix || '%';
  
  RETURN 'CMD' || year_suffix || LPAD(next_num::TEXT, 5, '0');
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_order_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number := generate_order_number();
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_stock_on_delivery()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
    -- Update stock levels for all items in the order
    UPDATE product_references pr
    SET current_stock = current_stock + oi.quantity,
        updated_at = now()
    FROM order_items oi
    WHERE oi.order_id = NEW.id
      AND oi.product_reference_id = pr.id;
    
    -- Create stock movement records
    INSERT INTO stock_movements (
      product_reference_id,
      movement_type,
      quantity,
      order_id,
      employee_id,
      notes
    )
    SELECT 
      oi.product_reference_id,
      'in',
      oi.quantity,
      NEW.id,
      NEW.delivered_by,
      'Livraison commande ' || NEW.order_number
    FROM order_items oi
    WHERE oi.order_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_audit_action()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
$function$;