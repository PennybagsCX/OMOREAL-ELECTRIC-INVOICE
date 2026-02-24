-- Fix overly permissive RLS policies for clients table
-- This ensures users can only see and modify their own team's clients

-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Team members can view clients" ON clients;

-- Create proper SELECT policy that filters by team_id
CREATE POLICY "Team members can view clients"
  ON clients FOR SELECT
  USING (team_id = auth.uid());

-- Drop the overly permissive INSERT policy
DROP POLICY IF EXISTS "Admins can insert clients" ON clients;

-- Create proper INSERT policy that ensures team_id matches user
CREATE POLICY "Users can insert clients"
  ON clients FOR INSERT
  WITH CHECK (team_id = auth.uid());

-- Update UPDATE policy to only allow updating own team's clients
DROP POLICY IF EXISTS "Admins can update clients" ON clients;

CREATE POLICY "Users can update clients"
  ON clients FOR UPDATE
  USING (team_id = auth.uid())
  WITH CHECK (team_id = auth.uid());

-- Update DELETE policy to only allow deleting own team's clients
DROP POLICY IF EXISTS "Admins can delete clients" ON clients;

CREATE POLICY "Users can delete clients"
  ON clients FOR DELETE
  USING (team_id = auth.uid());
