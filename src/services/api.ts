import axios from "axios";

const api = axios.create({
  baseURL: "https://kcw.enjoyrwanda.rw/api",
  // baseURL: "http://localhost:5000/api", 
  // localhost is for testing local and kcw.enjoyrwanda.rw is for production envirnoment
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