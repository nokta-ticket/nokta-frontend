import axios from "axios";
import Cookies from "js-cookie";

// API URL can be configured via environment variable
// Supports both Laravel and NestJS backends
const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333/api";

const api = axios.create({
  baseURL: apiUrl,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    // Bypasses ngrok's browser interstitial page in non-browser environments
    "ngrok-skip-browser-warning": "true",
  },
  withCredentials: false,
});

export function getErrorMessage(error: unknown, fallback = "Ocorreu um erro."): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;

    if (typeof data?.message === "string") {
      return data.message;
    }

    if (Array.isArray(data?.message) && data.message.length > 0) {
      return String(data.message[0]);
    }

    if (typeof error.message === "string" && error.message.trim()) {
      return error.message;
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}

// Request interceptor - adds auth token to all requests
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handles 401 errors (token expired)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const userCookie = Cookies.get("user");
      Cookies.remove("token");
      Cookies.remove("user");

      if (typeof window !== "undefined" && !window.location.pathname.includes("/login")) {
        let loginPath = "/login";
        try {
          const parsed = userCookie ? JSON.parse(userCookie) : {};
          const staffRoles = ["SUPER_ADMIN", "ADMIN", "SUPPORT"];
          if (staffRoles.includes(parsed.role)) loginPath = "/admin/login";
        } catch {}
        window.location.href = loginPath;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
