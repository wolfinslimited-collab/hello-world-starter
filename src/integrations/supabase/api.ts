/**
 * API Service - Calls Edge Functions for backend operations
 * Migrated from Fastify/Prisma backend to Supabase Edge Functions
 */

// ==================== RESPONSE TYPES ====================
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// ==================== USER TYPES ====================
export interface User {
  id: number;
  full_name: string | null;
  friends: number;
  remain_friends: number;
  level: number;
  boost: number;
  status: "Pending" | "Active" | "Inactive";
  created_at: string;
  updated_at: string;
  links?: Link[];
}

export interface Link {
  id: number;
  user_id: number;
  address: string;
  chain: string;
  signature: string | null;
  created_at: string;
}

export interface UserToken {
  id: number;
  user_id: number;
  token_id: number;
  balance: number;
  last_action_at: string;
  created_at: string;
  updated_at: string;
  token?: AirdropToken;
}

export interface UserProfileResponse {
  user: User;
  tokens: UserToken[];
}

// ==================== AUTH TYPES ====================
export interface AuthRequest {
  chain: string;
  address: string;
  signature: string;
  refId?: number;
}

export interface AuthResponse {
  token: string;
  userId: number;
  isNewUser: boolean;
}

// ==================== WALLET TYPES ====================
export interface Wallet {
  id: number;
  user_id: number;
  asset_id: number;
  balance: number;
  locked: number;
  updated_at: string;
  asset?: Asset;
}

export interface Asset {
  id: number;
  name: string;
  symbol: string;
  price: number;
  logo: string | null;
  active: boolean;
  visible: boolean;
  networks?: AssetNetwork[];
}

export interface AssetNetwork {
  id: number;
  asset_id: number;
  network_id: number;
  contract_address: string | null;
  decimals: number;
  min_deposit: number;
  min_withdraw: number;
  withdraw_fee: number;
  can_deposit: boolean;
  can_withdraw: boolean;
  is_active: boolean;
  network?: Network;
}

export interface Network {
  id: number;
  name: string;
  chain: string;
  logo: string | null;
  main_address: string | null;
  explorer_url: string | null;
  is_active: boolean;
  created_at: string;
}

export interface WalletTransaction {
  id: number;
  user_id: number;
  asset_id: number;
  network_id: number | null;
  tx_id: string | null;
  amount: number;
  from_address: string | null;
  to_address: string | null;
  type: string;
  status: string;
  memo: string | null;
  created_at: string;
  updated_at: string;
  asset?: Asset;
  network?: Network;
}

// ==================== TRADING TYPES ====================
export interface TradingPair {
  id: number;
  symbol: string;
  external_symbol: string | null;
  provider: string;
  type: string;
  base: string;
  quote: string;
  base_asset_id: number | null;
  quote_asset_id: number | null;
  tick_size: number;
  step_size: number;
  min_qty: number;
  max_qty: number;
  min_price: number;
  price_precision: number;
  quantity_precision: number;
  status: number;
  active: boolean;
}

export interface Order {
  id: number;
  user_id: number;
  pair_id: number;
  external_id: string | null;
  side: string;
  type: string;
  price: number | null;
  quantity: number;
  leverage: number;
  is_isolated: boolean;
  status: string;
  filled_qty: number;
  avg_fill_price: number;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  pair?: TradingPair;
}

export interface Position {
  id: number;
  user_id: number;
  pair_id: number;
  side: string;
  entry_price: number;
  amount: number;
  leverage: number;
  margin: number;
  liquidation_price: number | null;
  unrealized_pnl: number;
  is_open: boolean;
  created_at: string;
  updated_at: string;
  pair?: TradingPair;
}

export interface SubmitOrderRequest {
  pair: number;
  side: "BUY" | "SELL";
  type: "MARKET" | "LIMIT";
  price?: number;
  quantity: number;
  leverage?: number;
  isIsolated?: boolean;
}

// ==================== AIRDROP TOKEN TYPES ====================
export interface AirdropToken {
  id: number;
  name: string;
  symbol: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  cover_url: string | null;
  website_url: string | null;
  whitepaper_url: string | null;
  category: string | null;
  tags: string[];
  network: string | null;
  chain_id: number | null;
  contract_address: string | null;
  decimals: number;
  twitter_url: string | null;
  discord_url: string | null;
  telegram_url: string | null;
  total_supply: number;
  total_claimed: number;
  initial_airdrop: number;
  daily_reward: number;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  is_featured: boolean;
  price: number;
}

export interface ClaimResult {
  claimed: number;
  balance: number;
  isInitial?: boolean;
}

export interface ClaimAllResult {
  claimedCount: number;
  claimedTokens: {
    logo: string | null;
    name: string;
    symbol: string;
    amount: number;
    newBalance?: number;
  }[];
}

// ==================== MISSION TYPES ====================
export interface Mission {
  id: number;
  title: string;
  description: string | null;
  provider: string;
  reward_amount: number;
  action_url: string | null;
  logo: string | null;
  tags: string[];
  meta: any;
  order_id: number;
  is_active: boolean;
  force: boolean;
  created_at: string;
}

export interface UserMission {
  id: number;
  user_id: number;
  mission_id: number;
  completed_at: string;
  mission?: Mission;
}

// ==================== LEADERBOARD TYPES ====================
export interface LeaderboardEntry {
  rank: number;
  userId: number;
  name: string;
  score: number;
  level: number;
}

export interface Leaderboards {
  daily: LeaderboardEntry[];
  weekly: LeaderboardEntry[];
  monthly: LeaderboardEntry[];
}

// ==================== REFERRAL TYPES ====================
export interface Referral {
  id: number;
  referrer_id: number;
  referee_id: number;
  status: boolean;
  created_at: string;
  referee?: User;
}

// ==================== API HELPERS ====================
const getToken = (): string | undefined => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("appToken") || undefined;
  }
  return undefined;
};

const setToken = (token: string): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem("appToken", token);
  }
};

const clearToken = (): void => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("appToken");
  }
};

// Direct fetch to Edge Function
async function fetchApi<T>(
  path: string,
  options: {
    method?: "GET" | "POST" | "PUT" | "DELETE";
    body?: any;
    token?: string;
  } = {}
): Promise<T> {
  const { method = "GET", body, token: providedToken } = options;
  const token = providedToken || getToken();

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  const url = `${supabaseUrl}/functions/v1/api${path}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    apikey: supabaseKey,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || data.message || "API request failed");
  }

  return data;
}

// ==================== AUTH API ====================
export const authApi = {
  login: async (data: AuthRequest): Promise<AuthResponse> => {
    const response = await fetchApi<{ success: boolean } & AuthResponse>("/user/auth", {
      method: "POST",
      body: data,
    });
    if (response.token) {
      setToken(response.token);
    }
    return response;
  },

  linkWallet: async (data: AuthRequest, token?: string): Promise<{ user: User }> => {
    return fetchApi("/user/link", { method: "POST", body: data, token });
  },

  getProfile: async (token?: string): Promise<UserProfileResponse> => {
    return fetchApi("/user/profile", { token });
  },

  updateProfile: async (data: { fullName: string }, token?: string): Promise<{ user: User }> => {
    return fetchApi("/user/update", { method: "POST", body: data, token });
  },

  activate: async (data: { walletId: number; amount: number }, token?: string): Promise<{ user: User } & ClaimAllResult> => {
    return fetchApi("/user/activate", { method: "POST", body: data, token });
  },

  upgrade: async (data: { walletId: number; amount: number }, token?: string): Promise<{ user: User }> => {
    return fetchApi("/user/upgrade", { method: "POST", body: data, token });
  },

  boost: async (data: { walletId: number; amount: number }, token?: string): Promise<{ user: User; tokens: UserToken[] }> => {
    return fetchApi("/user/boost", { method: "POST", body: data, token });
  },

  getFriends: async (page = 1, limit = 10, token?: string): Promise<{ users: Referral[] }> => {
    return fetchApi(`/user/friends?page=${page}&limit=${limit}`, { token });
  },

  getLeaderboards: async (token?: string): Promise<{ leaders: Leaderboards }> => {
    return fetchApi("/user/leaderboards", { token });
  },

  logout: (): void => {
    clearToken();
  },

  isLoggedIn: (): boolean => {
    return !!getToken();
  },

  getToken,
  setToken,
  clearToken,
};

// ==================== WALLET API ====================
export const walletApi = {
  getAssets: async (): Promise<Asset[]> => {
    const response = await fetchApi<any>("/wallet/assets");
    return response as Asset[];
  },

  getBalance: async (token?: string): Promise<Wallet[]> => {
    const response = await fetchApi<any>("/wallet/balance", { token });
    return response as Wallet[];
  },

  getTransactions: async (token?: string): Promise<WalletTransaction[]> => {
    const response = await fetchApi<any>("/wallet/transactions", { token });
    return response as WalletTransaction[];
  },

  deposit: async (
    data: {
      txId: string;
      amount: number;
      assetId: number;
      networkId: number;
      fromAddress: string;
    },
    token?: string
  ): Promise<{ transaction: WalletTransaction }> => {
    return fetchApi("/wallet/deposit", { method: "POST", body: data, token });
  },

  withdraw: async (
    data: {
      amount: number;
      assetId: number;
      networkId: number;
      toAddress: string;
    },
    token?: string
  ): Promise<{ transaction: WalletTransaction; fee: number; finalAmount: number }> => {
    return fetchApi("/wallet/withdraw", { method: "POST", body: data, token });
  },

  // New deposit flow endpoints
  getDepositAddress: async (
    assetId: number,
    networkId: number,
    token?: string
  ): Promise<{
    address: string;
    network: string;
    chain: string;
    asset: string;
    minDeposit: number;
    contractAddress: string | null;
  }> => {
    return fetchApi(`/wallet/deposit-address?assetId=${assetId}&networkId=${networkId}`, { token });
  },

  verifyDeposit: async (
    data: {
      txSignature: string;
      networkId?: number;
      assetId?: number;
    },
    token?: string
  ): Promise<{ status: string; amount?: number; assetSymbol?: string; transaction?: WalletTransaction }> => {
    return fetchApi("/wallet/verify-deposit", { method: "POST", body: data, token });
  },

  // AsterDEX deposit address (for trading deposits)
  getAsterDexDepositAddress: async (
    coin: string,
    chainId: number,
    network: "EVM" | "SOLANA" = "EVM"
  ): Promise<{
    coin: string;
    displayName: string;
    address: string;
    contractAddress: string | null;
    tokenVault: string | null;
    tokenMint: string | null;
    network: string;
    chainId: number;
    decimals: number;
    depositType: string;
    isNative: boolean;
    instructions: string;
  }> => {
    return fetchApi(`/asterdex/deposit-address?coin=${coin}&chainId=${chainId}&network=${network}`);
  },
};

// ==================== TRADING API ====================
export const tradingApi = {
  getPairs: async (): Promise<TradingPair[]> => {
    const response = await fetchApi<any>("/trade/pairs");
    return response as TradingPair[];
  },

  submitOrder: async (data: SubmitOrderRequest, token?: string): Promise<{ orderId: number; order: Order }> => {
    return fetchApi("/trade/submit", { method: "POST", body: data, token });
  },

  cancelOrder: async (orderId: number, token?: string): Promise<{ canceled: boolean }> => {
    return fetchApi("/trade/cancel", { method: "POST", body: { orderId }, token });
  },

  closePosition: async (positionId: number, token?: string): Promise<{ closed: boolean }> => {
    return fetchApi("/trade/close", { method: "POST", body: { positionId }, token });
  },

  getOpenOrders: async (pairId?: number, token?: string): Promise<Order[]> => {
    const query = pairId ? `?pairId=${pairId}` : "";
    const response = await fetchApi<any>(`/trade/orders${query}`, { token });
    return response as Order[];
  },

  getPositions: async (pairId?: number, token?: string): Promise<Position[]> => {
    const query = pairId ? `?pairId=${pairId}` : "";
    const response = await fetchApi<any>(`/trade/positions${query}`, { token });
    return response as Position[];
  },

  getHistory: async (pairId?: number, token?: string): Promise<Order[]> => {
    const query = pairId ? `?pairId=${pairId}` : "";
    const response = await fetchApi<any>(`/trade/history${query}`, { token });
    return response as Order[];
  },
};

// ==================== TOKEN API ====================
export const tokenApi = {
  getAll: async (): Promise<{ tokens: AirdropToken[]; count: number }> => {
    return fetchApi("/tokens");
  },

  getBySlug: async (slug: string): Promise<AirdropToken> => {
    const response = await fetchApi<any>(`/tokens/${slug}`);
    return response as AirdropToken;
  },

  claimInitial: async (token?: string): Promise<ClaimAllResult> => {
    return fetchApi("/tokens/claimInit", { method: "POST", token });
  },

  claim: async (tokenId: number, token?: string): Promise<ClaimResult> => {
    return fetchApi("/tokens/claim", { method: "POST", body: { tokenId }, token });
  },

  claimAll: async (token?: string): Promise<ClaimAllResult> => {
    return fetchApi("/tokens/claimAll", { method: "POST", token });
  },
};

// ==================== MISSION API ====================
export const missionApi = {
  getAll: async (token?: string): Promise<{ missions: Mission[] }> => {
    return fetchApi("/missions", { token });
  },

  getUserMissions: async (token?: string): Promise<{ userMissions: UserMission[] }> => {
    return fetchApi("/missions/user", { token });
  },

  complete: async (missionId: number, token?: string): Promise<{ tokens: UserToken[]; userMissions: UserMission[] }> => {
    return fetchApi("/missions/complete", { method: "POST", body: { missionId }, token });
  },
};
