import axios from "axios";
import { clearSession, emitAuthEvent, getAccessToken, setAccessToken } from "../auth/session.js";

const baseURL = import.meta.env.VITE_API_URL || "/api";

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

    const hadAuthHeader =
      !!original?.headers?.Authorization || !!original?.headers?.authorization;
    const hadAccessToken = !!getAccessToken();

    // Requisito: não tentar refresh quando não existe sessão/access token.
    if (!hadAuthHeader && !hadAccessToken) {
      throw error;
    }

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

