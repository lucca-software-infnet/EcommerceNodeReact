import axios from "axios";
import { clearSession, emitAuthEvent, getAccessToken, setAccessToken } from "../auth/session.js";

function normalizeApiBaseURL(raw) {
  const fallback = "/api";
  if (!raw) return fallback;

  const trimmed = String(raw).trim();
  if (!trimmed) return fallback;

  // remove trailing slashes
  const base = trimmed.replace(/\/+$/, "");

  // Se já for relativo e começar com /api, mantém.
  if (base === "/api" || base.startsWith("/api/")) return base;

  // Se já termina com /api (absoluto), mantém.
  if (base.endsWith("/api")) return base;

  // Caso comum: VITE_API_URL="http://localhost:3333" -> queremos "http://localhost:3333/api"
  return `${base}/api`;
}

const baseURL = normalizeApiBaseURL(import.meta.env.VITE_API_URL);

export const api = axios.create({
  baseURL,
  withCredentials: true, // necessário para cookie httpOnly do refreshToken
});

// Cliente "cru" para refresh (sem interceptors) para evitar loops.
const refreshClient = axios.create({
  baseURL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise = null;

function isRefreshRequest(config) {
  const url = config?.url || "";
  // cobre url absoluta ou relativa
  return url.includes("/auth/refresh");
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error?.config;
    const status = error?.response?.status;

    // Se não temos config ou não é 401, só propaga.
    if (!original || status !== 401) throw error;

    // Checkout não pode derrubar sessão (nem disparar refresh/logout automático).
    if (String(original?.url || "").includes("/payments/checkout")) {
      throw error;
    }

    const hadAuthHeader =
      !!original?.headers?.Authorization || !!original?.headers?.authorization;
    const hadAccessToken = !!getAccessToken();

    // Sem access token/header não existe "sessão" para tentar recuperar via refresh.
    // Evita chamadas indevidas em /auth/refresh quando o usuário não está logado.
    if (!hadAuthHeader && !hadAccessToken) throw error;

    // Não tenta refresh em cima do próprio refresh (evita loop).
    if (isRefreshRequest(original)) {
      clearSession();
      if (hadAuthHeader || hadAccessToken) {
        emitAuthEvent({ type: "logout", reason: "refresh_unauthorized" });
      }
      throw error;
    }

    if (original._retry) throw error;
    original._retry = true;

    try {
      // consolida múltiplos 401 simultâneos em 1 refresh.
      refreshPromise =
        refreshPromise ||
        refreshClient
          .post("/auth/refresh")
          .then((r) => r?.data?.accessToken)
          .finally(() => {
            refreshPromise = null;
          });

      const newAccessToken = await refreshPromise;

      if (!newAccessToken) {
        clearSession();
        if (hadAuthHeader || hadAccessToken) {
          emitAuthEvent({ type: "logout", reason: "refresh_failed_no_token" });
        }
        throw error;
      }

      setAccessToken(newAccessToken);

      original.headers = original.headers || {};
      original.headers.Authorization = `Bearer ${newAccessToken}`;

      return api.request(original);
    } catch (err) {
      clearSession();
      if (hadAuthHeader || hadAccessToken) {
        emitAuthEvent({ type: "logout", reason: "refresh_failed" });
      }
      throw err;
    }
  }
);

