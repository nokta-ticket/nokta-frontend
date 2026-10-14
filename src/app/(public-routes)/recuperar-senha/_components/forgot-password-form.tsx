"use client";

import Link from "next/link";
import { useState } from "react";
import api from "@/lib/axios";
import { toast } from "@/lib/toast";
import { AuthScreen } from "@/components/auth/auth-screen";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

// Mensagem genérica fixa — nunca revela se o e-mail existe ou não.
const GENERIC_MSG = "Se esse e-mail estiver cadastrado, você recebe as instruções em instantes.";

export function ForgotPasswordForm() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  async function sendRecoverMail(e: React.FormEvent) {
    e.preventDefault();
    if (!email) {
      toast.error("Preencha o e-mail para continuar");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
    } catch {
      // Silencia erros — não revela informação sobre a conta.
    } finally {
      setLoading(false);
      // Sempre a mesma mensagem genérica.
      setSent(true);
      toast.success(GENERIC_MSG);
    }
  }

  return (
    <AuthScreen
      title="Esqueceu a senha?"
      subtitle="Informe seu e-mail e a gente manda as instruções, se existir uma conta."
      backHref="/login"
      footer={
        <>
          Lembrou a senha?{" "}
          <Link href="/login" className="font-semibold text-brand underline-offset-4 hover:underline">
            Entrar
          </Link>
        </>
      }
    >
      {sent ? (
        <Callout tone="success" title="Confere seu e-mail">
          {GENERIC_MSG} Dá uma olhada também na pasta de spam.
        </Callout>
      ) : (
        <form onSubmit={sendRecoverMail} className="space-y-4" noValidate>
          <Field label="E-mail" htmlFor="forgot-email">
            <Input id="forgot-email" type="email" leftIcon="mail" autoComplete="email" placeholder="voce@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
          </Field>
          <Button type="submit" size="full" loading={loading}>
            {loading ? "Enviando…" : "Enviar instruções"}
          </Button>
        </form>
      )}
    </AuthScreen>
  );
}
