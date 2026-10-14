"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/lib/toast";
import api, { getErrorMessage } from "@/lib/axios";

/**
 * Modal de login reutilizável (checkout do evento e revenda). Mesmo
 * comportamento de sempre: e-mail + senha, `signIn` com o usuário devolvido
 * e link pro cadastro. Folha inferior no celular, centralizado no desktop
 * (herdado do `Dialog`). Quem monta decide quando fecha (`onClose`).
 */
export function LoginModal({ onClose, onSuccess, registerHref = "/register" }: { onClose: () => void; onSuccess: () => void; registerHref?: string }) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, senha: password });
      signIn(res.data.user);
      toast.success("Login realizado!");
      onSuccess();
    } catch (err) {
      toast.error(getErrorMessage(err, "E-mail ou senha incorretos."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => (!open && !loading ? onClose() : null)}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>Entre pra continuar</DialogTitle>
          <DialogDescription>Seus ingressos ficam guardados na sua conta.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleLogin} className="flex min-h-0 flex-1 flex-col">
          <DialogBody className="gap-4">
            <Field label="E-mail" htmlFor="login-email">
              <Input id="login-email" type="email" inputMode="email" autoComplete="email" placeholder="voce@exemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
            </Field>
            <Field label="Senha" htmlFor="login-password" action={<Link href="/recuperar-senha" className="font-semibold text-brand hover:underline">Esqueci a senha</Link>}>
              <div className="relative">
                <Input id="login-password" type={showPw ? "text" : "password"} autoComplete="current-password" placeholder="Sua senha" value={password} onChange={(e) => setPassword(e.target.value)} required className="pr-12" />
                <button type="button" onClick={() => setShowPw((v) => !v)} aria-label={showPw ? "Ocultar senha" : "Mostrar senha"} className="absolute right-1 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-surface-3 hover:text-foreground">
                  <Icon name={showPw ? "eye-slash" : "eye"} size={14} />
                </button>
              </div>
            </Field>
          </DialogBody>
          <DialogFooter className="flex-col sm:flex-col sm:items-stretch">
            <Button type="submit" size="full" loading={loading}>
              Entrar
            </Button>
            <p className="pt-1 text-center text-caption text-muted-foreground">
              Não tem conta?{" "}
              <Link href={registerHref} className="font-semibold text-brand hover:underline">
                Criar conta
              </Link>
            </p>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
