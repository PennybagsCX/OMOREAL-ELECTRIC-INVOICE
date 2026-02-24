-- Allow Creating Estimates/Invoices Without Selecting Existing Clients
-- This migration makes client_id nullable to support inline client creation

-- Make client_id nullable in estimates table
ALTER TABLE estimates ALTER COLUMN client_id DROP NOT NULL;

-- Make client_id nullable in invoices table
ALTER TABLE invoices ALTER COLUMN client_id DROP NOT NULL;
