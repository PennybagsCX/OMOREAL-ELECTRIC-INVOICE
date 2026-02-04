-- Migration: Saved Line Items
-- Creates a table for storing reusable line item templates

-- Enable pg_trgm extension for full-text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create saved_line_items table
CREATE TABLE saved_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit VARCHAR(100),
  rate DECIMAL(12,2) NOT NULL DEFAULT 0,
  tax_rate DECIMAL(5,2) NOT NULL DEFAULT 13,
  category VARCHAR(100),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  use_count INTEGER NOT NULL DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_saved_line_items_team_id ON saved_line_items(team_id);
CREATE INDEX idx_saved_line_items_category ON saved_line_items(category);
CREATE INDEX idx_saved_line_items_active ON saved_line_items(is_active);
CREATE INDEX idx_saved_line_items_name_trgm ON saved_line_items USING gin(name gin_trgm_ops);
CREATE INDEX idx_saved_line_items_description_trgm ON saved_line_items USING gin(description gin_trgm_ops);

-- Enable RLS
ALTER TABLE saved_line_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Team members can view saved line items"
  ON saved_line_items FOR SELECT USING (true);

CREATE POLICY "Admins can manage saved line items"
  ON saved_line_items FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Trigger for updated_at
CREATE TRIGGER update_saved_line_items_updated_at
  BEFORE UPDATE ON saved_line_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
