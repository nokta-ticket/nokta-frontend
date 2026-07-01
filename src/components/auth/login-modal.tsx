"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { X, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/lib/toast";
import api, { getErrorMessage } from "@/lib/axios";

/**
 * Modal de login/cadastro reutilizável (checkout de evento e página do evento).
 * Mantém o comportamento original: login por e-mail/senha + link para cadastro.
 */
export function LoginModal({
  onClose,
  onSuccess,
  registerHref = "/register",
}: {
  onClose: () => void;
  onSuccess: () => void;
  registerHref?: string;
}) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, senha: password });
      signIn(res.data.token, res.data.user);
      toast.success("Login realizado!");
      onSuccess();
    } catch (err) {
      toast.error(getErrorMessage(err, "E-mail ou senha incorretos."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />
      <div
        className="relative z-10 w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl px-6 pt-5 pb-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* drag handle */}
        <div className="w-10 h-1 rounded-full bg-gray-200 mx-auto mb-5 sm:hidden" />

        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-[17px] text-[#0F172A]">Entre para continuar</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleLogin} className="space-y-3">
          <Input
            type="email" placeholder="E-mail" value={email}
            onChange={(e) => setEmail(e.target.value)} required
            className="h-11 text-[16px] sm:text-[14px]"
          />
          <div className="relative">
            <Input
              type={showPw ? "text" : "password"} placeholder="Senha" value={password}
              onChange={(e) => setPassword(e.target.value)} required
              className="h-11 text-[14px] pr-10"
            />
            <button type="button" onClick={() => setShowPw((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <Button type="submit" disabled={loading}
            className="w-full h-11 font-bold text-[14px] bg-gradient-to-r from-[#9944CC] to-[#3399FF] text-white">
            {loading ? <Loader2 size={16} className="animate-spin" /> : "Entrar"}
          </Button>
        </form>

        <p className="mt-4 text-center text-[13px] text-gray-500">
          Não tem conta?{" "}
          <button onClick={() => router.push(registerHref)} className="text-[#9944CC] font-semibold hover:underline">
            Cadastre-se
          </button>
        </p>
      </div>
    </div>
  );
}
