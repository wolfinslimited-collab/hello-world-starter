-- Fix: Restrict leaderboard_entries to service_role only
-- This prevents competitors from identifying active trading users

-- Drop the public readable policy
DROP POLICY IF EXISTS "Leaderboard entries are publicly readable" ON public.leaderboard_entries;

-- Create service_role only policy for all operations
CREATE POLICY "Service role only leaderboard_entries"
ON public.leaderboard_entries
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);