-- Add user_orders table for Perks app order history (for quick reordering)
-- This is separate from purchases table which is for POS transactions

CREATE TABLE IF NOT EXISTS public.user_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  items JSONB NOT NULL, -- Array of ordered items with details
  total_amount DECIMAL(10,2) NOT NULL,
  metadata JSONB DEFAULT '{}', -- Pickup time, notes, etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_user_orders_user ON public.user_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_user_orders_created ON public.user_orders(created_at DESC);

-- RLS Policies
ALTER TABLE public.user_orders ENABLE ROW LEVEL SECURITY;

-- Users can only see their own orders
CREATE POLICY "Users can view own orders"
  ON public.user_orders FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own orders
CREATE POLICY "Users can insert own orders"
  ON public.user_orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own orders
CREATE POLICY "Users can delete own orders"
  ON public.user_orders FOR DELETE
  USING (auth.uid() = user_id);
