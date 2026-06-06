"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Eye, EyeOff } from "lucide-react";
import { toast } from "@/lib/toast";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const PROVIDER_LABELS: Record<string, string> = {
  google: "Google",
  apple: "Apple",
};

function MergeAccountForm({
  conflictToken,
  provider,
  ctx,
}: {
  conflictToken: string;
  provider: string;
  ctx: string;
}) {
  const router = useRouter();
  const { signIn } = useAuth();
  const [senha, setSenha] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const providerLabel = PROVIDER_LABELS[provider] ?? provider;

  const handleMerge = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/vincular-oauth`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({ conflictToken, senha }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Erro ao vincular conta");
      }

      const { token, user } = data;
      signIn(token, user);
      toast.success(`Conta ${providerLabel} vinculada com sucesso!`);

      if (ctx === "produtor") {
        if (user.role === "PRODUTOR") {
          router.replace("/produtor/eventos");
        } else {
          router.replace("/produtor/onboarding");
        }
      } else {
        router.replace("/");
      }
    } catch (err: any) {
      toast.error(err.message || "Senha incorreta. Tente novamente.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
        <div className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-violet-50">
            <Lock className="h-6 w-6 text-violet-500" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900">Vincular conta {providerLabel}</h1>
          <p className="text-sm text-gray-500">
            Já existe uma conta com esse e-mail. Confirme sua senha para vincular o{" "}
            <strong>{providerLabel}</strong> e acessar com os dois métodos.
          </p>
        </div>

        <form onSubmit={handleMerge} className="space-y-4">
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <Input
              type={showPw ? "text" : "password"}
              placeholder="Sua senha atual"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              className="h-11 rounded-lg pl-10 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPw((p) => !p)}
              aria-label="Mostrar/ocultar senha"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPw ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="h-11 w-full bg-violet-500 font-semibold text-white hover:bg-violet-600"
          >
            {loading ? "Vinculando…" : `Vincular com ${providerLabel}`}
          </Button>

          <button
            type="button"
            onClick={() => router.replace("/login")}
            className="w-full text-center text-sm text-gray-400 hover:text-gray-600"
          >
            Cancelar — voltar ao login
          </button>
        </form>
      </div>
    </div>
  );
}

export function AuthCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { signIn } = useAuth();

  const conflict = searchParams.get("conflict") === "true";
  const conflictToken = searchParams.get("conflictToken") ?? "";
  const provider = searchParams.get("provider") ?? "";
  const ctx = searchParams.get("ctx") ?? "";

  useEffect(() => {
    if (conflict) return; // renderiza o form de merge, não faz redirect

    const token = searchParams.get("token");
    const role = searchParams.get("role") as "COMUM" | "PRODUTOR" | "ADMIN" | null;
    const nivelProdutorParam = searchParams.get("nivelProdutor");

    if (!token || !role) {
      router.replace("/login");
      return;
    }

    const nivelProdutor = nivelProdutorParam ? parseInt(nivelProdutorParam, 10) : null;
    signIn(token, { userId: 0, role, nivelProdutor });

    if (ctx === "produtor") {
      if (role === "PRODUTOR") {
        router.replace("/produtor/eventos");
      } else {
        router.replace("/produtor/onboarding");
      }
    } else {
      router.replace("/");
    }
  }, [searchParams, signIn, router, conflict, ctx]);

  if (conflict && conflictToken) {
    return <MergeAccountForm conflictToken={conflictToken} provider={provider} ctx={ctx} />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-black" />
        <p className="text-sm text-gray-500">Autenticando...</p>
      </div>
    </div>
  );
}
