import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api, clearAccessToken, setOnAuthFailure, setAccessToken } from "../api/client";
import { AuthContext } from "./authContext.js";

function getApiErrorMessage(err, fallback) {
  return (
    err?.response?.data?.erro ||
    err?.response?.data?.message ||
    err?.message ||
    fallback
  );
}

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isBusy, setIsBusy] = useState(false);

  const mountedRef = useRef(true);

  const isAuthenticated = !!user;

  const localLogout = useCallback(() => {
    clearAccessToken();
    setUser(null);
  }, []);

  const fetchMe = useCallback(async () => {
    const res = await api.get("/users/me");
    return res.data;
  }, []);

  const loadSession = useCallback(async () => {
    setIsInitializing(true);
    try {
      const me = await fetchMe();
      if (mountedRef.current) setUser(me);
    } catch {
      // Not authenticated (or refresh failed) -> keep logged out state.
      if (mountedRef.current) setUser(null);
    } finally {
      if (mountedRef.current) setIsInitializing(false);
    }
  }, [fetchMe]);

  const login = useCallback(
    async ({ email, senha }) => {
      setIsBusy(true);
      try {
        const res = await api.post("/auth/login", { email, senha });
        const token = res?.data?.accessToken;
        if (token) setAccessToken(token);
        const me = await fetchMe();
        if (mountedRef.current) setUser(me);
        return res.data;
      } catch (err) {
        throw new Error(getApiErrorMessage(err, "Falha no login"));
      } finally {
        if (mountedRef.current) setIsBusy(false);
      }
    },
    [fetchMe]
  );

  const register = useCallback(async ({ nome, email, senha }) => {
    setIsBusy(true);
    try {
      const res = await api.post("/auth/register", { nome, email, senha });
      return res.data;
    } catch (err) {
      throw new Error(getApiErrorMessage(err, "Falha no cadastro"));
    } finally {
      if (mountedRef.current) setIsBusy(false);
    }
  }, []);

  const activate = useCallback(async ({ token }) => {
    setIsBusy(true);
    try {
      const res = await api.get("/auth/activate", { params: { token } });
      return res.data;
    } catch (err) {
      throw new Error(getApiErrorMessage(err, "Falha ao ativar conta"));
    } finally {
      if (mountedRef.current) setIsBusy(false);
    }
  }, []);

  const forgotPassword = useCallback(async ({ email }) => {
    setIsBusy(true);
    try {
      const res = await api.post("/auth/forgot-password", { email });
      return res.data;
    } catch (err) {
      throw new Error(getApiErrorMessage(err, "Falha ao enviar email"));
    } finally {
      if (mountedRef.current) setIsBusy(false);
    }
  }, []);

  const resetPassword = useCallback(async ({ token, senha }) => {
    setIsBusy(true);
    try {
      const res = await api.post("/auth/password/reset", { token, senha });
      return res.data;
    } catch (err) {
      throw new Error(getApiErrorMessage(err, "Falha ao redefinir senha"));
    } finally {
      if (mountedRef.current) setIsBusy(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsBusy(true);
    try {
      await api.post("/auth/logout");
    } catch {
      // Even if server logout fails, we still clear local session.
    } finally {
      if (mountedRef.current) {
        localLogout();
        setIsBusy(false);
      }
    }
  }, [localLogout]);

  // If refresh fails in api/client.js, force local logout and redirect to login.
  useEffect(() => {
    setOnAuthFailure(() => {
      localLogout();

      const path = location?.pathname || "";
      const isPublic =
        path.startsWith("/login") ||
        path.startsWith("/register") ||
        path.startsWith("/activate") ||
        path.startsWith("/forgot-password") ||
        path.startsWith("/reset-password");

      if (!isPublic) {
        navigate("/login", { replace: true, state: { from: location } });
      }
    });
    return () => setOnAuthFailure(null);
  }, [localLogout, location, navigate]);

  // Bootstrap: load session once on app start.
  useEffect(() => {
    mountedRef.current = true;
    loadSession();
    return () => {
      mountedRef.current = false;
    };
  }, [loadSession]);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated,
      isInitializing,
      isBusy,
      loadSession,
      fetchMe,
      login,
      logout,
      register,
      activate,
      forgotPassword,
      resetPassword,
    }),
    [
      user,
      isAuthenticated,
      isInitializing,
      isBusy,
      loadSession,
      fetchMe,
      login,
      logout,
      register,
      activate,
      forgotPassword,
      resetPassword,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

