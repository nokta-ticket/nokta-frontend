"use client";

import { Button } from "@/components/ui/button";
import { currentSurfaceStateToken, getApiBaseUrl } from "@/lib/surfaces";

/**
 * Entrar/cadastrar com Google e Apple. O OAuth é todo do backend: só
 * redirecionamos pra `{api}/auth/{provider}?state=...` — o `state` carrega
 * a superfície atual (platform/tickets) e o `ctx` (ex.: "produtor") pra o
 * callback saber pra onde devolver a pessoa (ver auth.controller.ts).
 */
export function SocialAuthButtons({ ctx, mode = "login" }: { ctx: string; mode?: "login" | "register" }) {
  const go = (provider: "google" | "apple") => {
    const state = `${currentSurfaceStateToken()}:${ctx}`;
    window.location.href = `${getApiBaseUrl()}/auth/${provider}?state=${state}`;
  };
  const verb = mode === "login" ? "Continuar" : "Cadastrar";

  return (
    <div className="space-y-2.5">
      <Button type="button" variant="contrast" shape="pill" size="full" leftIcon="google" onClick={() => go("google")}>
        {verb} com Google
      </Button>
      {/* Apple ainda sem credenciais na API (APPLE_* não configuradas): o
          fluxo terminava num erro da Apple. Fica visível, mas desligado,
          até o Sign in with Apple ser configurado. */}
      <Button type="button" variant="contrast" shape="pill" size="full" leftIcon="apple" disabled aria-disabled="true" title="Login com Apple indisponível no momento">
        {verb} com Apple · indisponível
      </Button>
    </div>
  );
}
