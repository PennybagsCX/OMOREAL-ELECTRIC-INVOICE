-- Diagnose and fix data issues in line items tables
-- Run this to see what data is causing the 22P02 error

-- First, check for any problematic data
SELECT 'invoice_line_items with issues:' as check_type;
SELECT id, invoice_id, amount, tax_rate, amount::text as amount_text, tax_rate::text as tax_rate_text
FROM invoice_line_items
WHERE amount IS NULL
   OR tax_rate IS NULL
   OR amount::text = ''
   OR tax_rate::text = ''
   OR amount::text ~ '[^0-9.]'
   OR tax_rate::text ~ '[^0-9.]'
LIMIT 10;

SELECT 'estimate_line_items with issues:' as check_type;
SELECT id, estimate_id, amount, tax_rate, amount::text as amount_text, tax_rate::text as tax_rate_text
FROM estimate_line_items
WHERE amount IS NULL
   OR tax_rate IS NULL
   OR amount::text = ''
   OR tax_rate::text = ''
   OR amount::text ~ '[^0-9.]'
   OR tax_rate::text ~ '[^0-9.]'
LIMIT 10;

-- Fix any issues found
-- First, drop the computed column
ALTER TABLE invoice_line_items DROP COLUMN IF EXISTS tax_amount;
ALTER TABLE estimate_line_items DROP COLUMN IF EXISTS tax_amount;

-- Set safe defaults for any problematic values
UPDATE invoice_line_items
SET amount = 0, tax_rate = 13
WHERE amount IS NULL OR tax_rate IS NULL
   OR amount::text = '' OR tax_rate::text = ''
   OR amount::text ~ '[^0-9.]' OR tax_rate::text ~ '[^0-9.]';

UPDATE estimate_line_items
SET amount = 0, tax_rate = 13
WHERE amount IS NULL OR tax_rate IS NULL
   OR amount::text = '' OR tax_rate::text = ''
   OR amount::text ~ '[^0-9.]' OR tax_rate::text ~ '[^0-9.]';

-- Recreate the computed columns
ALTER TABLE invoice_line_items ADD COLUMN tax_amount DECIMAL(12,2)
  GENERATED ALWAYS AS (ROUND((amount::DECIMAL(12,2) * tax_rate::DECIMAL(5,2) / 100.0), 2)) STORED;

ALTER TABLE estimate_line_items ADD COLUMN tax_amount DECIMAL(12,2)
  GENERATED ALWAYS AS (ROUND((amount::DECIMAL(12,2) * tax_rate::DECIMAL(5,2) / 100.0), 2)) STORED;

-- Verify success
SELECT 'Fix completed. Sample data:' as status;
SELECT id, estimate_id, amount, tax_rate, tax_amount
FROM estimate_line_items
LIMIT 5;
