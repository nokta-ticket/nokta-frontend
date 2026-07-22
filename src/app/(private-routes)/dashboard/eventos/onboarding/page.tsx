"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import api, { getErrorMessage } from "@/lib/axios";
import { formatPhone, normalizeDigits } from "@/lib/br-data";
import { toast } from "@/lib/toast";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  FileText,
  Mic2,
  Phone,
  RefreshCw,
} from "lucide-react";

const STEPS = [
  { label: "Identidade", icon: Mic2 },
  { label: "Contato", icon: Phone },
  { label: "Termos", icon: FileText },
];

type SmsPhase = "input" | "code" | "verified";

export default function ProdutorOnboardingPage() {
  const { signIn, user, role, nivelProdutor } = useAuth();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [nomeArtistico, setNomeArtistico] = useState("");
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [smsPhase, setSmsPhase] = useState<SmsPhase>("input");
  const [telefone, setTelefone] = useState("");
  const [smsCode, setSmsCode] = useState("");
  const [smsSending, setSmsSending] = useState(false);
  const [smsVerifying, setSmsVerifying] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const telefoneDigits = useMemo(() => normalizeDigits(telefone).slice(0, 11), [telefone]);
  const alreadyProducer = role === "PRODUTOR" && (nivelProdutor ?? 0) >= 1;

  useEffect(() => {
    if (!user) return;

    if (!nomeArtistico.trim()) {
      const fallbackName = [user.nome, user.sobrenome].filter(Boolean).join(" ").trim();
      setNomeArtistico(user.nomeArtistico?.trim() || fallbackName);
    }

    if (!telefoneDigits && user.telefone) {
      setTelefone(formatPhone(user.telefone));
    }

    if (user.telefone && user.telefoneVerificado) {
      setSmsPhase("verified");
    }
  }, [
    nomeArtistico,
    telefoneDigits,
    user,
  ]);

  useEffect(() => {
    if (resendTimer <= 0) return;

    const timer = window.setInterval(() => {
      setResendTimer((currentValue) => {
        if (currentValue <= 1) {
          window.clearInterval(timer);
          return 0;
        }

        return currentValue - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [resendTimer]);

  const canAdvance = () => {
    if (step === 0) return nomeArtistico.trim().length >= 2;
    if (step === 1) return smsPhase === "verified";
    if (step === 2) return aceitouTermos;
    return false;
  };

  const handleSendSms = async () => {
    if (telefoneDigits.length < 10) {
      toast.error("Digite um telefone valido com DDD.");
      return;
    }

    setSmsSending(true);

    try {
      await api.put("/produtor/atualizar-telefone-sms", {
        telefone: telefoneDigits,
      });

      await api.post("/produtor/enviar-sms-n2");

      setSmsPhase("code");
      setSmsCode("");
      setResendTimer(60);
      toast.success("Codigo enviado por SMS.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Nao foi possivel enviar o SMS."));
    } finally {
      setSmsSending(false);
    }
  };

  const handleVerifySms = async () => {
    if (smsCode.replace(/\D/g, "").length < 4) {
      return;
    }

    setSmsVerifying(true);

    try {
      const response = await api.post("/produtor/verificar-sms-n2", {
        code: smsCode,
      });

      if (!response.data?.valid) {
        toast.error("Codigo invalido ou expirado.");
        return;
      }

      setSmsPhase("verified");
      toast.success("Telefone verificado com sucesso.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Nao foi possivel validar o codigo."));
    } finally {
      setSmsVerifying(false);
    }
  };

  const handleResendSms = async () => {
    if (resendTimer > 0) return;

    setSmsSending(true);

    try {
      await api.post("/produtor/enviar-sms-n2");
      setResendTimer(60);
      toast.success("Novo codigo enviado.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Nao foi possivel reenviar o SMS."));
    } finally {
      setSmsSending(false);
    }
  };

  const handleSubmit = async () => {
    if (!aceitouTermos) return;

    setLoading(true);

    try {
      const response = await api.post("/auth/ativar-produtor", {
        nomeArtistico: nomeArtistico.trim(),
        telefone: telefoneDigits,
        aceitouTermos,
      });

      signIn(response.data.user);
      window.location.href = "/dashboard/eventos";
    } catch (error) {
      toast.error(getErrorMessage(error, "Nao foi possivel ativar a conta."));
    } finally {
      setLoading(false);
    }
  };

  if (alreadyProducer) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
            <Check className="text-green-600" size={26} />
          </div>
          <h1 className="mt-5 text-2xl font-bold text-gray-900">
            Conta de produtor ja ativada
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Sua conta ja esta habilitada para acessar o painel do produtor.
          </p>
          <Link href="/dashboard/eventos" className="mt-6 inline-flex w-full">
            <Button className="h-11 w-full bg-violet-600 text-white hover:bg-violet-700">
              Ir para meus eventos
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
          <Image
            src="/logo.svg"
            alt="Nokta"
            width={120}
            height={40}
            className="mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-gray-900">
            Ative sua conta de produtor
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Complete os dados abaixo para liberar o painel.
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
              <span
                className={`text-xs ${
                  index === step ? "font-medium text-gray-900" : "text-gray-400"
                }`}
              >
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
                <Mic2 className="text-violet-600" size={22} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Como voce quer aparecer?
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Use seu nome artistico, empresa ou o nome que seu publico conhece.
                </p>
              </div>
              <div className="space-y-2">
                <label htmlFor="nomeArtistico" className="block text-sm font-medium text-gray-700">
                  Nome artistico ou empresa
                </label>
                <Input
                  id="nomeArtistico"
                  value={nomeArtistico}
                  onChange={(event) => setNomeArtistico(event.target.value)}
                  placeholder="Ex: DJ Marcos, Agencia Nova"
                  className="h-11"
                  autoFocus
                />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-100">
                <Phone className="text-violet-600" size={22} />
              </div>

              {smsPhase === "input" && (
                <>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      Verifique seu telefone
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                      Esse numero sera usado nas etapas de seguranca da conta.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="telefone" className="block text-sm font-medium text-gray-700">
                      Celular
                    </label>
                    <Input
                      id="telefone"
                      type="tel"
                      value={telefone}
                      onChange={(event) => setTelefone(formatPhone(event.target.value))}
                      placeholder="(11) 99999-9999"
                      className="h-11"
                      autoFocus
                    />
                  </div>
                  <Button
                    onClick={handleSendSms}
                    disabled={smsSending || telefoneDigits.length < 10}
                    className="h-11 w-full bg-violet-600 text-white hover:bg-violet-700 disabled:cursor-not-allowed"
                  >
                    {smsSending ? "Enviando..." : "Enviar codigo por SMS"}
                  </Button>
                </>
              )}

              {smsPhase === "code" && (
                <>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Digite o codigo</h2>
                    <p className="mt-1 text-sm text-gray-500">
                      Enviamos um codigo para <span className="font-medium text-gray-700">{formatPhone(telefoneDigits)}</span>.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="smsCode" className="block text-sm font-medium text-gray-700">
                      Codigo SMS
                    </label>
                    <Input
                      id="smsCode"
                      type="text"
                      inputMode="numeric"
                      maxLength={8}
                      value={smsCode}
                      onChange={(event) => setSmsCode(event.target.value.replace(/\D/g, ""))}
                      placeholder="000000"
                      className="h-11 text-center font-mono text-xl tracking-widest"
                      autoFocus
                    />
                  </div>
                  <Button
                    onClick={handleVerifySms}
                    disabled={smsVerifying || smsCode.length < 4}
                    className="h-11 w-full bg-violet-600 text-white hover:bg-violet-700 disabled:cursor-not-allowed"
                  >
                    {smsVerifying ? "Verificando..." : "Confirmar codigo"}
                  </Button>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <button
                      type="button"
                      onClick={() => {
                        setSmsPhase("input");
                        setSmsCode("");
                      }}
                      className="underline hover:text-gray-700"
                    >
                      Trocar numero
                    </button>
                    <button
                      type="button"
                      onClick={handleResendSms}
                      disabled={resendTimer > 0 || smsSending}
                      className="flex items-center gap-1 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <RefreshCw size={12} />
                      {resendTimer > 0 ? `Reenviar em ${resendTimer}s` : "Reenviar codigo"}
                    </button>
                  </div>
                </>
              )}

              {smsPhase === "verified" && (
                <div className="flex flex-col items-center gap-4 py-4 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                    <Check className="text-green-600" size={28} />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      Telefone verificado
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">{formatPhone(telefoneDigits)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSmsPhase("input")}
                    className="text-xs text-gray-500 underline hover:text-gray-700"
                  >
                    Alterar numero
                  </button>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-100">
                <FileText className="text-violet-600" size={22} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Termos do produtor</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Aceite os termos para concluir a ativacao inicial.
                </p>
              </div>
              <div className="max-h-44 space-y-2 overflow-y-auto rounded-xl border border-gray-200 p-4 text-xs text-gray-600">
                <p><strong>1.</strong> Contas nivel 1 podem criar eventos gratuitos e rascunhos.</p>
                <p><strong>2.</strong> Para vender eventos pagos, a conta precisa passar pela verificacao adicional.</p>
                <p><strong>3.</strong> O produtor responde pela veracidade das informacoes publicadas.</p>
                <p><strong>4.</strong> A plataforma pode remover eventos que violem os termos de uso.</p>
                <p>
                  <strong>5.</strong> Ao continuar, voce concorda com a{" "}
                  <Link href="/privacidade" target="_blank" className="underline">
                    Politica de Privacidade
                  </Link>{" "}
                  e os{" "}
                  <Link href="/termos" target="_blank" className="underline">
                    Termos de Servico
                  </Link>
                  .
                </p>
              </div>
              <label htmlFor="termos" className="flex cursor-pointer items-start gap-3">
                <Checkbox
                  id="termos"
                  checked={aceitouTermos}
                  onCheckedChange={(value) => setAceitouTermos(Boolean(value))}
                  className="mt-0.5 shrink-0"
                />
                <span className="text-sm leading-relaxed text-gray-700">
                  Li e aceito os termos da conta de produtor da Nokta Tickets.
                </span>
              </label>
            </div>
          )}

          <div className="mt-8 flex gap-3">
            {step > 0 && (
              <Button
                variant="outline"
                onClick={() => setStep((currentStep) => currentStep - 1)}
                className="h-11 flex-1"
              >
                <ChevronLeft size={16} className="mr-1" />
                Voltar
              </Button>
            )}

            {step < STEPS.length - 1 ? (
              <Button
                onClick={() => setStep((currentStep) => currentStep + 1)}
                disabled={!canAdvance()}
                className="h-11 flex-1 bg-violet-600 text-white hover:bg-violet-700 disabled:cursor-not-allowed"
              >
                Continuar
                <ChevronRight size={16} className="ml-1" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!canAdvance() || loading}
                className="h-11 flex-1 bg-violet-600 text-white hover:bg-violet-700 disabled:cursor-not-allowed"
              >
                {loading ? "Ativando..." : "Ativar conta de produtor"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
