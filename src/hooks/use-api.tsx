/**
 * API Hooks - React Query hooks for data fetching
 * Provides caching, automatic refetching, and loading states
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  authApi, 
  walletApi, 
  tradingApi, 
  tokenApi, 
  missionApi,
  type SubmitOrderRequest 
} from '../integrations/supabase/api';

// Helper to get token from context/storage
const getToken = (): string | undefined => {
  // This should be replaced with actual token retrieval from your auth context
  return localStorage.getItem('appToken') || undefined;
};

// ============= Auth Hooks =============
export const useProfile = () => {
  const token = getToken();
  return useQuery({
    queryKey: ['profile'],
    queryFn: () => authApi.getProfile(token!),
    enabled: !!token,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useFriends = () => {
  const token = getToken();
  return useQuery({
    queryKey: ['friends'],
    queryFn: () => authApi.getFriends(token!),
    enabled: !!token,
  });
};

export const useLeaderboards = () => {
  const token = getToken();
  return useQuery({
    queryKey: ['leaderboards'],
    queryFn: () => authApi.getLeaderboards(token!),
    enabled: !!token,
  });
};

// ============= Wallet Hooks =============
export const useWalletBalance = () => {
  const token = getToken();
  return useQuery({
    queryKey: ['wallet', 'balance'],
    queryFn: () => walletApi.getBalance(token!),
    enabled: !!token,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
};

export const useWalletTransactions = () => {
  const token = getToken();
  return useQuery({
    queryKey: ['wallet', 'transactions'],
    queryFn: () => walletApi.getTransactions(token!),
    enabled: !!token,
  });
};

// ============= Trading Hooks =============
export const useTradingPairs = () => {
  return useQuery({
    queryKey: ['trading', 'pairs'],
    queryFn: () => tradingApi.getPairs(),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};

export const useOpenOrders = (pairId?: number) => {
  const token = getToken();
  return useQuery({
    queryKey: ['trading', 'orders', pairId],
    queryFn: () => tradingApi.getOpenOrders(pairId, token),
    enabled: !!token,
    refetchInterval: 5000, // Refresh every 5 seconds
  });
};

export const usePositions = (pairId?: number) => {
  const token = getToken();
  return useQuery({
    queryKey: ['trading', 'positions', pairId],
    queryFn: () => tradingApi.getPositions(pairId, token),
    enabled: !!token,
    refetchInterval: 5000,
  });
};

export const useTradeHistory = (pairId?: number) => {
  const token = getToken();
  return useQuery({
    queryKey: ['trading', 'history', pairId],
    queryFn: () => tradingApi.getHistory(pairId, token),
    enabled: !!token,
  });
};

export const useSubmitOrder = () => {
  const queryClient = useQueryClient();
  const token = getToken();
  
  return useMutation({
    mutationFn: (data: SubmitOrderRequest) => tradingApi.submitOrder(data, token!),
    onSuccess: () => {
      // Invalidate related queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: ['trading', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['trading', 'positions'] });
      queryClient.invalidateQueries({ queryKey: ['wallet', 'balance'] });
    },
  });
};

export const useCancelOrder = () => {
  const queryClient = useQueryClient();
  const token = getToken();
  
  return useMutation({
    mutationFn: (orderId: number) => tradingApi.cancelOrder(orderId, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trading', 'orders'] });
    },
  });
};

export const useClosePosition = () => {
  const queryClient = useQueryClient();
  const token = getToken();
  
  return useMutation({
    mutationFn: (positionId: number) => tradingApi.closePosition(positionId, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trading', 'positions'] });
      queryClient.invalidateQueries({ queryKey: ['wallet', 'balance'] });
    },
  });
};

// ============= Token Hooks =============
export const useTokens = () => {
  return useQuery({
    queryKey: ['tokens'],
    queryFn: () => tokenApi.getAll(),
    staleTime: 1000 * 60 * 5,
  });
};

export const useToken = (slug: string) => {
  return useQuery({
    queryKey: ['tokens', slug],
    queryFn: () => tokenApi.getBySlug(slug),
    enabled: !!slug,
  });
};

export const useClaimToken = () => {
  const queryClient = useQueryClient();
  const token = getToken();
  
  return useMutation({
    mutationFn: (tokenId: number) => tokenApi.claim(tokenId, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tokens'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};

// ============= Mission Hooks =============
export const useMissions = () => {
  const token = getToken();
  return useQuery({
    queryKey: ['missions'],
    queryFn: () => missionApi.getAll(token!),
    enabled: !!token,
  });
};

export const useCompleteMission = () => {
  const queryClient = useQueryClient();
  const token = getToken();
  
  return useMutation({
    mutationFn: (missionId: number) => missionApi.complete(missionId, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['missions'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};

// Re-export types for convenience
export type { 
  User, 
  UserToken, 
  Wallet, 
  Asset, 
  TradingPair, 
  Order, 
  Position, 
  AirdropToken, 
  Mission, 
  LeaderboardEntry,
  ApiResponse,
  SubmitOrderRequest,
} from '../integrations/supabase/api';
