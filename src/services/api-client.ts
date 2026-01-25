/**
 * Centralized API Client for Supabase Edge Functions
 * Handles all HTTP requests with proper auth token management
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Token management
const TOKEN_KEY = "app_auth_token";

export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const clearToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

export const isAuthenticated = (): boolean => {
  return !!getToken();
};

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Base fetch wrapper
async function fetchApi<T>(
  path: string,
  options: {
    method?: "GET" | "POST" | "PUT" | "DELETE";
    body?: any;
    requiresAuth?: boolean;
    // Optional token override for legacy callers that manage token outside localStorage
    token?: string;
  } = {}
): Promise<ApiResponse<T>> {
  const { method = "GET", body, requiresAuth = false, token: tokenOverride } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    apikey: SUPABASE_ANON_KEY,
  };

  const token = tokenOverride || getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  } else if (requiresAuth) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/api${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle 401 - clear token and notify
      if (response.status === 401) {
        clearToken();
        window.postMessage({ logout: true }, "*");
      }
      return { success: false, error: data.error || "Request failed" };
    }

    return { success: true, data };
  } catch (err: any) {
    console.error("API Error:", err);
    return { success: false, error: err.message || "Network error" };
  }
}

// ==================== AUTH API ====================
export interface AuthRequest {
  chain: string;
  address: string;
  signature: string;
  refId?: number;
}

export interface AuthResult {
  token: string;
  userId: number;
  isNewUser: boolean;
}

export const authApi = {
  login: async (data: AuthRequest): Promise<ApiResponse<AuthResult>> => {
    const result = await fetchApi<AuthResult>("/user/auth", {
      method: "POST",
      body: data,
    });

    // Store token on successful login
    if (result.success && result.data?.token) {
      setToken(result.data.token);
    }

    return result;
  },

  logout: (): void => {
    clearToken();
  },

  getProfile: async (): Promise<ApiResponse<any>> => {
    return fetchApi("/user/profile", { requiresAuth: true });
  },

  updateProfile: async (data: { fullName?: string }): Promise<ApiResponse<any>> => {
    return fetchApi("/user/update", {
      method: "POST",
      body: data,
      requiresAuth: true,
    });
  },

  linkWallet: async (data: AuthRequest): Promise<ApiResponse<any>> => {
    return fetchApi("/user/link", {
      method: "POST",
      body: data,
      requiresAuth: true,
    });
  },

  activate: async (walletId: number): Promise<ApiResponse<any>> => {
    return fetchApi("/user/active", {
      method: "POST",
      body: { walletId },
      requiresAuth: true,
    });
  },

  upgrade: async (walletId: number): Promise<ApiResponse<any>> => {
    return fetchApi("/user/upgrade", {
      method: "POST",
      body: { walletId },
      requiresAuth: true,
    });
  },

  boost: async (walletId: number): Promise<ApiResponse<any>> => {
    return fetchApi("/user/boost", {
      method: "POST",
      body: { walletId },
      requiresAuth: true,
    });
  },

  getFriends: async (page = 1, limit = 10): Promise<ApiResponse<any>> => {
    return fetchApi(`/user/friends?page=${page}&limit=${limit}`, {
      requiresAuth: true,
    });
  },

  getLeaderboards: async (): Promise<ApiResponse<any>> => {
    return fetchApi("/user/leaders");
  },
};

// ==================== WALLET API ====================
export const walletApi = {
  getAssets: async (): Promise<ApiResponse<any>> => {
    return fetchApi("/wallet/assets");
  },

  getBalance: async (): Promise<ApiResponse<any>> => {
    return fetchApi("/wallet/balance", { requiresAuth: true });
  },

  deposit: async (data: {
    txId: string;
    amount: number;
    assetId: number;
    networkId: number;
    fromAddress: string;
  }): Promise<ApiResponse<any>> => {
    return fetchApi("/wallet/deposit", {
      method: "POST",
      body: data,
      requiresAuth: true,
    });
  },

  withdraw: async (data: {
    assetId: number;
    networkId: number;
    amount: number;
    toAddress: string;
  }): Promise<ApiResponse<any>> => {
    return fetchApi("/wallet/withdraw", {
      method: "POST",
      body: data,
      requiresAuth: true,
    });
  },
};

// ==================== TRADING API ====================
export const tradingApi = {
  getPairs: async (): Promise<ApiResponse<any>> => {
    return fetchApi("/trade/pairs");
  },

  submitOrder: async (data: {
    pairId: number;
    side: "BUY" | "SELL";
    type: "MARKET" | "LIMIT";
    quantity: number;
    price?: number;
    leverage?: number;
  }): Promise<ApiResponse<any>> => {
    return fetchApi("/trade/order", {
      method: "POST",
      body: data,
      requiresAuth: true,
    });
  },

  cancelOrder: async (orderId: number): Promise<ApiResponse<any>> => {
    return fetchApi("/trade/order/cancel", {
      method: "POST",
      body: { orderId },
      requiresAuth: true,
    });
  },

  closePosition: async (positionId: number): Promise<ApiResponse<any>> => {
    return fetchApi("/trade/position/close", {
      method: "POST",
      body: { positionId },
      requiresAuth: true,
    });
  },

  getOrders: async (pairId?: number): Promise<ApiResponse<any>> => {
    const query = pairId ? `?pairId=${pairId}` : "";
    return fetchApi(`/trade/orders${query}`, { requiresAuth: true });
  },

  getPositions: async (pairId?: number): Promise<ApiResponse<any>> => {
    const query = pairId ? `?pairId=${pairId}` : "";
    return fetchApi(`/trade/positions${query}`, { requiresAuth: true });
  },

  getHistory: async (pairId?: number): Promise<ApiResponse<any>> => {
    const query = pairId ? `?pairId=${pairId}` : "";
    return fetchApi(`/trade/history${query}`, { requiresAuth: true });
  },
};

// ==================== TOKENS API ====================
export const tokensApi = {
  getAll: async (): Promise<ApiResponse<any>> => {
    return fetchApi("/tokens");
  },

  getBySlug: async (slug: string): Promise<ApiResponse<any>> => {
    return fetchApi(`/tokens/${slug}`);
  },

  claimInitial: async (): Promise<ApiResponse<any>> => {
    return fetchApi("/tokens/claim/initial", {
      method: "POST",
      requiresAuth: true,
    });
  },

  claim: async (tokenId: number): Promise<ApiResponse<any>> => {
    return fetchApi("/tokens/claim", {
      method: "POST",
      body: { tokenId },
      requiresAuth: true,
    });
  },

  claimAll: async (): Promise<ApiResponse<any>> => {
    return fetchApi("/tokens/claim/all", {
      method: "POST",
      requiresAuth: true,
    });
  },
};

// ==================== MISSIONS API ====================
export const missionsApi = {
  getAll: async (): Promise<ApiResponse<any>> => {
    return fetchApi("/missions", { requiresAuth: true });
  },

  complete: async (missionId: number): Promise<ApiResponse<any>> => {
    return fetchApi("/missions/complete", {
      method: "POST",
      body: { missionId },
      requiresAuth: true,
    });
  },
};

// ==================== LEGACY COMPATIBILITY ====================
// These functions maintain compatibility with existing code using utils/request.ts

export const get = async <T>(
  path: string,
  opt?: { token?: string }
): Promise<any> => {
  const result = await fetchApi<T>(path.startsWith("/") ? path : `/${path}`, {
    requiresAuth: !!opt?.token,
    token: opt?.token,
  });

  // Legacy compatibility:
  // - many callers expect `res.data`
  // - some callers read fields directly from the response
  if (result.success) {
    const payload: any = result.data ?? {};
    return { success: true, data: payload, ...payload };
  }
  return { success: false, error: result.error };
};

export const json = async <T>(
  path: string,
  body: any,
  opt?: { token?: string }
): Promise<any> => {
  const result = await fetchApi<T>(path.startsWith("/") ? path : `/${path}`, {
    method: "POST",
    body,
    requiresAuth: !!opt?.token,
    token: opt?.token,
  });
  
  // Return in legacy format for compatibility
  if (result.success && result.data) {
    return { success: true, data: result.data, ...result.data };
  }
  return { success: false, error: result.error };
};

export const post = json; // Alias for compatibility
