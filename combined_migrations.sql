-- ============================================
-- Electrician Estimate & Invoice App - Combined Migrations
-- Run this in Supabase SQL Editor
-- https://supabase.com/dashboard/project/dzezhmpqnksbymscpyuu/sql
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Business Profile (single row per team)
CREATE TABLE business_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  logo_url TEXT,
  address TEXT,
  phone VARCHAR(50),
  email VARCHAR(255),
  website VARCHAR(255),
  tax_id VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  full_name VARCHAR(255),
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'viewer')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clients
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Estimates
CREATE TABLE estimates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL,
  client_id UUID NOT NULL,
  estimate_number VARCHAR(50) NOT NULL UNIQUE,
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'sent', 'viewed', 'accepted', 'expired', 'rejected'
  )),
  valid_until DATE NOT NULL,
  public_token TEXT UNIQUE,
  notes TEXT,
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  tax_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  total DECIMAL(12,2) NOT NULL DEFAULT 0,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Estimate Line Items
CREATE TABLE estimate_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_id UUID NOT NULL,
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit VARCHAR(100),
  rate DECIMAL(12,2) NOT NULL DEFAULT 0,
  amount DECIMAL(12,2) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoices
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL,
  client_id UUID NOT NULL,
  estimate_id UUID,
  invoice_number VARCHAR(50) NOT NULL UNIQUE,
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'sent', 'partial', 'paid', 'overdue'
  )),
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  notes TEXT,
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  tax_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  late_fee_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  late_fee_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  total DECIMAL(12,2) NOT NULL DEFAULT 0,
  amount_paid DECIMAL(12,2) NOT NULL DEFAULT 0,
  amount_due DECIMAL(12,2) NOT NULL DEFAULT 0,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoice Line Items
CREATE TABLE invoice_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL,
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit VARCHAR(100),
  rate DECIMAL(12,2) NOT NULL DEFAULT 0,
  amount DECIMAL(12,2) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  payment_method VARCHAR(50),
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  transaction_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Estimate Views (tracking)
CREATE TABLE estimate_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_id UUID NOT NULL,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address VARCHAR(45),
  user_agent TEXT
);

-- Foreign Keys
ALTER TABLE profiles ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE estimate_line_items ADD CONSTRAINT estimate_line_items_estimate_id_fkey FOREIGN KEY (estimate_id) REFERENCES estimates(id) ON DELETE CASCADE;
ALTER TABLE invoice_line_items ADD CONSTRAINT invoice_line_items_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE;
ALTER TABLE payments ADD CONSTRAINT payments_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE;
ALTER TABLE estimate_views ADD CONSTRAINT estimate_views_estimate_id_fkey FOREIGN KEY (estimate_id) REFERENCES estimates(id) ON DELETE CASCADE;
ALTER TABLE estimates ADD CONSTRAINT estimates_client_id_fkey FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT;
ALTER TABLE invoices ADD CONSTRAINT invoices_client_id_fkey FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT;
ALTER TABLE invoices ADD CONSTRAINT invoices_estimate_id_fkey FOREIGN KEY (estimate_id) REFERENCES estimates(id) ON DELETE SET NULL;

-- Indexes for performance
CREATE INDEX idx_estimates_team_id ON estimates(team_id);
CREATE INDEX idx_estimates_client_id ON estimates(client_id);
CREATE INDEX idx_estimates_status ON estimates(status);
CREATE INDEX idx_invoices_team_id ON invoices(team_id);
CREATE INDEX idx_invoices_client_id ON invoices(client_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_clients_team_id ON clients(team_id);
CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);

-- Function to generate estimate numbers
CREATE OR REPLACE FUNCTION generate_estimate_number()
RETURNS TEXT AS $$
DECLARE
  prefix TEXT := 'EST';
  last_num INTEGER;
  new_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(estimate_number FROM '\d+$') AS INTEGER)
  ), 0) INTO last_num
  FROM estimates
  WHERE estimate_number LIKE prefix || '%';

  new_num := last_num + 1;
  RETURN prefix || '-' || TO_CHAR(new_num, 'FM000000');
END;
$$ LANGUAGE plpgsql;

-- Function to generate invoice numbers
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
  prefix TEXT := 'INV';
  last_num INTEGER;
  new_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(invoice_number FROM '\d+$') AS INTEGER)
  ), 0) INTO last_num
  FROM invoices
  WHERE invoice_number LIKE prefix || '%';

  new_num := last_num + 1;
  RETURN prefix || '-' || TO_CHAR(new_num, 'FM000000');
END;
$$ LANGUAGE plpgsql;

-- Function to generate public tokens
CREATE OR REPLACE FUNCTION generate_public_token()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'base64');
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_business_profiles_updated_at
  BEFORE UPDATE ON business_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_estimates_updated_at
  BEFORE UPDATE ON estimates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimate_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Business profiles policies
CREATE POLICY "Team members can view business profile"
  ON business_profiles FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage business profile"
  ON business_profiles FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Clients policies
CREATE POLICY "Team members can view clients"
  ON clients FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage clients"
  ON clients FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Estimates policies
CREATE POLICY "Team members can view estimates"
  ON estimates FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage estimates"
  ON estimates FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Estimate line items policies
CREATE POLICY "Team members can view estimate line items"
  ON estimate_line_items FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage estimate line items"
  ON estimate_line_items FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Invoices policies
CREATE POLICY "Team members can view invoices"
  ON invoices FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage invoices"
  ON invoices FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Invoice line items policies
CREATE POLICY "Team members can view invoice line items"
  ON invoice_line_items FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage invoice line items"
  ON invoice_line_items FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Payments policies
CREATE POLICY "Team members can view payments"
  ON payments FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage payments"
  ON payments FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;

-- Functions for estimate number generation with trigger
CREATE OR REPLACE FUNCTION set_estimate_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.estimate_number := generate_estimate_number();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_estimate_number_before_insert
  BEFORE INSERT ON estimates
  FOR EACH ROW
  WHEN (NEW.estimate_number IS NULL)
  EXECUTE FUNCTION set_estimate_number();

-- Function for invoice number generation with trigger
CREATE OR REPLACE FUNCTION set_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.invoice_number := generate_invoice_number();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_invoice_number_before_insert
  BEFORE INSERT ON invoices
  FOR EACH ROW
  WHEN (NEW.invoice_number IS NULL)
  EXECUTE FUNCTION set_invoice_number();

-- Function for public token generation with trigger
CREATE OR REPLACE FUNCTION set_public_token()
RETURNS TRIGGER AS $$
BEGIN
  NEW.public_token := generate_public_token();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_public_token_before_insert
  BEFORE INSERT ON estimates
  FOR EACH ROW
  WHEN (NEW.public_token IS NULL)
  EXECUTE FUNCTION set_public_token();

-- ============================================
-- COMPLETE
-- ============================================
