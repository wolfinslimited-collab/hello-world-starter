/**
 * API Service - Centralized API calls for backend integration
 * Uses the request utility with proper typing
 */

import { get, post } from '../utils/request';

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
  fullName: string | null;
  friends: number;
  remainFriends: number;
  level: number;
  boost: number;
  status: 'Pending' | 'Active' | 'Inactive';
  createdAt: string;
  updatedAt: string;
}

export interface UserToken {
  id: number;
  userId: number;
  tokenId: number;
  balance: number;
  lastActionAt: string;
  createdAt: string;
  updatedAt: string;
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
}

export interface AuthResponse {
  appToken: string;
  userId: number;
  isNewUser: boolean;
}

// Wallet Types
export interface Wallet {
  id: number;
  userId: number;
  assetId: number;
  balance: number;
  locked: number;
  updatedAt: string;
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
  externalSymbol: string;
  provider: 'ASTER' | 'HYPERLIQUID';
  type: 'SPOT' | 'PERPETUAL';
  base: string;
  quote: string;
  baseAssetId: number;
  quoteAssetId: number;
  tickSize: number;
  stepSize: number;
  minQty: number;
  maxQty: number;
  minPrice: number;
  pricePrecision: number;
  quantityPrecision: number;
  status: number;
  active: boolean;
}

export interface Order {
  id: number;
  userId: number;
  pairId: number;
  externalId: string | null;
  side: 'BUY' | 'SELL';
  type: 'MARKET' | 'LIMIT';
  price: number | null;
  quantity: number;
  leverage: number;
  isIsolated: boolean;
  status: 'PENDING' | 'OPEN' | 'FILLED' | 'CANCELED' | 'FAILED';
  filledQty: number;
  avgFillPrice: number;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  pair?: TradingPair;
}

export interface Position {
  id: number;
  userId: number;
  pairId: number;
  side: 'LONG' | 'SHORT';
  entryPrice: number;
  amount: number;
  leverage: number;
  margin: number;
  liquidationPrice: number | null;
  unrealizedPnL: number;
  isOpen: boolean;
  createdAt: string;
  updatedAt: string;
  pair?: TradingPair;
}

export interface SubmitOrderRequest {
  pairId: number;
  side: 'BUY' | 'SELL';
  type: 'MARKET' | 'LIMIT';
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
  description: string;
  logoUrl: string | null;
  coverUrl: string | null;
  websiteUrl: string | null;
  whitepaperUrl: string | null;
  category: string;
  tags: string[];
  network: string | null;
  chainId: number | null;
  contractAddress: string | null;
  decimals: number;
  twitterUrl: string | null;
  discordUrl: string | null;
  telegramUrl: string | null;
  totalSupply: number;
  totalClaimed: number;
  initialAirdrop: number;
  dailyReward: number;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  isFeatured: boolean;
  price: number;
}

// Mission Types
export interface Mission {
  id: number;
  title: string;
  description: string | null;
  provider: string;
  rewardAmount: number;
  actionUrl: string | null;
  logo: string | null;
  tags: string[];
  meta: any;
  orderId: number;
  isActive: boolean;
  force: boolean;
  createdAt: string;
}

export interface LeaderboardEntry {
  id: number;
  userId: number;
  period: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  startDate: string;
  score: number;
  updatedAt: string;
  user?: User;
}

// ============= Auth API =============
export const authApi = {
  login: (data: AuthRequest) => 
    post<ApiResponse<AuthResponse>>('/user/auth', data),
  
  getProfile: (token: string) => 
    get<ApiResponse<UserProfileResponse>>('/user/profile', { token }),
  
  updateProfile: (data: { fullName: string }, token: string) =>
    post<ApiResponse<any>>('/user/update', data, { token }),
  
  linkWallet: (data: { chain: string; address: string; signature: string }, token: string) =>
    post<ApiResponse<any>>('/user/link', data, { token }),
  
  activate: (token: string) =>
    post<ApiResponse<any>>('/user/active', {}, { token }),
  
  upgrade: (token: string) =>
    post<ApiResponse<any>>('/user/upgrade', {}, { token }),
  
  boost: (token: string) =>
    post<ApiResponse<any>>('/user/boost', {}, { token }),
  
  getFriends: (token: string) =>
    get<ApiResponse<any>>('/user/friends', { token }),
  
  getLeaderboards: (token: string) =>
    get<ApiResponse<LeaderboardEntry[]>>('/user/leaderboards', { token }),
};

// ============= Wallet API =============
export const walletApi = {
  getBalance: (token: string) =>
    get<ApiResponse<Wallet[]>>('/wallet/balance', { token }),
  
  getTransactions: (token: string) =>
    get<ApiResponse<any[]>>('/wallet/transactions', { token }),
  
  deposit: (data: { assetId: number; networkId: number }, token: string) =>
    post<ApiResponse<any>>('/wallet/deposit', data, { token }),
  
  withdraw: (data: { assetId: number; networkId: number; amount: number; address: string }, token: string) =>
    post<ApiResponse<any>>('/wallet/withdraw', data, { token }),
};

// ============= Trading API =============
export const tradingApi = {
  getPairs: () =>
    get<ApiResponse<TradingPair[]>>('/trade/pairs'),
  
  submitOrder: (data: SubmitOrderRequest, token: string) =>
    post<ApiResponse<Order>>('/trade/order', data, { token }),
  
  cancelOrder: (orderId: number, token: string) =>
    post<ApiResponse<any>>(`/trade/order/${orderId}/cancel`, {}, { token }),
  
  closePosition: (positionId: number, token: string) =>
    post<ApiResponse<any>>(`/trade/position/${positionId}/close`, {}, { token }),
  
  getOpenOrders: (pairId?: number, token?: string) =>
    get<ApiResponse<Order[]>>(`/trade/orders${pairId ? `?pairId=${pairId}` : ''}`, { token }),
  
  getPositions: (pairId?: number, token?: string) =>
    get<ApiResponse<Position[]>>(`/trade/positions${pairId ? `?pairId=${pairId}` : ''}`, { token }),
  
  getHistory: (pairId?: number, token?: string) =>
    get<ApiResponse<Order[]>>(`/trade/history${pairId ? `?pairId=${pairId}` : ''}`, { token }),
};

// ============= Token API =============
export const tokenApi = {
  getAll: () =>
    get<ApiResponse<AirdropToken[]>>('/tokens'),
  
  getBySlug: (slug: string) =>
    get<ApiResponse<AirdropToken>>(`/tokens/${slug}`),
  
  claim: (tokenId: number, token: string) =>
    post<ApiResponse<any>>(`/tokens/${tokenId}/claim`, {}, { token }),
};

// ============= Mission API =============
export const missionApi = {
  getAll: (token: string) =>
    get<ApiResponse<Mission[]>>('/missions', { token }),
  
  complete: (missionId: number, token: string) =>
    post<ApiResponse<any>>(`/missions/${missionId}/complete`, {}, { token }),
};

// ============= AI Chat API =============
export const chatApi = {
  sendMessage: (data: { message: string }, token: string) =>
    post<ApiResponse<any>>('/ai-chat/message', data, { token }),
  
  getHistory: (token: string) =>
    get<ApiResponse<any[]>>('/ai-chat/history', { token }),
};
