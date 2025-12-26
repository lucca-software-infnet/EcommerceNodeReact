import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "/api";

// ---- Access token handling (memory-first, with localStorage fallback) ----
let accessTokenMemory = null;
const ACCESS_TOKEN_KEY = "accessToken";

export function getAccessToken() {
  return accessTokenMemory || localStorage.getItem(ACCESS_TOKEN_KEY) || null;
}

export function setAccessToken(token) {
  accessTokenMemory = token || null;
  if (token) localStorage.setItem(ACCESS_TOKEN_KEY, token);
  else localStorage.removeItem(ACCESS_TOKEN_KEY);
}

export function clearAccessToken() {
  setAccessToken(null);
}

// Allows AuthContext to react to refresh failures (e.g. local logout + redirect)
let onAuthFailure = null;
export function setOnAuthFailure(handler) {
  onAuthFailure = typeof handler === "function" ? handler : null;
}

// Main API client (uses refresh cookie via withCredentials)
export const api = axios.create({
  baseURL,
  withCredentials: true, // necessário para cookie httpOnly do refreshToken
});

// Dedicated client for refresh/logout calls (no refresh-retry recursion)
const authApi = axios.create({
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

async function refreshAccessToken() {
  // Ensure only one refresh runs at a time.
  if (!refreshPromise) {
    refreshPromise = authApi
      .post("/auth/refresh")
      .then((res) => {
        const newAccess = res?.data?.accessToken;
        if (!newAccess) throw new Error("Refresh sem accessToken");
        setAccessToken(newAccess);
        return newAccess;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return await refreshPromise;
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error?.config;
    const status = error?.response?.status;

    // If we don't have a request to retry, just bubble up.
    if (!original) throw error;

    // Never try to refresh if the failing call is itself refresh/logout.
    const url = String(original.url || "");
    const isAuthCall =
      url.includes("/auth/refresh") ||
      url.includes("/auth/login") ||
      url.includes("/auth/logout");

    if (status === 401 && !original._retry && !isAuthCall) {
      original._retry = true;
      try {
        const newAccess = await refreshAccessToken();
        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${newAccess}`;
        return await api.request(original);
      } catch (refreshErr) {
        // Refresh failed: clear local token and notify app (AuthContext).
        clearAccessToken();
        try {
          await onAuthFailure?.(refreshErr);
        } catch {
          // ignore callback errors
        }
      }
    }

    throw error;
  }
);

