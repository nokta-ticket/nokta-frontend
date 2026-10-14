"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useSurface } from "@/lib/use-surface";
import { AuthFormFallback, AuthScreen } from "@/components/auth/auth-screen";
import { LoginForm } from "./login-form";

// Fase 5.1: "Criar conta" precisa preservar o `ctx` (ex.: "produtor", vindo
// do CTA de cadastro empresarial da LP) — sem isso, quem não tem conta ainda
// perdia a indicação de superfície empresarial ao trocar pra /register.
function useRegisterHref(): string {
  const searchParams = useSearchParams();
  const ctx = searchParams.get("ctx");
  const redirect = searchParams.get("redirect");
  const params = new URLSearchParams();
  if (ctx) params.set("ctx", ctx);
  if (redirect) params.set("redirect", redirect);
  const query = params.toString();
  return query ? `/register?${query}` : "/register";
}

/**
 * A mesma tela nos dois hosts; só copy e logo mudam quando `useSurface()`
 * resolve PLATFORM (app.nokta.live). O formulário (endpoints, OAuth, OTP)
 * é um só — ver login-form.tsx.
 */
function LoginSurfaceInner() {
  const surface = useSurface();
  const registerHref = useRegisterHref();
  const platform = surface === "PLATFORM";

  return (
    <AuthScreen
      title={platform ? "Entrar" : "Bora pro rolê?"}
      subtitle={platform ? "Acesse o painel da sua organização." : "Entra pra ver seus ingressos e garantir o próximo."}
      externalBack={platform ? { href: "https://www.nokta.live", label: "Voltar para nokta.live" } : undefined}
      footer={
        <>
          Ainda não tem conta?{" "}
          <Link href={registerHref} className="font-semibold text-brand underline-offset-4 hover:underline">
            Criar conta
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthScreen>
  );
}

export function LoginSurface() {
  return (
    <Suspense
      fallback={
        <AuthScreen title="Bora pro rolê?">
          <AuthFormFallback rows={5} />
        </AuthScreen>
      }
    >
      <LoginSurfaceInner />
    </Suspense>
  );
}
