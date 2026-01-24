/**
 * API Service - Re-export from Supabase integration
 * This provides backward compatibility with existing code
 */

export {
  authApi,
  walletApi,
  tradingApi,
  tokenApi,
  missionApi,
  type User,
  type UserToken,
  type UserProfileResponse,
  type AuthRequest,
  type AuthResponse,
  type Wallet,
  type Asset,
  type AssetNetwork,
  type Network,
  type WalletTransaction,
  type TradingPair,
  type Order,
  type Position,
  type SubmitOrderRequest,
  type AirdropToken,
  type Mission,
  type UserMission,
  type LeaderboardEntry,
  type Leaderboards,
  type Referral,
  type ClaimResult,
  type ClaimAllResult,
  type ApiResponse,
  type Link,
} from '../integrations/supabase/api';
