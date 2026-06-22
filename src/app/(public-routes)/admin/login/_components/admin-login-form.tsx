"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { toast } from "@/lib/toast";
import { useAuth } from "@/context/AuthContext";
import { TotpVerifyModal } from "./totp-verify-modal";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export function AdminLoginForm() {
  const router = useRouter();
  const { signIn } = useAuth();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const [totpOpen, setTotpOpen] = useState(false);
  const [twoFactorToken, setTwoFactorToken] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });
      const data = await res.json();

      if (!res.ok) {
        const msg: string = Array.isArray(data.message)
          ? data.message.join(" ")
          : data.message || "";
        throw new Error(msg || "Credenciais inválidas");
      }

      if (data.requires2fa) {
        setTwoFactorToken(data.twoFactorToken);
        setTotpOpen(true);
        return;
      }

      const { token, user } = data;
      if (!token) throw new Error("Token não retornado pela API");

      signIn(token, user);
      toast.success("Login administrativo realizado!");
      router.push("/admin/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  const handleTotpSuccess = (token: string, user: any) => {
    setTotpOpen(false);
    signIn(token, user);
    toast.success("Login administrativo realizado!");
    router.push("/admin/dashboard");
  };

  return (
    <>
      <form className="space-y-3" onSubmit={handleLogin}>
        <div className="relative">
          <Mail
            size={15}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30"
          />
          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-11 w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 text-[16px] sm:text-sm text-white placeholder:text-white/30 outline-none transition-all focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
          />
        </div>

        <div className="relative">
          <Lock
            size={15}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30"
          />
          <input
            type={showPw ? "text" : "password"}
            placeholder="Senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
            className="h-11 w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-10 text-[16px] sm:text-sm text-white placeholder:text-white/30 outline-none transition-all focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
          />
          <button
            type="button"
            onClick={() => setShowPw((p) => !p)}
            aria-label={showPw ? "Ocultar senha" : "Mostrar senha"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 transition-colors hover:text-white/60"
          >
            {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="h-11 w-full rounded-xl bg-violet-600 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 transition-all hover:bg-violet-500 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              Verificando…
            </span>
          ) : (
            "Entrar"
          )}
        </button>
      </form>

      <TotpVerifyModal
        open={totpOpen}
        twoFactorToken={twoFactorToken}
        onClose={() => setTotpOpen(false)}
        onSuccess={handleTotpSuccess}
      />
    </>
  );
}
