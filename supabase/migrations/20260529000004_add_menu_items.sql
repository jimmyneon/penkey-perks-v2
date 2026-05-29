-- Add menu_items table for order-ahead functionality
-- This allows customers to select from a predefined menu instead of free text

CREATE TABLE public.menu_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'coffee', 'food', 'snacks', 'drinks'
  price DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  image_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

-- Everyone can view active menu items
CREATE POLICY "Anyone can view active menu items"
  ON public.menu_items FOR SELECT
  USING (is_active = true);

-- Staff can manage menu items
CREATE POLICY "Staff can manage menu items"
  ON public.menu_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.staff_roles
      WHERE user_id = auth.uid()
      AND role IN ('manager', 'admin')
    )
  );

-- Add updated_at trigger
CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON public.menu_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample menu items
INSERT INTO public.menu_items (name, description, category, price, sort_order) VALUES
('Flat White', 'Double shot espresso with steamed milk', 'coffee', 3.50, 1),
('Latte', 'Double shot espresso with steamed milk and foam', 'coffee', 3.70, 2),
('Cappuccino', 'Double shot espresso with equal parts milk and foam', 'coffee', 3.60, 3),
('Americano', 'Double shot espresso with hot water', 'coffee', 3.20, 4),
('Espresso', 'Single shot of pure espresso', 'coffee', 2.50, 5),
('Bacon Bap', 'Bacon in a toasted bap with brown sauce', 'food', 4.50, 10),
('Sausage Bap', 'Sausage in a toasted bap with ketchup', 'food', 4.50, 11),
('Toastie', 'Ham and cheese toastie', 'food', 5.00, 12),
('Croissant', 'Butter croissant', 'food', 2.50, 13),
('Brownie', 'Chocolate brownie', 'snacks', 2.80, 20),
('Crisps', 'Packet of crisps', 'snacks', 1.00, 21),
('Cookie', 'Chocolate chip cookie', 'snacks', 1.50, 22),
('Orange Juice', 'Fresh orange juice', 'drinks', 2.50, 30),
('Water', 'Bottle of water', 'drinks', 1.50, 31);
