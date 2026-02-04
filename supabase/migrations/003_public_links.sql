-- Add public_token column to estimates
ALTER TABLE estimates ADD COLUMN IF NOT EXISTS public_token TEXT UNIQUE;

-- Add accepted_at column to estimates
ALTER TABLE estimates ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_estimates_public_token ON estimates(public_token);

-- Create estimate_views table
CREATE TABLE IF NOT EXISTS estimate_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_id UUID NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for estimate_views
CREATE INDEX IF NOT EXISTS idx_estimate_views_estimate_id ON estimate_views(estimate_id);
