/**
 * API Service - Calls Edge Functions for backend operations
 */

import { supabase } from "./client";

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// User Types
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

// Auth Types
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

// Wallet Types
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
}

// Trading Types
export interface TradingPair {
  id: number;
  symbol: string;
  external_symbol: string | null;
  provider: "ASTER" | "HYPERLIQUID";
  type: "SPOT" | "PERPETUAL";
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
  side: "BUY" | "SELL";
  type: "MARKET" | "LIMIT";
  price: number | null;
  quantity: number;
  leverage: number;
  is_isolated: boolean;
  status: "PENDING" | "OPEN" | "FILLED" | "CANCELED" | "FAILED";
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
  side: "LONG" | "SHORT";
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
  pairId: number;
  side: "BUY" | "SELL";
  type: "MARKET" | "LIMIT";
  price?: number;
  quantity: number;
  leverage?: number;
  isIsolated?: boolean;
}

// Airdrop Token Types
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

// Mission Types
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

export interface LeaderboardEntry {
  rank: number;
  userId: number;
  name: string;
  score: number;
  level: number;
}

// Helper to get token from localStorage
const getToken = (): string | undefined => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("appToken") || undefined;
  }
  return undefined;
};

// API call helper
async function callApi<T>(
  path: string,
  options: {
    method?: "GET" | "POST" | "PUT" | "DELETE";
    body?: any;
    token?: string;
  } = {}
): Promise<T> {
  const { method = "GET", body, token = getToken() } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const { data, error } = await supabase.functions.invoke("api", {
    method: "POST",
    body: {
      _path: path,
      _method: method,
      ...body,
    },
    headers,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data as T;
}

// Use fetch directly for proper HTTP method support
async function fetchApi<T>(
  path: string,
  options: {
    method?: "GET" | "POST" | "PUT" | "DELETE";
    body?: any;
    token?: string;
  } = {}
): Promise<T> {
  const { method = "GET", body, token = getToken() } = options;
  
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  
  const url = `${supabaseUrl}/functions/v1/api${path}`;
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "apikey": supabaseKey,
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
  
  if (!data.success) {
    throw new Error(data.error || "API request failed");
  }

  return data as T;
}

// ============= Auth API =============
export const authApi = {
  login: (data: AuthRequest) =>
    fetchApi<AuthResponse>("/user/auth", { method: "POST", body: data }),

  getProfile: (token?: string) =>
    fetchApi<UserProfileResponse>("/user/profile", { token }),

  updateProfile: (data: { fullName: string }, token?: string) =>
    fetchApi<any>("/user/update", { method: "POST", body: data, token }),

  linkWallet: (
    data: { chain: string; address: string; signature: string },
    token?: string
  ) => fetchApi<any>("/user/link", { method: "POST", body: data, token }),

  activate: (token?: string) =>
    fetchApi<any>("/user/active", { method: "POST", token }),

  upgrade: (token?: string) =>
    fetchApi<any>("/user/upgrade", { method: "POST", token }),

  boost: (token?: string) =>
    fetchApi<any>("/user/boost", { method: "POST", token }),

  getFriends: (token?: string) =>
    fetchApi<any>("/user/friends", { token }),

  getLeaderboards: (token?: string) =>
    fetchApi<{ leaders: { daily: LeaderboardEntry[]; weekly: LeaderboardEntry[]; monthly: LeaderboardEntry[] } }>("/user/leaderboards", { token }),
};

// ============= Wallet API =============
export const walletApi = {
  getAssets: () => fetchApi<Asset[]>("/wallet/assets"),

  getBalance: (token?: string) =>
    fetchApi<Wallet[]>("/wallet/balance", { token }),

  getTransactions: (token?: string) =>
    fetchApi<any[]>("/wallet/transactions", { token }),

  deposit: (
    data: { assetId: number; networkId: number; txId: string; amount: number; fromAddress: string },
    token?: string
  ) => fetchApi<any>("/wallet/deposit", { method: "POST", body: data, token }),

  withdraw: (
    data: { assetId: number; networkId: number; amount: number; address: string },
    token?: string
  ) => fetchApi<any>("/wallet/withdraw", { method: "POST", body: data, token }),
};

// ============= Trading API =============
export const tradingApi = {
  getPairs: () => fetchApi<TradingPair[]>("/trade/pairs"),

  submitOrder: (data: SubmitOrderRequest, token?: string) =>
    fetchApi<Order>("/trade/order", { method: "POST", body: data, token }),

  cancelOrder: (orderId: number, token?: string) =>
    fetchApi<any>(`/trade/order/${orderId}/cancel`, { method: "POST", token }),

  closePosition: (positionId: number, token?: string) =>
    fetchApi<any>(`/trade/position/${positionId}/close`, { method: "POST", token }),

  getOpenOrders: (pairId?: number, token?: string) =>
    fetchApi<Order[]>(`/trade/orders${pairId ? `?pairId=${pairId}` : ""}`, { token }),

  getPositions: (pairId?: number, token?: string) =>
    fetchApi<Position[]>(`/trade/positions${pairId ? `?pairId=${pairId}` : ""}`, { token }),

  getHistory: (pairId?: number, token?: string) =>
    fetchApi<Order[]>(`/trade/history${pairId ? `?pairId=${pairId}` : ""}`, { token }),
};

// ============= Token API =============
export const tokenApi = {
  getAll: () => fetchApi<{ tokens: AirdropToken[]; count: number }>("/tokens"),

  getBySlug: (slug: string) =>
    fetchApi<AirdropToken>(`/tokens/${slug}`),

  claim: (tokenId: number, token?: string) =>
    fetchApi<any>("/tokens/claim", { method: "POST", body: { tokenId }, token }),
};

// ============= Mission API =============
export const missionApi = {
  getAll: (token?: string) =>
    fetchApi<{ missions: Mission[] }>("/missions", { token }),

  getUserMissions: (token?: string) =>
    fetchApi<any>("/missions/user", { token }),

  complete: (missionId: number, token?: string) =>
    fetchApi<any>("/missions/complete", { method: "POST", body: { missionId }, token }),
};
