"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import api, { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { useAuth } from "@/context/AuthContext";
import { pendingInvitePath } from "@/lib/pending-invite";
import { useSurface } from "@/lib/use-surface";
import { AuthScreen } from "@/components/auth/auth-screen";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Field } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { PasswordInput } from "@/components/ui/password-input";

const PROVIDER_LABELS: Record<string, string> = {
  google: "Google",
  apple: "Apple",
};

// Mesmo critério de dashboard/onboarding/page.tsx (hasCompletedOnboardingOrg):
// só pula direto pro painel se existe ao menos uma organização e todas já
// concluíram o onboarding. Qualquer falha na checagem cai no comportamento
// anterior (onboarding decide) — nunca bloqueia o login por causa disso.
async function resolveProdutorDestination(): Promise<string> {
  try {
    const res = await api.get<Array<{ onboardingCompleted: boolean }>>("/me/organizations");
    const orgs = res.data ?? [];
    const onboardingDone = orgs.length > 0 && orgs.every((o) => o.onboardingCompleted);
    return onboardingDone ? "/dashboard/inicio" : "/dashboard/onboarding";
  } catch {
    return "/dashboard/onboarding";
  }
}

/** Tela de espera enquanto confirmamos a sessão com /auth/me. */
export function AuthCallbackPending() {
  return (
    <AuthScreen size="sm">
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <Icon name="loader" size={26} className="animate-spin text-brand" />
        <p className="text-body text-muted-foreground">Autenticando…</p>
      </div>
    </AuthScreen>
  );
}

function MergeAccountForm({ code, provider, ctx }: { code: string; provider: string; ctx: string }) {
  const router = useRouter();
  const { signIn } = useAuth();
  const [senha, setSenha] = useState("");
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

      const invite = pendingInvitePath();
      if (invite) {
        router.replace(invite);
      } else if (ctx === "produtor") {
        // Decide antes de navegar — ver mesmo comentário em login-form.tsx.
        router.replace(await resolveProdutorDestination());
      } else {
        // Navegação forçada — ver login-form.tsx.
        window.location.href = "/";
      }
    } catch (err) {
      toast.error(getErrorMessage(err, "Senha incorreta. Tente novamente."));
      setLoading(false);
    }
  };

  return (
    <AuthScreen title="Vincular conta" subtitle={`Já existe uma conta com esse e-mail. Confirme sua senha pra vincular o ${providerLabel} e entrar dos dois jeitos.`} backHref="/login">
      <form onSubmit={handleMerge} className="space-y-4" noValidate>
        <Callout tone="info" icon={provider === "apple" ? "apple" : "google"}>
          Depois de vincular, você entra com <strong className="text-foreground">{providerLabel}</strong> ou com e-mail e senha.
        </Callout>
        <Field label="Sua senha atual" htmlFor="merge-senha">
          <PasswordInput id="merge-senha" leftIcon="lock" autoComplete="current-password" placeholder="Senha da conta Nokta" value={senha} onChange={(e) => setSenha(e.target.value)} required autoFocus />
        </Field>
        <Button type="submit" size="full" loading={loading}>
          {loading ? "Vinculando…" : `Vincular com ${providerLabel}`}
        </Button>
        <Button type="button" variant="ghost" size="full" onClick={() => router.replace("/login")} disabled={loading}>
          Cancelar
        </Button>
      </form>
    </AuthScreen>
  );
}

export function AuthCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const surface = useSurface();
  const { signIn } = useAuth();

  const conflict = searchParams.get("conflict") === "true";
  const code = searchParams.get("code") ?? "";
  const provider = searchParams.get("provider") ?? "";
  // Fallback de superfície — ver mesmo comentário em forms-register.tsx: o
  // `state` do OAuth só carrega "produtor" se o botão foi clicado com
  // ?ctx=produtor já na URL (ex.: veio do CTA da LP institucional).
  // Cadastro/login via OAuth direto em app.nokta.live não tinha esse
  // parâmetro e nunca chegava ao onboarding.
  const ctx = searchParams.get("ctx") || (surface === "PLATFORM" ? "produtor" : "");

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

        // Convite aberto antes do login: o OAuth não carrega o `redirect`,
        // então sem isso o convidado caía no "criar workspace".
        const invite = pendingInvitePath();
        if (invite) {
          if (!cancelled) router.replace(invite);
        } else if (ctx === "produtor") {
          const destination = await resolveProdutorDestination();
          if (!cancelled) router.replace(destination);
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

  return <AuthCallbackPending />;
}
