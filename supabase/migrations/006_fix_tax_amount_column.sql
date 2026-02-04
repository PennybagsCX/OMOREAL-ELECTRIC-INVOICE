-- Fix tax_amount computed columns on line items tables
-- This fixes the 22P02 error by properly handling the computation

-- Drop existing problematic computed columns
ALTER TABLE invoice_line_items DROP COLUMN IF EXISTS tax_amount;
ALTER TABLE estimate_line_items DROP COLUMN IF EXISTS tax_amount;

-- Ensure all numeric values are valid before recreating computed columns
UPDATE invoice_line_items SET amount = COALESCE(amount, 0) WHERE amount IS NULL OR amount::text = '';
UPDATE estimate_line_items SET amount = COALESCE(amount, 0) WHERE amount IS NULL OR amount::text = '';

UPDATE invoice_line_items SET tax_rate = COALESCE(tax_rate, 13) WHERE tax_rate IS NULL;
UPDATE estimate_line_items SET tax_rate = COALESCE(tax_rate, 13) WHERE tax_rate IS NULL;

-- Recreate computed columns with explicit casting to avoid 22P02 error
ALTER TABLE invoice_line_items ADD COLUMN tax_amount DECIMAL(12,2)
  GENERATED ALWAYS AS (ROUND((amount::DECIMAL(12,2) * tax_rate::DECIMAL(5,2) / 100.0), 2)) STORED;

ALTER TABLE estimate_line_items ADD COLUMN tax_amount DECIMAL(12,2)
  GENERATED ALWAYS AS (ROUND((amount::DECIMAL(12,2) * tax_rate::DECIMAL(5,2) / 100.0), 2)) STORED;
