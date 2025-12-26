import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../api/client.js";
import { clearAccessToken, getAccessToken, setAccessToken } from "../auth/tokenStorage.js";
import { subscribeAuthEvents } from "../auth/authEvents.js";

const AuthContext = createContext(null);

async function fetchMe() {
  const res = await api.get("/users/me");
  return res.data;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  const isAuthenticated = !!user;

  const loadSession = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    const me = await fetchMe();
    setUser(me);
  }, []);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        await loadSession();
      } catch {
        // se der erro (inclui refresh falho), garante estado limpo
        clearAccessToken();
        if (mounted) setUser(null);
      } finally {
        if (mounted) setIsBootstrapping(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [loadSession]);

  // Permite que o Axios force logout quando o refresh falhar.
  useEffect(() => {
    return subscribeAuthEvents((event) => {
      if (event?.type === "logout") {
        clearAccessToken();
        setUser(null);
      }
    });
  }, []);

  const login = useCallback(async ({ email, senha }) => {
    const res = await api.post("/auth/login", { email, senha });
    const token = res.data?.accessToken;
    if (token) setAccessToken(token);
    const me = await fetchMe();
    setUser(me);
    return me;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // ignore
    } finally {
      clearAccessToken();
      setUser(null);
    }
  }, []);

  const register = useCallback(async ({ nome, email, senha }) => {
    const res = await api.post("/auth/register", { nome, email, senha });
    return res.data;
  }, []);

  const activate = useCallback(async (token) => {
    const res = await api.get("/auth/activate", { params: { token } });
    return res.data;
  }, []);

  const forgotPassword = useCallback(async (email) => {
    const res = await api.post("/auth/forgot-password", { email });
    return res.data;
  }, []);

  const resetPassword = useCallback(async ({ token, senha }) => {
    const res = await api.post("/auth/password/reset", { token, senha });
    return res.data;
  }, []);

  const refreshUser = useCallback(async () => {
    const me = await fetchMe();
    setUser(me);
    return me;
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated,
      isBootstrapping,
      login,
      logout,
      register,
      activate,
      forgotPassword,
      resetPassword,
      refreshUser,
    }),
    [
      user,
      isAuthenticated,
      isBootstrapping,
      login,
      logout,
      register,
      activate,
      forgotPassword,
      resetPassword,
      refreshUser,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider />");
  return ctx;
}

