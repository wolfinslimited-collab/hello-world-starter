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
  type TradingPair,
  type Order,
  type Position,
  type SubmitOrderRequest,
  type AirdropToken,
  type Mission,
  type LeaderboardEntry,
  type ApiResponse,
  type Link,
} from '../integrations/supabase/api';
