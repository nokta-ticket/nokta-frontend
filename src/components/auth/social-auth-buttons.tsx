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
      <Button type="button" variant="contrast" shape="pill" size="full" leftIcon="apple" onClick={() => go("apple")}>
        {verb} com Apple
      </Button>
    </div>
  );
}
