-- Create enum for order status
CREATE TYPE order_status AS ENUM (
  'draft',
  'pending_validation',
  'validated',
  'ordered',
  'delivered',
  'archived',
  'rejected'
);

-- Create enum for order validation mode
CREATE TYPE validation_mode AS ENUM (
  'auto',
  'manual'
);

-- Create enum for order method
CREATE TYPE order_method AS ENUM (
  'phone',
  'email',
  'platform',
  'other'
);

-- Table: suppliers (fournisseurs)
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_email TEXT,
  contact_phone TEXT,
  responsible_employee_id UUID REFERENCES employees(id),
  auto_email_on_order BOOLEAN DEFAULT false,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table: product_categories (catégories de produits)
CREATE TABLE product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table: product_references (références produits)
CREATE TABLE product_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_code TEXT NOT NULL,
  name TEXT NOT NULL,
  category_id UUID REFERENCES product_categories(id),
  supplier_id UUID REFERENCES suppliers(id) NOT NULL,
  packaging TEXT,
  minimum_order_quantity INTEGER DEFAULT 1,
  unit_price NUMERIC(10, 2),
  alert_threshold INTEGER DEFAULT 0,
  current_stock INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table: orders (commandes)
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE,
  supplier_id UUID REFERENCES suppliers(id) NOT NULL,
  created_by UUID REFERENCES employees(id) NOT NULL,
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_amount NUMERIC(10, 2),
  status order_status NOT NULL DEFAULT 'draft',
  validation_mode validation_mode NOT NULL DEFAULT 'manual',
  validated_by UUID REFERENCES employees(id),
  validated_at TIMESTAMPTZ,
  rejection_reason TEXT,
  order_method order_method,
  order_placed_at TIMESTAMPTZ,
  order_placed_by UUID REFERENCES employees(id),
  expected_delivery_date DATE,
  delivered_at TIMESTAMPTZ,
  delivered_by UUID REFERENCES employees(id),
  linked_task_id UUID,
  comments TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table: order_items (lignes de commande)
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  product_reference_id UUID REFERENCES product_references(id) NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(10, 2),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table: stock_movements (mouvements de stock)
CREATE TABLE stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_reference_id UUID REFERENCES product_references(id) NOT NULL,
  movement_type TEXT NOT NULL, -- 'in' (livraison), 'out' (sortie), 'adjustment' (ajustement)
  quantity INTEGER NOT NULL,
  order_id UUID REFERENCES orders(id),
  employee_id UUID REFERENCES employees(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table: user_validation_config (configuration validation par utilisateur)
CREATE TABLE user_validation_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) UNIQUE NOT NULL,
  validation_mode validation_mode NOT NULL DEFAULT 'manual',
  updated_by UUID REFERENCES employees(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_orders_supplier ON orders(supplier_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_by ON orders(created_by);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_reference_id);
CREATE INDEX idx_product_references_supplier ON product_references(supplier_id);
CREATE INDEX idx_product_references_category ON product_references(category_id);
CREATE INDEX idx_stock_movements_product ON stock_movements(product_reference_id);
CREATE INDEX idx_suppliers_responsible ON suppliers(responsible_employee_id);

-- Function to generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
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
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate order number
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number := generate_order_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_order_number
BEFORE INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION set_order_number();

-- Trigger to update stock on delivery
CREATE OR REPLACE FUNCTION update_stock_on_delivery()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_stock_on_delivery
AFTER UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION update_stock_on_delivery();

-- Trigger to update timestamps
CREATE TRIGGER update_suppliers_updated_at
BEFORE UPDATE ON suppliers
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_categories_updated_at
BEFORE UPDATE ON product_categories
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_references_updated_at
BEFORE UPDATE ON product_references
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_validation_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies for suppliers
CREATE POLICY "Admins can manage suppliers"
ON suppliers FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Managers and users can view suppliers"
ON suppliers FOR SELECT
USING (is_active = true);

-- RLS Policies for product_categories
CREATE POLICY "Admins can manage categories"
ON product_categories FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Everyone can view active categories"
ON product_categories FOR SELECT
USING (is_active = true);

-- RLS Policies for product_references
CREATE POLICY "Admins can manage product references"
ON product_references FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Everyone can view active references"
ON product_references FOR SELECT
USING (is_active = true);

-- RLS Policies for orders
CREATE POLICY "Admins can manage all orders"
ON orders FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Managers can view and validate orders"
ON orders FOR SELECT
USING (is_manager());

CREATE POLICY "Managers can update orders for validation"
ON orders FOR UPDATE
USING (is_manager())
WITH CHECK (is_manager());

CREATE POLICY "Users can create their own orders"
ON orders FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM employees
    WHERE id = orders.created_by
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can view their own orders"
ON orders FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM employees
    WHERE id = orders.created_by
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Responsible employees can view assigned orders"
ON orders FOR SELECT
USING (
  supplier_id IN (
    SELECT id FROM suppliers
    WHERE responsible_employee_id IN (
      SELECT id FROM employees WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Responsible employees can update assigned orders"
ON orders FOR UPDATE
USING (
  supplier_id IN (
    SELECT id FROM suppliers
    WHERE responsible_employee_id IN (
      SELECT id FROM employees WHERE user_id = auth.uid()
    )
  )
)
WITH CHECK (
  supplier_id IN (
    SELECT id FROM suppliers
    WHERE responsible_employee_id IN (
      SELECT id FROM employees WHERE user_id = auth.uid()
    )
  )
);

-- RLS Policies for order_items
CREATE POLICY "Users can manage items of their orders"
ON order_items FOR ALL
USING (
  order_id IN (
    SELECT id FROM orders
    WHERE created_by IN (
      SELECT id FROM employees WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Admins and managers can view all order items"
ON order_items FOR SELECT
USING (has_role(auth.uid(), 'admin') OR is_manager());

-- RLS Policies for stock_movements
CREATE POLICY "Admins can manage stock movements"
ON stock_movements FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Everyone can view stock movements"
ON stock_movements FOR SELECT
USING (true);

-- RLS Policies for user_validation_config
CREATE POLICY "Admins can manage validation config"
ON user_validation_config FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own config"
ON user_validation_config FOR SELECT
USING (
  employee_id IN (
    SELECT id FROM employees WHERE user_id = auth.uid()
  )
);