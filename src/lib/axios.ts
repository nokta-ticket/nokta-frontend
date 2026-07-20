import axios from "axios";
import Cookies from "js-cookie";
import { getApiBaseUrl } from "./surfaces";

// Fase 5: a API é resolvida em runtime a partir do host (app.nokta.live vs
// noktatickets.com.br) — o mesmo build Vercel atende as duas superfícies,
// então uma NEXT_PUBLIC_API_URL fixa não bastaria mais. Ver lib/surfaces.ts.
const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    // Bypasses ngrok's browser interstitial page in non-browser environments
    "ngrok-skip-browser-warning": "true",
  },
  // Fase 5: sessão é cookie HttpOnly enviado automaticamente pelo
  // navegador — nunca mais Authorization: Bearer lido de um cookie
  // acessível por JS.
  withCredentials: true,
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

// Fase 5: baseURL é fixado na criação do client (acima) a partir do host no
// momento em que o módulo carrega no navegador — isso já é suficiente
// porque uma navegação entre app.nokta.live e noktatickets.com.br sempre
// recarrega a página (são origens diferentes), então o host nunca muda
// durante o tempo de vida deste módulo.

// Response interceptor - handles 401 errors (token expired/ausente)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const userCookie = Cookies.get("user");
      // O cookie de sessão é HttpOnly — só o backend consegue limpá-lo
      // (ver AuthContext.signOut, que chama POST /auth/logout). Aqui só
      // limpamos o metadado local pra UI não continuar achando que está
      // autenticada.
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
