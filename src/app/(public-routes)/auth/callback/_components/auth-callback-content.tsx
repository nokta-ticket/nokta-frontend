"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Eye, EyeOff } from "lucide-react";
import { toast } from "@/lib/toast";
import { useAuth } from "@/context/AuthContext";
import api, { getErrorMessage } from "@/lib/axios";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const PROVIDER_LABELS: Record<string, string> = {
  google: "Google",
  apple: "Apple",
};

function MergeAccountForm({
  code,
  provider,
  ctx,
}: {
  code: string;
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
      // Fase 5: `code` é um handoff opaco de uso único (nunca um JWT) — ver
      // OAuthHandoffService no backend. O cookie de sessão HttpOnly já vem
      // gravado nesta mesma resposta.
      const res = await api.post("/auth/vincular-oauth", { code, senha });
      const { user } = res.data;

      signIn(user);
      toast.success(`Conta ${providerLabel} vinculada com sucesso!`);

      if (ctx === "produtor") {
        if (user.role === "PRODUTOR") {
          router.replace("/dashboard/eventos");
        } else {
          router.replace("/dashboard/eventos/onboarding");
        }
      } else {
        // Navegação forçada — ver login-form.tsx (mesmo motivo: "/" decide
        // a rota conforme autenticação, o cache de rota do Next pode servir
        // uma resposta anônima anterior).
        window.location.href = "/";
      }
    } catch (err) {
      toast.error(getErrorMessage(err, "Senha incorreta. Tente novamente."));
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
  const code = searchParams.get("code") ?? "";
  const provider = searchParams.get("provider") ?? "";
  const ctx = searchParams.get("ctx") ?? "";

  useEffect(() => {
    if (conflict) return; // renderiza o form de merge, não faz redirect

    // Fase 5: o callback OAuth nunca carrega o JWT na URL — o backend já
    // gravou o cookie HttpOnly na própria resposta do redirect. Aqui só
    // confirmamos a sessão via /auth/me pra saber o papel e decidir a rota.
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get("/auth/me");
        if (cancelled) return;
        const data = res.data;
        signIn({ userId: data.id, role: data.role, nivelProdutor: data.nivelProdutor ?? null });

        if (ctx === "produtor") {
          router.replace(data.role === "PRODUTOR" ? "/dashboard/eventos" : "/dashboard/eventos/onboarding");
        } else {
          // Navegação forçada — ver login-form.tsx.
          window.location.href = "/";
        }
      } catch {
        if (!cancelled) router.replace("/login");
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conflict, ctx]);

  if (conflict && code) {
    return <MergeAccountForm code={code} provider={provider} ctx={ctx} />;
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
