"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import api, { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { useAuth, type UserPayload } from "@/context/AuthContext";
import { pendingInvitePath } from "@/lib/pending-invite";
import { isSafeInternalRedirect } from "@/lib/safe-redirect";
import { useSurface } from "@/lib/use-surface";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { AuthDivider } from "@/components/auth/auth-screen";
import { SocialAuthButtons } from "@/components/auth/social-auth-buttons";
import { ConfirmEmailModal } from "./confirmar-email-modal";

export function LoginForm() {
  const router = useRouter();
  const surface = useSurface();
  const searchParams = useSearchParams();
  // Em PLATFORM (app.nokta.live), login sempre segue o caminho de
  // gestor/produtor — mesmo raciocínio de forms-register.tsx: sem isso,
  // quem logasse direto (sem ?ctx=produtor) caía em "/" e nunca era
  // levado a completar o onboarding pendente.
  const ctx = searchParams.get("ctx") || (surface === "PLATFORM" ? "produtor" : "");
  const redirectTo = searchParams.get("redirect") || "";
  const { signIn } = useAuth();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [emailConfirmacao, setEmailConfirmacao] = useState("");
  const [phoneConfirmacao, setPhoneConfirmacao] = useState<string | undefined>(undefined);

  // Comum ao login normal e à confirmação da conta pelo modal (que já
  // autentica via cookie em confirmar-telefone).
  const finishLogin = async (user: UserPayload) => {
    signIn(user);
    toast.success("Login realizado com sucesso!");

    const invite = pendingInvitePath();
    if (isSafeInternalRedirect(redirectTo)) {
      router.push(redirectTo);
    } else if (invite) {
      // Convite aberto antes do login: volta pra ele (e não pro "criar workspace").
      router.push(invite);
    } else if (ctx === "produtor") {
      // Decide aqui, antes de navegar: se toda organização do usuário já
      // tem onboarding concluído (mesmo campo que dashboard/onboarding/
      // page.tsx usa, vindo de GET /me/organizations), vai direto pro
      // painel — sem a URL passar visivelmente por /dashboard/onboarding.
      try {
        const orgsRes = await api.get<Array<{ onboardingCompleted: boolean }>>("/me/organizations");
        const orgs = Array.isArray(orgsRes.data) ? orgsRes.data : [];
        const onboardingDone = orgs.length > 0 && orgs.every((o) => o.onboardingCompleted);
        router.push(onboardingDone ? "/dashboard/inicio" : "/dashboard/onboarding");
      } catch {
        router.push("/dashboard/onboarding");
      }
    } else {
      // Navegação forçada (não router.push): "/" decide a rota conforme
      // autenticação no middleware — o cache de rota do Next no client pode
      // servir uma resposta anterior (anônima) e nunca sair do /login. Só
      // um request de verdade garante que o middleware reavalie com o
      // cookie que acabou de ser gravado.
      window.location.href = "/";
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFormError(null);
    try {
      // Sessão é cookie HttpOnly gravado pela resposta — `api` já manda
      // credenciais pra origem da API (withCredentials).
      const res = await api.post("/auth/login", { email, senha });
      const data = res.data;
      if (!data?.user) throw new Error("Não foi possível concluir o login.");
      await finishLogin(data.user);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        const data = (err.response.data ?? {}) as { code?: string; message?: string | string[]; phone?: string };
        const msg: string = Array.isArray(data.message) ? data.message.join(" ") : data.message || "";
        // Conta sem telefone não tem pra onde mandar código — abrir o modal
        // de verificação aqui deixaria a pessoa esperando algo impossível.
        if (data.code === "ACCOUNT_NOT_CONFIRMED_NO_PHONE") {
          setFormError(msg);
          toast.error(msg);
          return;
        }
        // Senha certa, conta não confirmada: o backend já reenviou o código
        // pro WhatsApp da conta — abre a verificação direto.
        if (data.code === "ACCOUNT_NOT_CONFIRMED" || msg.toLowerCase().includes("confirmada")) {
          setEmailConfirmacao(email);
          setPhoneConfirmacao(data.phone);
          setModalOpen(true);
          if (data.code === "ACCOUNT_NOT_CONFIRMED") toast.success(msg);
          return;
        }
        const finalMsg = msg || "E-mail ou senha incorretos.";
        setFormError(finalMsg);
        toast.error(finalMsg);
        return;
      }
      const finalMsg = getErrorMessage(err, "Erro ao fazer login");
      setFormError(finalMsg);
      toast.error(finalMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSuccess = async (user: UserPayload | null | undefined) => {
    setModalOpen(false);
    if (user) {
      await finishLogin(user);
    } else {
      toast.success("Conta confirmada! Faça login novamente.");
    }
  };

  return (
    <>
      <div className="space-y-4">
        <SocialAuthButtons ctx={ctx} mode="login" />
        <AuthDivider />

        <form className="space-y-3.5" onSubmit={handleLogin} noValidate>
          <Field label="E-mail" htmlFor="login-email">
            <Input id="login-email" type="email" leftIcon="mail" autoComplete="email" placeholder="voce@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </Field>

          <Field
            label="Senha"
            htmlFor="login-senha"
            error={formError}
            action={
              <Link href="/recuperar-senha" className="font-medium text-brand underline-offset-4 hover:underline">
                Esqueci a senha
              </Link>
            }
          >
            <PasswordInput id="login-senha" leftIcon="lock" autoComplete="current-password" placeholder="Sua senha" value={senha} onChange={(e) => setSenha(e.target.value)} required aria-invalid={formError ? true : undefined} />
          </Field>

          <Button type="submit" size="full" loading={loading} className="mt-1">
            {loading ? "Entrando…" : "Entrar"}
          </Button>
        </form>
      </div>

      <ConfirmEmailModal open={modalOpen} email={emailConfirmacao} phone={phoneConfirmacao} onClose={() => setModalOpen(false)} onConfirm={handleConfirmSuccess} />
    </>
  );
}
