import axios from "axios";
import { emitAuthEvent } from "../auth/authEvents.js";
import { clearAccessToken, getAccessToken, setAccessToken } from "../auth/tokenStorage.js";

const baseURL = import.meta.env.VITE_API_URL || "/api";

export const api = axios.create({
  baseURL,
  withCredentials: true, // necessário para cookie httpOnly do refreshToken
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers = config.headers || {};
    if (!config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

function isAuthEndpoint(url) {
  if (!url) return false;
  return (
    url.includes("/auth/login") ||
    url.includes("/auth/register") ||
    url.includes("/auth/refresh") ||
    url.includes("/auth/logout") ||
    url.includes("/auth/forgot-password") ||
    url.includes("/auth/password/reset") ||
    url.includes("/auth/activate")
  );
}

let refreshPromise = null;
async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = api
      .post("/auth/refresh", null, { _skipAuthRefresh: true })
      .then((res) => {
        const newAccess = res.data?.accessToken;
        if (!newAccess) throw new Error("Refresh não retornou accessToken");
        setAccessToken(newAccess);
        return newAccess;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    const originalUrl = original?.url || "";

    if (
      status === 401 &&
      original &&
      !original._retry &&
      !original._skipAuthRefresh &&
      !isAuthEndpoint(originalUrl)
    ) {
      original._retry = true;
      try {
        const newAccess = await refreshAccessToken();
        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${newAccess}`;
        return api.request(original);
      } catch (err) {
        clearAccessToken();
        emitAuthEvent({ type: "logout", reason: "refresh_failed", error: err });
      }
    }
    throw error;
  }
);

