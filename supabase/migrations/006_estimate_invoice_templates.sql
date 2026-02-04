-- Enable pg_trgm extension for full-text search (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create estimate/invoice templates table
CREATE TABLE estimate_invoice_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_type VARCHAR(20) NOT NULL CHECK (template_type IN ('estimate', 'invoice')),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  notes TEXT,
  internal_notes TEXT,

  -- For invoices: due date offset (days from issue date)
  due_date_days INTEGER DEFAULT 30,

  -- For estimates: valid until offset (days from creation)
  valid_until_days INTEGER DEFAULT 30,

  -- Calculated fields (cached for quick display)
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  taxable_subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  exempt_subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  total DECIMAL(12,2) NOT NULL DEFAULT 0,

  -- Line items count (for quick display)
  line_items_count INTEGER NOT NULL DEFAULT 0,

  -- Usage tracking
  use_count INTEGER NOT NULL DEFAULT 0,
  last_used_at TIMESTAMPTZ,

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT TRUE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create template line items table
CREATE TABLE estimate_invoice_template_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES estimate_invoice_templates(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit VARCHAR(100),
  rate DECIMAL(12,2) NOT NULL DEFAULT 0,
  amount DECIMAL(12,2) NOT NULL,
  tax_rate DECIMAL(5,2) NOT NULL DEFAULT 13,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_templates_team_id ON estimate_invoice_templates(team_id);
CREATE INDEX idx_templates_type ON estimate_invoice_templates(template_type);
CREATE INDEX idx_templates_active ON estimate_invoice_templates(is_active);
CREATE INDEX idx_templates_name_trgm ON estimate_invoice_templates USING gin(name gin_trgm_ops);
CREATE INDEX idx_templates_last_used ON estimate_invoice_templates(last_used_at DESC);
CREATE INDEX idx_template_items_template_id ON estimate_invoice_template_line_items(template_id);
CREATE INDEX idx_template_items_sort_order ON estimate_invoice_template_line_items(template_id, sort_order);

-- Enable RLS
ALTER TABLE estimate_invoice_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimate_invoice_template_line_items ENABLE ROW LEVEL SECURITY;

-- Templates: Team members can view, admins can manage
CREATE POLICY "Team members can view templates"
  ON estimate_invoice_templates FOR SELECT USING (true);

CREATE POLICY "Admins can manage templates"
  ON estimate_invoice_templates FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Template line items: Access controlled via parent template
CREATE POLICY "Team members can view template line items"
  ON estimate_invoice_template_line_items FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM estimate_invoice_templates t
      WHERE t.id = estimate_invoice_template_line_items.template_id
    )
  );

CREATE POLICY "Admins can manage template line items"
  ON estimate_invoice_template_line_items FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Trigger for updated_at
CREATE TRIGGER update_templates_updated_at
  BEFORE UPDATE ON estimate_invoice_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Comment for documentation
COMMENT ON TABLE estimate_invoice_templates IS 'Stores complete estimate and invoice templates with line items';
COMMENT ON TABLE estimate_invoice_template_line_items IS 'Stores line items for estimate/invoice templates';
COMMENT ON COLUMN estimate_invoice_templates.template_type IS 'Type of template: estimate or invoice';
COMMENT ON COLUMN estimate_invoice_templates.due_date_days IS 'For invoice templates: days from issue date to due date';
COMMENT ON COLUMN estimate_invoice_templates.valid_until_days IS 'For estimate templates: days from creation to valid until date';
COMMENT ON COLUMN estimate_invoice_templates.use_count IS 'Number of times this template has been used';
