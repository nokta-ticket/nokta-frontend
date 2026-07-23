"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import api, { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { Check, ChevronLeft, ChevronRight, FileText, RefreshCw } from "lucide-react";

const STEPS = [
  { label: "Identificação", icon: Check },
  { label: "Termos", icon: FileText },
];

const BUSINESS_NAME_DRAFT_KEY = "nokta_onboarding_business_name_draft";

type PhoneRecheckPhase = "idle" | "sending" | "code" | "verifying";

export default function PlatformOnboardingPage() {
  const { signIn, user, role, nivelProdutor } = useAuth();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [aceitouTermos, setAceitouTermos] = useState(false);

  // Telefone já foi confirmado no cadastro (OTP via WhatsApp) — esta
  // reverificação só entra em cena se `telefoneVerificado` ficou `false`
  // por alguma inconsistência (ex.: usuário trocou o telefone em Perfil
  // entre o cadastro e completar este onboarding, ver auth.service.ts
  // `updateProfile`). Nunca é o caminho normal.
  const [phoneRecheckPhase, setPhoneRecheckPhase] = useState<PhoneRecheckPhase>("idle");
  const [phoneRecheckCode, setPhoneRecheckCode] = useState("");
  const [resendTimer, setResendTimer] = useState(0);

  const alreadyConfigured = role === "PRODUTOR" && (nivelProdutor ?? 0) >= 1;
  const phoneNeedsRecheck = !!user && user.telefoneVerificado !== true;
  const isSendingPhoneCode = phoneRecheckPhase === "sending";
  const isVerifyingPhoneCode = phoneRecheckPhase === "verifying";
  const showPhoneCodeInput = phoneRecheckPhase === "code" || phoneRecheckPhase === "verifying";

  const canAdvance = () => {
    if (step === 0) return businessName.trim().length >= 2;
    if (step === 1) return aceitouTermos;
    return false;
  };

  const startResendTimer = () => {
    setResendTimer(60);
    const timer = window.setInterval(() => {
      setResendTimer((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
  };

  const handleSendPhoneRecheckCode = async () => {
    setPhoneRecheckPhase("sending");
    try {
      await api.post("/auth/reverificar-telefone/reenviar");
      setPhoneRecheckPhase("code");
      setPhoneRecheckCode("");
      startResendTimer();
      toast.success("Código enviado no WhatsApp.");
    } catch (error) {
      setPhoneRecheckPhase("idle");
      toast.error(getErrorMessage(error, "Não foi possível enviar o código."));
    }
  };

  const handleConfirmPhoneRecheck = async () => {
    if (phoneRecheckCode.replace(/\D/g, "").length < 4) return;
    setPhoneRecheckPhase("verifying");
    try {
      const response = await api.post("/auth/reverificar-telefone/confirmar", {
        token: phoneRecheckCode,
      });
      signIn(response.data.user);
      toast.success("Telefone verificado.");
    } catch (error) {
      setPhoneRecheckPhase("code");
      toast.error(getErrorMessage(error, "Código inválido. Verifique e tente novamente."));
    }
  };

  const handleSubmit = async () => {
    if (!aceitouTermos || !user?.telefone) return;

    setLoading(true);

    try {
      // Sem `telefone` no payload — o backend usa o telefone já verificado
      // no cadastro (user.telefone), evitando ter que adivinhar aqui o
      // formato exato salvo no banco (E.164 do OTP por WhatsApp).
      const response = await api.post("/auth/ativar-produtor", {
        nomeArtistico: businessName.trim(),
        aceitouTermos,
      });

      try {
        window.localStorage.setItem(BUSINESS_NAME_DRAFT_KEY, businessName.trim());
      } catch {
        // localStorage indisponível (modo privado etc.) — não bloqueia o fluxo.
      }

      signIn(response.data.user);
      window.location.href = "/dashboard/inicio";
    } catch (error) {
      toast.error(getErrorMessage(error, "Não foi possível continuar. Tente novamente."));
    } finally {
      setLoading(false);
    }
  };

  if (alreadyConfigured) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
            <Check className="text-green-600" size={26} />
          </div>
          <h1 className="mt-5 text-2xl font-bold text-gray-900">Acesso já configurado</h1>
          <p className="mt-2 text-sm text-gray-500">Sua conta já está pronta para acessar a plataforma.</p>
          <Link href="/dashboard/inicio" className="mt-6 inline-flex w-full">
            <Button className="h-11 w-full bg-violet-600 text-white hover:bg-violet-700">
              Ir para o painel
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Image src="/logo-painel.svg" alt="Nokta" width={120} height={40} className="mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">Configure seu acesso à Nokta</h1>
          <p className="mt-1 text-sm text-gray-500">
            Conte um pouco sobre a operação que você deseja gerenciar.
          </p>
        </div>

        <div className="mb-8 flex items-center justify-center gap-2">
          {STEPS.map((currentStep, index) => (
            <div key={currentStep.label} className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                  index < step
                    ? "bg-violet-600 text-white"
                    : index === step
                      ? "border-2 border-violet-600 bg-white text-violet-600"
                      : "border-2 border-gray-200 bg-white text-gray-400"
                }`}
              >
                {index < step ? <Check size={14} /> : index + 1}
              </div>
              <span className={`text-xs ${index === step ? "font-medium text-gray-900" : "text-gray-400"}`}>
                {currentStep.label}
              </span>
              {index < STEPS.length - 1 && <div className="h-px w-8 bg-gray-200" />}
            </div>
          ))}
        </div>

        <div className="rounded-3xl bg-white p-8 shadow-sm">
          {step === 0 && (
            <div className="space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-100">
                <Check className="text-violet-600" size={22} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Como seu negócio será identificado?</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Informe o nome da empresa, produtora, bar, estabelecimento ou operação que você representa.
                </p>
              </div>
              <div className="space-y-2">
                <label htmlFor="businessName" className="block text-sm font-medium text-gray-700">
                  Nome do negócio ou operação
                </label>
                <Input
                  id="businessName"
                  value={businessName}
                  onChange={(event) => setBusinessName(event.target.value)}
                  placeholder="Ex.: Produtora Horizonte, Bar Central"
                  className="h-11"
                  autoFocus
                  autoComplete="off"
                />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-100">
                <FileText className="text-violet-600" size={22} />
              </div>

              {phoneNeedsRecheck ? (
                <>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Confirme seu telefone</h2>
                    <p className="mt-1 text-sm text-gray-500">
                      Identificamos uma pendência na verificação do seu telefone. Confirme novamente para continuar.
                    </p>
                  </div>

                  {!showPhoneCodeInput ? (
                    <Button
                      onClick={handleSendPhoneRecheckCode}
                      disabled={isSendingPhoneCode}
                      className="h-11 w-full bg-violet-600 text-white hover:bg-violet-700 disabled:cursor-not-allowed"
                    >
                      {isSendingPhoneCode ? "Enviando..." : "Enviar código no WhatsApp"}
                    </Button>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <label htmlFor="phoneRecheckCode" className="block text-sm font-medium text-gray-700">
                          Código recebido
                        </label>
                        <Input
                          id="phoneRecheckCode"
                          type="text"
                          inputMode="numeric"
                          maxLength={8}
                          value={phoneRecheckCode}
                          onChange={(event) => setPhoneRecheckCode(event.target.value.replace(/\D/g, ""))}
                          placeholder="000000"
                          className="h-11 text-center font-mono text-xl tracking-widest"
                          autoFocus
                        />
                      </div>
                      <Button
                        onClick={handleConfirmPhoneRecheck}
                        disabled={isVerifyingPhoneCode || phoneRecheckCode.length < 4}
                        className="h-11 w-full bg-violet-600 text-white hover:bg-violet-700 disabled:cursor-not-allowed"
                      >
                        {isVerifyingPhoneCode ? "Verificando..." : "Confirmar código"}
                      </Button>
                      <div className="flex justify-end text-xs text-gray-500">
                        <button
                          type="button"
                          onClick={handleSendPhoneRecheckCode}
                          disabled={resendTimer > 0 || isSendingPhoneCode}
                          className="flex items-center gap-1 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <RefreshCw size={12} />
                          {resendTimer > 0 ? `Reenviar em ${resendTimer}s` : "Reenviar código"}
                        </button>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Termos de uso</h2>
                    <p className="mt-1 text-sm text-gray-500">
                      Para continuar, confirme que leu e aceita os Termos de Uso da Nokta e a Política de Privacidade.
                    </p>
                  </div>
                  <label
                    htmlFor="termos"
                    className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 p-4 hover:border-gray-300"
                  >
                    <Checkbox
                      id="termos"
                      checked={aceitouTermos}
                      onCheckedChange={(value) => setAceitouTermos(Boolean(value))}
                      className="mt-0.5 shrink-0"
                    />
                    <span className="text-sm leading-relaxed text-gray-700">
                      Li e aceito os{" "}
                      <Link href="/termos" target="_blank" className="font-medium text-violet-700 underline">
                        Termos de Uso
                      </Link>{" "}
                      e a{" "}
                      <Link href="/privacidade" target="_blank" className="font-medium text-violet-700 underline">
                        Política de Privacidade
                      </Link>{" "}
                      da Nokta.
                    </span>
                  </label>
                </>
              )}
            </div>
          )}

          <div className="mt-8 flex gap-3">
            {step > 0 && (
              <Button variant="outline" onClick={() => setStep((current) => current - 1)} className="h-11 flex-1">
                <ChevronLeft size={16} className="mr-1" />
                Voltar
              </Button>
            )}

            {step < STEPS.length - 1 ? (
              <Button
                onClick={() => setStep((current) => current + 1)}
                disabled={!canAdvance()}
                className="h-11 flex-1 bg-violet-600 text-white hover:bg-violet-700 disabled:cursor-not-allowed"
              >
                Continuar
                <ChevronRight size={16} className="ml-1" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!canAdvance() || loading || phoneNeedsRecheck}
                className="h-11 flex-1 bg-violet-600 text-white hover:bg-violet-700 disabled:cursor-not-allowed"
              >
                {loading ? "Continuando..." : "Continuar para criar workspace"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
