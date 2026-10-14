"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api, { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { useAuth, type UserPayload } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { TotpVerifyModal } from "./totp-verify-modal";

export function AdminLoginForm() {
  const router = useRouter();
  const { signIn } = useAuth();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);

  const [totpOpen, setTotpOpen] = useState(false);
  const [twoFactorToken, setTwoFactorToken] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Sessão é cookie HttpOnly — `api` já envia credenciais.
      const res = await api.post("/auth/admin/login", { email, senha });
      const data = res.data;

      if (data.requires2fa) {
        setTwoFactorToken(data.twoFactorToken);
        setTotpOpen(true);
        return;
      }

      const { user } = data;
      if (!user) throw new Error("Não foi possível concluir o login.");

      signIn(user);
      toast.success("Login administrativo realizado!");
      router.push("/admin/dashboard");
    } catch (err) {
      toast.error(getErrorMessage(err, "Credenciais inválidas"));
    } finally {
      setLoading(false);
    }
  };

  const handleTotpSuccess = (user: UserPayload) => {
    setTotpOpen(false);
    signIn(user);
    toast.success("Login administrativo realizado!");
    router.push("/admin/dashboard");
  };

  return (
    <>
      <form className="space-y-3.5" onSubmit={handleLogin} noValidate>
        <Field label="E-mail" htmlFor="admin-email">
          <Input id="admin-email" type="email" leftIcon="mail" autoComplete="email" placeholder="voce@nokta.live" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </Field>
        <Field label="Senha" htmlFor="admin-senha">
          <PasswordInput id="admin-senha" leftIcon="lock" autoComplete="current-password" placeholder="Sua senha" value={senha} onChange={(e) => setSenha(e.target.value)} required />
        </Field>
        <Button type="submit" size="full" loading={loading} leftIcon={loading ? undefined : "shield"} className="mt-1">
          {loading ? "Verificando…" : "Entrar"}
        </Button>
      </form>

      <TotpVerifyModal open={totpOpen} twoFactorToken={twoFactorToken} onClose={() => setTotpOpen(false)} onSuccess={handleTotpSuccess} />
    </>
  );
}
