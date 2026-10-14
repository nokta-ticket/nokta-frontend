"use client";

import { Suspense } from "react";
import { useSurface } from "@/lib/use-surface";
import { AuthFormFallback, AuthScreen } from "@/components/auth/auth-screen";
import { RegisterForm } from "./forms-register";

/**
 * Mesma tela nos dois hosts — só copy e logo mudam quando `useSurface()`
 * resolve PLATFORM (app.nokta.live), onde o cadastro é sobre virar
 * gestor/produtor (nunca menciona ingresso). O formulário (campos,
 * validação, OTP, OAuth, endpoints) é um só — ver forms-register.tsx.
 */
function RegisterSurfaceInner() {
  const surface = useSurface();
  const platform = surface === "PLATFORM";
  return (
    <AuthScreen
      title="Criar conta"
      subtitle={platform ? "Uma única plataforma para gerenciar eventos, operação, equipe e resultados." : "Rápido, gratuito e seguro. Leva menos de um minuto."}
      externalBack={platform ? { href: "https://www.nokta.live", label: "Voltar para nokta.live" } : undefined}
    >
      <RegisterForm />
    </AuthScreen>
  );
}

export function RegisterSurface() {
  return (
    <Suspense
      fallback={
        <AuthScreen title="Criar conta">
          <AuthFormFallback rows={6} />
        </AuthScreen>
      }
    >
      <RegisterSurfaceInner />
    </Suspense>
  );
}
