-- Remove unused tax_amount computed columns from line items tables
-- These computed columns are causing 22P02 errors and aren't used in the application

-- Drop from invoice_line_items
ALTER TABLE invoice_line_items DROP COLUMN IF EXISTS tax_amount;

-- Drop from estimate_line_items
ALTER TABLE estimate_line_items DROP COLUMN IF EXISTS tax_amount;
