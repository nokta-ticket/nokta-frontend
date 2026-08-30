"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import Cookies from "js-cookie";
import api from "@/lib/axios";
import { toast } from "@/lib/toast";
import { ReauthModal } from "@/components/session/reauth-modal";

// Aviso de expiração de sessão aparece 5min antes do fim absoluto.
const SESSION_WARNING_LEAD_MS = 5 * 60 * 1000;

/**
 * Fase 5: só metadado não-sensível (papel, nível, id) — o token de sessão
 * em si nunca passa pelo JavaScript. O backend grava um cookie HttpOnly
 * (`nokta_session`) durante o login/OAuth/2FA e o navegador o envia
 * automaticamente (`withCredentials`, ver lib/axios.ts); este cookie
 * `user` só existe pra o middleware decidir rotas no Edge sem round-trip e
 * pra UI decidir o que mostrar antes do primeiro `/auth/me` responder.
 */
const COOKIE_OPTIONS: Cookies.CookieAttributes = {
  expires: 7,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
};

export interface UserPayload {
  role: "COMUM" | "PRODUTOR" | "ADMIN" | "SUPER_ADMIN" | "SUPPORT";
  userId: number;
  nivelProdutor?: number | null;
}

export interface UserData {
  nome: string;
  sobrenome: string;
  email: string;
  cpf?: string | null;
  cnpj?: string | null;
  telefone?: string | null;
  telefoneVerificado?: boolean | null;
  nomeArtistico?: string | null;
  tipoPessoa?: "PF" | "PJ" | null;
  chavePix?: string | null;
  fotoPerfil?: string | null;
  endereco?: {
    cep?: string | null;
    logradouro?: string | null;
    numero?: string | null;
    bairro?: string | null;
    cidade?: string | null;
    uf?: string | null;
    complemento?: string | null;
  } | null;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isAuthResolved: boolean;
  role: UserPayload["role"] | null;
  nivelProdutor: number | null;
  user: UserData | null;
  userId: number | null;
  /** Timestamp absoluto (ISO) de quando a sessão atual expira — vem sempre do backend, nunca calculado no client. */
  sessionExpiresAt: string | null;

  // Fase 5: sem token — o cookie de sessão HttpOnly já foi gravado pelo
  // backend antes de signIn ser chamado (resposta de login/2FA/OAuth).
  signIn: (data: UserPayload) => void;
  signOut: () => void;
  initiateRolePolling: () => void;
  updateNivelProdutor: (nivel: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthResolved, setIsAuthResolved] = useState(false);
  const roleRef = useRef<null | UserPayload["role"]>(null);
  const intervalRef = useRef<null | NodeJS.Timeout>(null);
  const [role, setRole] = useState<UserPayload["role"] | null>(null);
  const [nivelProdutor, setNivelProdutor] = useState<number | null>(null);
  const [user, setUser] = useState<UserData | null>(null);
  const [sessionExpiresAt, setSessionExpiresAt] = useState<string | null>(null);
  // Timers de disparo único (nunca polling) — recalculados só quando
  // sessionExpiresAt muda (login, reauth, F5 via /auth/me).
  const warningTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const expiryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showReauthWarning, setShowReauthWarning] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);

  // Nunca polling: dois setTimeout de disparo único, recalculados só
  // quando sessionExpiresAt muda (login, reauth, /auth/me no F5). O aviso
  // dispara SESSION_WARNING_LEAD_MS antes do fim absoluto vindo do
  // backend; a expiração em si só bloqueia novas ações via o próprio 401
  // do interceptor axios — nunca força logout imediato sozinha.
  const armSessionTimers = (expiresAtIso: string | null) => {
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    if (expiryTimeoutRef.current) clearTimeout(expiryTimeoutRef.current);
    setSessionExpiresAt(expiresAtIso);
    if (!expiresAtIso) return;

    const expiresAtMs = new Date(expiresAtIso).getTime();
    const warningInMs = expiresAtMs - SESSION_WARNING_LEAD_MS - Date.now();
    const expiryInMs = expiresAtMs - Date.now();

    if (warningInMs > 0) {
      warningTimeoutRef.current = setTimeout(() => setShowReauthWarning(true), warningInMs);
    } else if (expiryInMs > 0) {
      // Já estamos dentro da janela de aviso (ex.: F5 a 2min de expirar).
      setShowReauthWarning(true);
    }
    if (expiryInMs > 0) {
      expiryTimeoutRef.current = setTimeout(() => setShowReauthWarning(false), expiryInMs);
    }
  };

  const loadUser = async () => {
    try {
      const res = await api.get(`/auth/me`);
      const data = await res.data;
      setUserId(data.id);
      armSessionTimers(data.sessionExpiresAt ?? null);

      const staffRoles = ["SUPER_ADMIN", "ADMIN", "SUPPORT"];
      if (staffRoles.includes(data.role)) {
        setUser({ nome: data.nome ?? "Administrador", sobrenome: data.sobrenome ?? "", email: data.email ?? "" });
        return;
      }

      if (roleRef.current === "COMUM" && data.role === "PRODUTOR") {
        toast.success("Você foi aprovado como produtor!");
        Cookies.set(
          "user",
          JSON.stringify({ userId: data.id, role: data.role, nivelProdutor: data.nivelProdutor }),
          COOKIE_OPTIONS
        );
        if (intervalRef.current) clearInterval(intervalRef.current);
      }

      roleRef.current = data.role;
      setRole(data.role);
      setNivelProdutor(data.nivelProdutor ?? null);
      setUser({
        nome: data.nome,
        sobrenome: data.sobrenome ?? "",
        email: data.email,
        cpf: data.cpf ?? null,
        cnpj: data.cnpj ?? null,
        telefone: data.telefone ?? null,
        telefoneVerificado: data.telefoneVerificado ?? null,
        nomeArtistico: data.nomeArtistico ?? null,
        tipoPessoa: data.tipoPessoa ?? null,
        chavePix: data.chavePix ?? null,
        fotoPerfil: data.fotoPerfil ?? null,
        endereco: data.endereco ?? null,
      });
    } catch (err: any) {
      // Only sign out on 401 (token truly invalid/expired).
      // 429 (rate limit), network errors, 5xx etc. should NOT log the user out.
      const status = err?.response?.status;
      if (status === 401) {
        // Redireciona aqui mesmo, sem esperar outra query (ex.: /me/organizations,
        // com retry:1 do React Query) bater 401 primeiro e acionar o interceptor do
        // axios — loadUser() é a chamada mais rápida/dedicada pra detectar sessão
        // inválida, então é quem deve decidir o redirect assim que souber.
        const staffRoles = ["SUPER_ADMIN", "ADMIN", "SUPPORT"];
        const loginPath = staffRoles.includes(roleRef.current ?? "") ? "/admin/login" : "/login";
        signOut();
        if (typeof window !== "undefined" && !window.location.pathname.includes("/login")) {
          window.location.href = loginPath;
        }
      }
      // All other errors: silently ignore — user stays logged in.
    }
  };

  const signIn = (payload: UserPayload) => {
    // Fase 5: o cookie de sessão (HttpOnly) já foi gravado pelo backend na
    // própria resposta de login/2FA/OAuth — aqui só persiste o metadado não
    // sensível que o middleware e a UI usam.
    Cookies.set(
      "user",
      JSON.stringify({
        userId: payload.userId,
        role: payload.role,
        nivelProdutor: payload.nivelProdutor ?? null,
      }),
      COOKIE_OPTIONS
    );

    setRole(payload.role);
    setNivelProdutor(payload.nivelProdutor ?? null);
    setIsAuthenticated(true);
    setIsAuthResolved(true);
    setUserId(payload.userId);
    loadUser();
  };

  const signOut = () => {
    // Clear polling interval so it stops even without component unmount
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    if (expiryTimeoutRef.current) clearTimeout(expiryTimeoutRef.current);
    setShowReauthWarning(false);
    setSessionExpiresAt(null);
    // Cookie HttpOnly não é removível por JS — pede pro backend limpar.
    // Fire-and-forget: mesmo se a chamada falhar, o estado local (e o
    // cookie "user") já são limpos abaixo, então a UI sempre reflete
    // "deslogado" imediatamente.
    api.post("/auth/logout").catch(() => {});
    Cookies.remove("user");
    setIsAuthenticated(false);
    setRole(null);
    setNivelProdutor(null);
    setUser(null);
    setUserId(null);
  };

  const handleReauthSuccess = (newSessionExpiresAt: string | null) => {
    setShowReauthWarning(false);
    armSessionTimers(newSessionExpiresAt);
  };

  const updateNivelProdutor = (nivel: number) => {
    setNivelProdutor(nivel);
    const existing = Cookies.get("user");
    if (existing) {
      try {
        const parsed = JSON.parse(existing);
        Cookies.set(
          "user",
          JSON.stringify({ ...parsed, nivelProdutor: nivel }),
          COOKIE_OPTIONS
        );
      } catch {}
    }
  };

  function initiateRolePolling() {
    try {
      const stored = JSON.parse(Cookies.get("user") ?? "{}");
      setRole(stored.role);
      setNivelProdutor(stored.nivelProdutor ?? null);
      roleRef.current = stored.role;
      setIsAuthenticated(true);
      setUserId(stored.userId);
      loadUser();
      if (stored.role === "COMUM") {
        intervalRef.current = setInterval(() => {
          loadUser();
        }, 9000);
      }
    } catch (e) {
    } finally {
      setIsAuthResolved(true);
    }
  }

  useEffect(() => {
    // Fase 5: o cookie de sessão é HttpOnly (ilegível por JS) — "user" é o
    // sinal local de "provavelmente autenticado"; loadUser() confirma via
    // /auth/me e desloga sozinho num 401 se o cookie real não existir mais.
    const hasLocalSession = Boolean(Cookies.get("user"));
    if (!hasLocalSession) {
      setIsAuthResolved(true);
      return;
    }

    if (!intervalRef.current) initiateRolePolling();

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
      if (expiryTimeoutRef.current) clearTimeout(expiryTimeoutRef.current);
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isAuthResolved,
        role,
        nivelProdutor,
        user,
        userId,
        sessionExpiresAt,
        signIn,
        signOut,
        initiateRolePolling,
        updateNivelProdutor,
      }}
    >
      {children}
      {isAuthenticated && user?.email ? (
        <ReauthModal open={showReauthWarning} email={user.email} onSuccess={handleReauthSuccess} />
      ) : null}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};
