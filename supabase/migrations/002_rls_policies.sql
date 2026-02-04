-- Enable Row Level Security
ALTER TABLE business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimate_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimate_views ENABLE ROW LEVEL SECURITY;

-- Business Profiles Policies
CREATE POLICY "Users can view business profile"
  ON business_profiles FOR SELECT
  USING (true);

CREATE POLICY "Admins can update business profile"
  ON business_profiles FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Profiles Policies
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Admins can update profiles"
  ON profiles FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Clients Policies
CREATE POLICY "Team members can view clients"
  ON clients FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert clients"
  ON clients FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can update clients"
  ON clients FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete clients"
  ON clients FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Estimates Policies
CREATE POLICY "Team members can view estimates"
  ON estimates FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage estimates"
  ON estimates FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Estimate Line Items Policies
CREATE POLICY "Team members can view estimate items"
  ON estimate_line_items FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage estimate items"
  ON estimate_line_items FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Invoices Policies
CREATE POLICY "Team members can view invoices"
  ON invoices FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage invoices"
  ON invoices FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Invoice Line Items Policies
CREATE POLICY "Team members can view invoice items"
  ON invoice_line_items FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage invoice items"
  ON invoice_line_items FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Payments Policies
CREATE POLICY "Team members can view payments"
  ON payments FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage payments"
  ON payments FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Estimate Views Policies
CREATE POLICY "Anyone can insert estimate views"
  ON estimate_views FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can view estimate views"
  ON estimate_views FOR SELECT
  USING (true);
