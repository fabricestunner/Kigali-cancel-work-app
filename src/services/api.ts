import axios from "axios";

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

export default api;