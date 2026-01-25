/**
 * API Service - Re-export from Supabase integration
 * This provides backward compatibility with existing code
 */

// Re-export API services
export {
  authApi,
  walletApi,
  tradingApi,
  tokenApi,
  missionApi,
} from '../integrations/supabase/api';

// Re-export types
export type {
  User,
  UserToken,
  UserProfileResponse,
  AuthRequest,
  AuthResponse,
  Wallet,
  Asset,
  AssetNetwork,
  Network,
  WalletTransaction,
  TradingPair,
  Order,
  Position,
  SubmitOrderRequest,
  AirdropToken,
  Mission,
  UserMission,
  LeaderboardEntry,
  Leaderboards,
  Referral,
  ClaimResult,
  ClaimAllResult,
  ApiResponse,
  Link,
} from '../integrations/supabase/api';
