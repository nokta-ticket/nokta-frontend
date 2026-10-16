"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { getCountryCallingCode, type Country } from "react-phone-number-input";
import api, { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { OtpInput } from "@/components/ui/otp-input";
import { PhoneField } from "@/components/ui/phone-field";
import { validatePhone } from "@/components/ui/phone-input";
import { useResendCooldown } from "@/components/auth/use-resend-cooldown";

const STAFF_ROLES = new Set(["ADMIN", "SUPER_ADMIN", "SUPPORT"]);
// Telas onde a janela atrapalharia o próprio login/cadastro ou o painel da equipe.
const SKIP_PREFIXES = ["/login", "/register", "/auth/", "/admin", "/recuperar-senha"];

/**
 * Celular obrigatório. Quem entra pelo Google ou Apple só traz nome e e-mail;
 * enquanto a conta não tiver celular confirmado, esta janela pede o número e o
 * código do WhatsApp (é por ele que o ingresso chega). Conta que já tem
 * celular nunca vê a janela. A API também recusa compra sem celular
 * (PHONE_REQUIRED), então fechar a janela por fora não libera nada.
 */
export function PhoneRequiredGate() {
  const { isAuthenticated, isAuthResolved, role, user, updateTelefone, signOut } = useAuth();
  const pathname = usePathname() ?? "";

  const needsPhone =
    isAuthenticated &&
    isAuthResolved &&
    !!user &&
    !user.telefone &&
    !(role && STAFF_ROLES.has(role)) &&
    !SKIP_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (!needsPhone) return null;
  // Navegação forçada para o login, como no menu do usuário: só limpar o
  // estado deixava a pessoa na mesma tela.
  const handleSignOut = () => {
    signOut();
    window.location.href = "/login";
  };

  return <PhoneRequiredDialog onDone={updateTelefone} onSignOut={handleSignOut} />;
}

function PhoneRequiredDialog({ onDone, onSignOut }: { onDone: (telefone: string) => void; onSignOut: () => void }) {
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [telefone, setTelefone] = useState("");
  const [country, setCountry] = useState<Country>("BR");
  const [touched, setTouched] = useState(false);
  const [sending, setSending] = useState(false);
  const [code, setCode] = useState("");
  const [checking, setChecking] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const cooldown = useResendCooldown(60);

  const phoneValid = validatePhone(telefone, country);
  const e164 = `+${getCountryCallingCode(country)}${telefone.replace(/\D/g, "")}`;

  const sendCode = async () => {
    setTouched(true);
    if (!phoneValid || sending) return;
    setSending(true);
    try {
      await api.post("/auth/telefone", { telefone: e164 });
      setStep("code");
      setCode("");
      setInvalid(false);
      cooldown.startCooldown(cooldown.sendCount + 1);
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível enviar o código."));
    } finally {
      setSending(false);
    }
  };

  const confirm = async (value: string) => {
    setChecking(true);
    setInvalid(false);
    try {
      const res = await api.post<{ telefone: string }>("/auth/telefone/confirmar", { token: value });
      toast.success("Celular confirmado.");
      onDone(res.data.telefone);
    } catch (err) {
      setInvalid(true);
      setCode("");
      toast.error(getErrorMessage(err, "Código inválido. Tente novamente."));
    } finally {
      setChecking(false);
    }
  };

  return (
    <Dialog open>
      <DialogContent
        size="sm"
        showCloseButton={false}
        onEscapeKeyDown={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="whatsapp" size={18} className="text-success" />
            {step === "phone" ? "Informe seu celular" : "Confirme seu número"}
          </DialogTitle>
          <DialogDescription>
            {step === "phone"
              ? "Seu ingresso chega pelo WhatsApp. Vamos mandar um código para confirmar o número."
              : `Mandamos um código de 6 dígitos para o WhatsApp ${telefone}.`}
          </DialogDescription>
        </DialogHeader>

        {step === "phone" ? (
          <DialogBody className="gap-5 pb-6">
            <form
              className="flex flex-col gap-5"
              onSubmit={(event) => {
                event.preventDefault();
                sendCode();
              }}
            >
              <Field label="Celular com DDD" htmlFor="phone-required" error={touched && !phoneValid ? "Celular inválido" : ""}>
                <PhoneField
                  id="phone-required"
                  value={telefone}
                  country={country}
                  onChange={(display, nextCountry) => {
                    setTelefone(display);
                    setCountry(nextCountry);
                  }}
                  onBlur={() => setTouched(true)}
                  invalid={touched && !phoneValid}
                />
              </Field>
              <Button type="submit" disabled={sending} className="w-full">
                {sending ? "Enviando…" : "Receber código"}
              </Button>
              <button type="button" onClick={onSignOut} className="text-caption text-muted-foreground underline-offset-4 hover:underline">
                Sair da conta
              </button>
            </form>
          </DialogBody>
        ) : (
          <DialogBody className="gap-5 pb-6">
            <OtpInput value={code} onChange={setCode} onComplete={confirm} disabled={checking} invalid={invalid} autoFocus />
            <p className="flex min-h-5 items-center justify-center gap-2 text-center text-caption text-muted-foreground">
              {checking ? (
                <>
                  <Icon name="loader" size={12} className="animate-spin" /> Verificando…
                </>
              ) : cooldown.secondsLeft > 0 ? (
                <>
                  Reenviar em <span className="tnum font-semibold text-foreground">{cooldown.formatTime(cooldown.secondsLeft)}</span>
                </>
              ) : (
                <>
                  Não recebeu?{" "}
                  <button type="button" onClick={sendCode} className="font-semibold text-brand underline-offset-4 hover:underline">
                    Reenviar código
                  </button>
                </>
              )}
            </p>
            <button
              type="button"
              onClick={() => setStep("phone")}
              className="text-caption text-muted-foreground underline-offset-4 hover:underline"
            >
              Trocar número
            </button>
          </DialogBody>
        )}
      </DialogContent>
    </Dialog>
  );
}
