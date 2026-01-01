/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client.js";
import { clearSession, getAccessToken, setAccessToken, subscribeAuthEvents } from "../auth/session.js";

function getApiErrorMessage(err, fallback) {
  return err?.response?.data?.erro || fallback || "Ocorreu um erro";
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [lastError, setLastError] = useState("");

  const isAuthenticated = !!user;

  const loadSession = useCallback(async () => {
    setLastError("");
    try {
      // Requisito: só chama /users/me se existir access token
      if (!getAccessToken()) {
        setUser(null);
        return;
      }
      const res = await api.get("/users/me");
      setUser(res.data || null);
    } catch {
      // Se falhar (token inválido/expirado e refresh falhou), zera a sessão.
      clearSession();
      setUser(null);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await loadSession();
      } finally {
        if (mounted) setIsInitializing(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [loadSession]);

  // Logout automático disparado pelo Axios (refresh falhou)
  useEffect(() => {
    return subscribeAuthEvents((event) => {
      if (event?.type !== "logout") return;
      clearSession();
      setUser(null);
      setIsInitializing(false);
      navigate("/login", { replace: true });
    });
  }, [navigate]);

  const login = useCallback(async ({ email, senha }) => {
    setIsBusy(true);
    setLastError("");
    try {
      const res = await api.post("/auth/login", { email, senha });
      const token = res.data?.accessToken;
      const usuario = res.data?.usuario || null;

      if (token) setAccessToken(token);
      setUser(usuario);
      return { usuario };
    } catch (err) {
      const msg = getApiErrorMessage(err, "Falha no login");
      setLastError(msg);
      throw err;
    } finally {
      setIsBusy(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsBusy(true);
    setLastError("");
    try {
      // backend exige authMiddleware aqui, então o access token deve ir no header.
      await api.post("/auth/logout");
    } catch {
      // mesmo se falhar, sempre limpamos localmente
    } finally {
      clearSession();
      setUser(null);
      setIsBusy(false);
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  const register = useCallback(async ({ nome, sobrenome, email, senha }) => {
    setIsBusy(true);
    setLastError("");
    try {
      const res = await api.post("/auth/register", { nome, sobrenome, email, senha });
      return res.data;
    } catch (err) {
      const msg = getApiErrorMessage(err, "Falha no cadastro");
      setLastError(msg);
      throw err;
    } finally {
      setIsBusy(false);
    }
  }, []);

  const activate = useCallback(async (token) => {
    setIsBusy(true);
    setLastError("");
    try {
      const res = await api.get("/auth/activate", { params: { token } });
      return res.data;
    } catch (err) {
      const msg = getApiErrorMessage(err, "Falha ao ativar conta");
      setLastError(msg);
      throw err;
    } finally {
      setIsBusy(false);
    }
  }, []);

  const forgotPassword = useCallback(async (email) => {
    setIsBusy(true);
    setLastError("");
    try {
      // IMPORTANTE: endpoint real do backend
      const res = await api.post("/auth/password/forgot", { email });
      return res.data;
    } catch (err) {
      const msg = getApiErrorMessage(err, "Falha ao enviar email");
      setLastError(msg);
      throw err;
    } finally {
      setIsBusy(false);
    }
  }, []);

  const resetPassword = useCallback(async ({ token, senha }) => {
    setIsBusy(true);
    setLastError("");
    try {
      const res = await api.post("/auth/password/reset", { token, senha });
      return res.data;
    } catch (err) {
      const msg = getApiErrorMessage(err, "Falha ao redefinir senha");
      setLastError(msg);
      throw err;
    } finally {
      setIsBusy(false);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated,
      isInitializing,
      isBusy,
      lastError,
      // actions
      loadSession,
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
      lastError,
      loadSession,
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

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider />");
  return ctx;
}

