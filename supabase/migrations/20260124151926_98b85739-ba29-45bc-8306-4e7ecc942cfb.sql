-- Users table
CREATE TABLE public.users (
  id SERIAL PRIMARY KEY,
  full_name TEXT,
  friends INTEGER NOT NULL DEFAULT 0,
  remain_friends INTEGER NOT NULL DEFAULT 5,
  level INTEGER NOT NULL DEFAULT 0,
  boost INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Active', 'Inactive')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Links table (wallet addresses)
CREATE TABLE public.links (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  address TEXT NOT NULL,
  chain TEXT NOT NULL,
  signature TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(address, chain)
);

-- Referrals table
CREATE TABLE public.referrals (
  id SERIAL PRIMARY KEY,
  referrer_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  referee_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(referee_id)
);

-- Networks table
CREATE TABLE public.networks (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  chain TEXT NOT NULL,
  logo TEXT,
  main_address TEXT,
  explorer_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Assets table
CREATE TABLE public.assets (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  symbol TEXT NOT NULL UNIQUE,
  price DECIMAL NOT NULL DEFAULT 0,
  logo TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Asset Networks (many-to-many with settings)
CREATE TABLE public.asset_networks (
  id SERIAL PRIMARY KEY,
  asset_id INTEGER NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  network_id INTEGER NOT NULL REFERENCES public.networks(id) ON DELETE CASCADE,
  contract_address TEXT,
  decimals INTEGER NOT NULL DEFAULT 18,
  can_deposit BOOLEAN NOT NULL DEFAULT true,
  can_withdraw BOOLEAN NOT NULL DEFAULT true,
  min_deposit DECIMAL NOT NULL DEFAULT 0,
  min_withdraw DECIMAL NOT NULL DEFAULT 0,
  withdraw_fee DECIMAL NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(asset_id, network_id)
);

-- Wallets (user balances)
CREATE TABLE public.wallets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  asset_id INTEGER NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  balance DECIMAL NOT NULL DEFAULT 0,
  locked DECIMAL NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, asset_id)
);

-- Wallet Transactions
CREATE TABLE public.wallet_transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  asset_id INTEGER NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  network_id INTEGER REFERENCES public.networks(id),
  tx_id TEXT UNIQUE,
  amount DECIMAL NOT NULL,
  from_address TEXT,
  to_address TEXT,
  type TEXT NOT NULL CHECK (type IN ('Deposit', 'Withdraw', 'Transfer', 'Trade')),
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Completed', 'Failed', 'Cancelled')),
  memo TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Transactions (general ledger)
CREATE TABLE public.transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount DECIMAL NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('In', 'Out')),
  tag TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Trading Pairs
CREATE TABLE public.trading_pairs (
  id SERIAL PRIMARY KEY,
  symbol TEXT NOT NULL,
  external_symbol TEXT,
  provider TEXT NOT NULL DEFAULT 'ASTER' CHECK (provider IN ('ASTER', 'HYPERLIQUID')),
  type TEXT NOT NULL DEFAULT 'PERPETUAL' CHECK (type IN ('SPOT', 'PERPETUAL')),
  base TEXT NOT NULL,
  quote TEXT NOT NULL,
  base_asset_id INTEGER REFERENCES public.assets(id),
  quote_asset_id INTEGER REFERENCES public.assets(id),
  tick_size DECIMAL NOT NULL DEFAULT 0.01,
  step_size DECIMAL NOT NULL DEFAULT 0.001,
  min_qty DECIMAL NOT NULL DEFAULT 0.001,
  max_qty DECIMAL NOT NULL DEFAULT 1000000,
  min_price DECIMAL NOT NULL DEFAULT 0,
  price_precision INTEGER NOT NULL DEFAULT 2,
  quantity_precision INTEGER NOT NULL DEFAULT 3,
  status INTEGER NOT NULL DEFAULT 1,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(symbol, type)
);

-- Orders
CREATE TABLE public.orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  pair_id INTEGER NOT NULL REFERENCES public.trading_pairs(id) ON DELETE CASCADE,
  external_id TEXT,
  side TEXT NOT NULL CHECK (side IN ('BUY', 'SELL')),
  type TEXT NOT NULL CHECK (type IN ('MARKET', 'LIMIT')),
  price DECIMAL,
  quantity DECIMAL NOT NULL,
  leverage INTEGER NOT NULL DEFAULT 1,
  is_isolated BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'OPEN', 'FILLED', 'CANCELED', 'FAILED')),
  filled_qty DECIMAL NOT NULL DEFAULT 0,
  avg_fill_price DECIMAL NOT NULL DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Positions
CREATE TABLE public.positions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  pair_id INTEGER NOT NULL REFERENCES public.trading_pairs(id) ON DELETE CASCADE,
  side TEXT NOT NULL CHECK (side IN ('LONG', 'SHORT')),
  entry_price DECIMAL NOT NULL,
  amount DECIMAL NOT NULL,
  leverage INTEGER NOT NULL DEFAULT 1,
  margin DECIMAL NOT NULL DEFAULT 0,
  liquidation_price DECIMAL,
  unrealized_pnl DECIMAL NOT NULL DEFAULT 0,
  is_open BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Airdrop Tokens
CREATE TABLE public.airdrop_tokens (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  logo_url TEXT,
  cover_url TEXT,
  website_url TEXT,
  whitepaper_url TEXT,
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  network TEXT,
  chain_id INTEGER,
  contract_address TEXT,
  decimals INTEGER NOT NULL DEFAULT 18,
  twitter_url TEXT,
  discord_url TEXT,
  telegram_url TEXT,
  total_supply DECIMAL NOT NULL DEFAULT 0,
  total_claimed DECIMAL NOT NULL DEFAULT 0,
  initial_airdrop DECIMAL NOT NULL DEFAULT 0,
  daily_reward DECIMAL NOT NULL DEFAULT 0,
  starts_at TIMESTAMP WITH TIME ZONE,
  ends_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  price DECIMAL NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User Tokens (claimed airdrops)
CREATE TABLE public.user_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token_id INTEGER NOT NULL REFERENCES public.airdrop_tokens(id) ON DELETE CASCADE,
  balance DECIMAL NOT NULL DEFAULT 0,
  last_action_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, token_id)
);

-- Missions
CREATE TABLE public.missions (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  provider TEXT NOT NULL DEFAULT 'SYSTEM',
  reward_amount DECIMAL NOT NULL DEFAULT 0,
  action_url TEXT,
  logo TEXT,
  tags TEXT[] DEFAULT '{}',
  meta JSONB DEFAULT '{}',
  order_id INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  force BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User Missions
CREATE TABLE public.user_missions (
  id SERIAL PRIMARY KEY,
  mission_id INTEGER NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(mission_id, user_id)
);

-- Leaderboard Entries
CREATE TABLE public.leaderboard_entries (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  period TEXT NOT NULL CHECK (period IN ('DAILY', 'WEEKLY', 'MONTHLY')),
  start_date DATE NOT NULL,
  score DECIMAL NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, period, start_date)
);

-- Auth tokens (for session management)
CREATE TABLE public.auth_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.networks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_networks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trading_pairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.airdrop_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_tokens ENABLE ROW LEVEL SECURITY;

-- Public read policies for public data
CREATE POLICY "Networks are publicly readable" ON public.networks FOR SELECT USING (true);
CREATE POLICY "Assets are publicly readable" ON public.assets FOR SELECT USING (true);
CREATE POLICY "Asset networks are publicly readable" ON public.asset_networks FOR SELECT USING (true);
CREATE POLICY "Trading pairs are publicly readable" ON public.trading_pairs FOR SELECT USING (true);
CREATE POLICY "Airdrop tokens are publicly readable" ON public.airdrop_tokens FOR SELECT USING (true);
CREATE POLICY "Missions are publicly readable" ON public.missions FOR SELECT USING (true);
CREATE POLICY "Leaderboard entries are publicly readable" ON public.leaderboard_entries FOR SELECT USING (true);

-- Service role policies for edge functions (full access)
CREATE POLICY "Service role full access users" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access links" ON public.links FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access referrals" ON public.referrals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access wallets" ON public.wallets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access wallet_transactions" ON public.wallet_transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access transactions" ON public.transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access positions" ON public.positions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access user_tokens" ON public.user_tokens FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access user_missions" ON public.user_missions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access auth_tokens" ON public.auth_tokens FOR ALL USING (true) WITH CHECK (true);

-- Updated at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON public.wallets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_wallet_transactions_updated_at BEFORE UPDATE ON public.wallet_transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_positions_updated_at BEFORE UPDATE ON public.positions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_tokens_updated_at BEFORE UPDATE ON public.user_tokens FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_leaderboard_entries_updated_at BEFORE UPDATE ON public.leaderboard_entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();