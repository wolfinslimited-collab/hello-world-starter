-- Fix RLS policies to deny public access to sensitive user data
-- These tables should only be accessible via Edge Functions (service role)

-- 1. auth_tokens - Drop permissive policy and create service-role-only policy
DROP POLICY IF EXISTS "Service role full access auth_tokens" ON public.auth_tokens;
CREATE POLICY "Service role only auth_tokens" ON public.auth_tokens
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 2. links - Drop permissive policy and create service-role-only policy  
DROP POLICY IF EXISTS "Service role full access links" ON public.links;
CREATE POLICY "Service role only links" ON public.links
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 3. wallets - Drop permissive policy and create service-role-only policy
DROP POLICY IF EXISTS "Service role full access wallets" ON public.wallets;
CREATE POLICY "Service role only wallets" ON public.wallets
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 4. orders - Drop permissive policy and create service-role-only policy
DROP POLICY IF EXISTS "Service role full access orders" ON public.orders;
CREATE POLICY "Service role only orders" ON public.orders
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 5. transactions - Drop permissive policy and create service-role-only policy
DROP POLICY IF EXISTS "Service role full access transactions" ON public.transactions;
CREATE POLICY "Service role only transactions" ON public.transactions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 6. wallet_transactions - Drop permissive policy and create service-role-only policy
DROP POLICY IF EXISTS "Service role full access wallet_transactions" ON public.wallet_transactions;
CREATE POLICY "Service role only wallet_transactions" ON public.wallet_transactions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 7. positions - Drop permissive policy and create service-role-only policy
DROP POLICY IF EXISTS "Service role full access positions" ON public.positions;
CREATE POLICY "Service role only positions" ON public.positions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 8. user_tokens - Drop permissive policy and create service-role-only policy
DROP POLICY IF EXISTS "Service role full access user_tokens" ON public.user_tokens;
CREATE POLICY "Service role only user_tokens" ON public.user_tokens
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 9. users - Also secure this table
DROP POLICY IF EXISTS "Service role full access users" ON public.users;
CREATE POLICY "Service role only users" ON public.users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 10. referrals - Also secure this table
DROP POLICY IF EXISTS "Service role full access referrals" ON public.referrals;
CREATE POLICY "Service role only referrals" ON public.referrals
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 11. user_missions - Also secure this table  
DROP POLICY IF EXISTS "Service role full access user_missions" ON public.user_missions;
CREATE POLICY "Service role only user_missions" ON public.user_missions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);