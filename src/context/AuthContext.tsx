"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import Cookies from "js-cookie";
import api from "@/lib/axios";
import { toast } from "@/lib/toast";

const COOKIE_OPTIONS: Cookies.CookieAttributes = {
  expires: 7,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
};

export interface UserPayload {
  role: "COMUM" | "PRODUTOR" | "ADMIN";
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
}

interface AuthContextType {
  isAuthenticated: boolean;
  isAuthResolved: boolean;
  role: UserPayload["role"] | null;
  nivelProdutor: number | null;
  user: UserData | null;
  userId: number | null;

  signIn: (token: string, data: UserPayload) => void;
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
  const [userId, setUserId] = useState<number | null>(null);

  const loadUser = async () => {
    try {
      const res = await api.get(`/auth/me`);
      const data = await res.data;
      setUserId(data.id);

      if (data.role === "ADMIN") {
        setUser({ nome: "Administrador", sobrenome: "", email: "" });
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
      });
    } catch (err: any) {
      // Only sign out on 401 (token truly invalid/expired).
      // 429 (rate limit), network errors, 5xx etc. should NOT log the user out.
      const status = err?.response?.status;
      if (status === 401) {
        signOut();
      }
      // All other errors: silently ignore — user stays logged in.
    }
  };

  const signIn = (token: string, payload: UserPayload) => {
    Cookies.set("token", token, COOKIE_OPTIONS);
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
    Cookies.remove("token");
    Cookies.remove("user");
    setIsAuthenticated(false);
    setRole(null);
    setNivelProdutor(null);
    setUser(null);
    setUserId(null);
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
    const token = Cookies.get("token");
    if (!token) {
      setIsAuthResolved(true);
      return;
    }

    if (!intervalRef.current) initiateRolePolling();

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
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
        signIn,
        signOut,
        initiateRolePolling,
        updateNivelProdutor,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};
