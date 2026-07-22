import axios from "axios";
import { clearSession } from "../utils/auth";

// Set VITE_API_BASE_URL in .env.local for local work, or in the Vercel project
// settings for a deploy. Unset falls back to production, which is what every
// existing deploy already points at.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "https://kcw.enjoyrwanda.rw/api",
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  },
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url: string = error?.config?.url ?? "";

    // A wrong password also returns 401. Redirecting away from /login would
    // make a bad credential look like a page that silently does nothing, so
    // the login request handles its own errors.
    const isLoginRequest = url.includes("/auth/login");

    if (status === 401 && !isLoginRequest) {
      clearSession();
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

export default api;