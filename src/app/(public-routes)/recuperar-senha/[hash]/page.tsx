"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api, { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { AuthFormFallback, AuthScreen } from "@/components/auth/auth-screen";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/password-input";

export default function RedefinirSenhaPage() {
  const router = useRouter();
  const { hash } = useParams<{ hash: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [password, setPassword] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        await api.get(`/auth/validate-reset-password-request/${hash}`);
      } catch (error) {
        if (!active) return;
        toast.error(getErrorMessage(error, "Este link de recuperação não é válido ou já expirou."));
        router.push("/");
        return;
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [hash, router]);

  async function updatePassword(e: React.FormEvent) {
    e.preventDefault();
    if (password === "") {
      toast.error("Preencha a senha para continuar");
      return;
    }
    if (password.length < 6) {
      toast.error("A senha deve ter no mínimo 6 caracteres");
      return;
    }
    try {
      setSaving(true);
      await api.post(`/auth/reset-password/${hash}`, { password });
      toast.success("Senha atualizada com sucesso");
      router.push("/login");
    } catch (error) {
      toast.error(getErrorMessage(error, "Ocorreu um erro ao alterar a senha"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <AuthScreen title="Nova senha" subtitle="Escolha uma senha nova pra sua conta." backHref="/login">
      {loading ? (
        <AuthFormFallback rows={2} />
      ) : (
        <form onSubmit={updatePassword} className="space-y-4" noValidate>
          <Field label="Nova senha" htmlFor="reset-senha" hint="Mínimo de 6 caracteres.">
            <PasswordInput id="reset-senha" leftIcon="lock" autoComplete="new-password" placeholder="Digite a nova senha" value={password} onChange={(e) => setPassword(e.target.value)} required autoFocus />
          </Field>
          <Button type="submit" size="full" loading={saving}>
            {saving ? "Salvando…" : "Alterar senha"}
          </Button>
        </form>
      )}
    </AuthScreen>
  );
}
