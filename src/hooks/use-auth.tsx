/**
 * Authentication Hook
 * Manages user authentication state and wallet-based login
 */
import { useState, useCallback, useEffect } from "react";
import useStorage from "context";
import { authApi, getToken, clearToken, isAuthenticated as checkIsAuthenticated } from "services/api-client";

interface AuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

export function useAuth() {
  const { setting, setSetting, setApp } = useStorage();
  const [state, setState] = useState<AuthState>({
    isLoading: false,
    isAuthenticated: setting?.isLoged || checkIsAuthenticated(),
    error: null,
  });

  // Sync auth state with localStorage on mount
  useEffect(() => {
    const token = getToken();
    if (token && !setting?.isLoged) {
      // Token exists but state not synced - restore session
      loadProfile();
    } else if (!token && setting?.isLoged) {
      // State says logged but no token - clear state
      setSetting(null);
    }
  }, []);

  // Load user profile
  const loadProfile = useCallback(async () => {
    setState((s) => ({ ...s, isLoading: true, error: null }));

    try {
      const result = await authApi.getProfile();

      if (result.success && result.data) {
        const { user, tokens } = result.data;
        const currentToken = getToken();
        if (currentToken) {
          setSetting({ login: { token: currentToken } });
        }
        setApp({ user, tokens });
        setState({ isLoading: false, isAuthenticated: true, error: null });
        return true;
      } else {
        // Profile load failed - clear auth
        clearToken();
        setSetting(null);
        setState({ isLoading: false, isAuthenticated: false, error: result.error || null });
        return false;
      }
    } catch (err: any) {
      console.error("Profile load error:", err);
      setState({ isLoading: false, isAuthenticated: false, error: err.message });
      return false;
    }
  }, [setSetting, setApp]);

  // Login with wallet signature
  const login = useCallback(
    async (params: {
      chain: string;
      address: string;
      signature: string;
      refId?: number;
    }) => {
      setState((s) => ({ ...s, isLoading: true, error: null }));

      try {
        const result = await authApi.login({
          chain: params.chain.toUpperCase(),
          address: params.address,
          signature: params.signature,
          refId: params.refId,
        });

        if (result.success && result.data) {
          const { token, userId, isNewUser } = result.data;

          // Token is already stored by authApi.login
          setSetting({ login: { token, userId, isNewUser } });

          // Load full profile
          await loadProfile();

          setState({ isLoading: false, isAuthenticated: true, error: null });
          return { success: true, isNewUser };
        } else {
          setState({
            isLoading: false,
            isAuthenticated: false,
            error: result.error || "Authentication failed",
          });
          return { success: false, error: result.error };
        }
      } catch (err: any) {
        console.error("Login error:", err);
        setState({
          isLoading: false,
          isAuthenticated: false,
          error: err.message || "Authentication failed",
        });
        return { success: false, error: err.message };
      }
    },
    [setSetting, loadProfile]
  );

  // Logout
  const logout = useCallback(() => {
    authApi.logout();
    setSetting(null);
    setApp({ user: null, tokens: [] });
    setState({ isLoading: false, isAuthenticated: false, error: null });
  }, [setSetting, setApp]);

  // Listen for logout events
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.logout) {
        logout();
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [logout]);

  return {
    isLoading: state.isLoading,
    isAuthenticated: state.isAuthenticated,
    error: state.error,
    login,
    logout,
    loadProfile,
  };
}

export default useAuth;
