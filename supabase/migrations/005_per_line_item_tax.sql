-- Migration: Per-Line-Item Tax Support
-- Adds tax_rate column to line items and taxable/exempt breakdown columns to parent tables

-- Add tax_rate to line item tables
ALTER TABLE invoice_line_items ADD COLUMN tax_rate DECIMAL(5,2) NOT NULL DEFAULT 13;
ALTER TABLE estimate_line_items ADD COLUMN tax_rate DECIMAL(5,2) NOT NULL DEFAULT 13;

-- Add tax_amount computed columns
ALTER TABLE invoice_line_items ADD COLUMN tax_amount DECIMAL(12,2)
  GENERATED ALWAYS AS (amount * (tax_rate / 100)) STORED;
ALTER TABLE estimate_line_items ADD COLUMN tax_amount DECIMAL(12,2)
  GENERATED ALWAYS AS (amount * (tax_rate / 100)) STORED;

-- Add breakdown columns to parent tables
ALTER TABLE invoices ADD COLUMN taxable_subtotal DECIMAL(12,2) NOT NULL DEFAULT 0;
ALTER TABLE invoices ADD COLUMN exempt_subtotal DECIMAL(12,2) NOT NULL DEFAULT 0;
ALTER TABLE estimates ADD COLUMN taxable_subtotal DECIMAL(12,2) NOT NULL DEFAULT 0;
ALTER TABLE estimates ADD COLUMN exempt_subtotal DECIMAL(12,2) NOT NULL DEFAULT 0;

-- Backfill existing line items with default tax rate
UPDATE invoice_line_items SET tax_rate = 13 WHERE tax_rate IS NULL;
UPDATE estimate_line_items SET tax_rate = 13 WHERE tax_rate IS NULL;

-- Recalculate totals for existing invoices
UPDATE invoices i
SET taxable_subtotal = i.subtotal, exempt_subtotal = 0
WHERE taxable_subtotal = 0;

-- Recalculate totals for existing estimates
UPDATE estimates e
SET taxable_subtotal = e.subtotal, exempt_subtotal = 0
WHERE taxable_subtotal = 0;
