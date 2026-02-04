-- Electrician Estimate & Invoice App - Late Fees Migration
-- Run this in Supabase SQL Editor

-- Add index for finding overdue invoices (due soon)
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);

-- Add index for finding invoices by status and due date combined
-- This optimizes queries for reminders dashboard
CREATE INDEX IF NOT EXISTS idx_invoices_status_due_date ON invoices(status, due_date);

-- Note: late_fee_rate and late_fee_amount columns already exist in the initial schema
-- The defaults are set to 0, so no data migration is needed
