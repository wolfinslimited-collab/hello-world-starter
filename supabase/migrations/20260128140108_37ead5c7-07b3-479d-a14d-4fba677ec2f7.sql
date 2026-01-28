-- Fix security issues: Restrict leaderboard_entries and links to service_role only

-- 1. Fix leaderboard_entries table
DROP POLICY IF EXISTS "Service role only leaderboard_entries" ON public.leaderboard_entries;
DROP POLICY IF EXISTS "Leaderboard entries are publicly readable" ON public.leaderboard_entries;

-- Create a policy that denies all access except service_role
CREATE POLICY "Deny public access to leaderboard_entries"
ON public.leaderboard_entries
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);

CREATE POLICY "Service role full access leaderboard_entries"
ON public.leaderboard_entries
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 2. Fix links table
DROP POLICY IF EXISTS "Service role only links" ON public.links;
DROP POLICY IF EXISTS "Links are publicly readable" ON public.links;

-- Create a policy that denies all access except service_role
CREATE POLICY "Deny public access to links"
ON public.links
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);

CREATE POLICY "Service role full access links"
ON public.links
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);