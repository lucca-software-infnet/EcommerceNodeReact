import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "/api";

export const api = axios.create({
  baseURL,
  withCredentials: true, // necessário para cookie httpOnly do refreshToken
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original?._retry) {
      original._retry = true;
      try {
        const refresh = await api.post("/auth/refresh");
        const newAccess = refresh.data?.accessToken;
        if (newAccess) {
          localStorage.setItem("accessToken", newAccess);
          original.headers.Authorization = `Bearer ${newAccess}`;
          return api.request(original);
        }
      } catch {
        localStorage.removeItem("accessToken");
      }
    }
    throw error;
  }
);

