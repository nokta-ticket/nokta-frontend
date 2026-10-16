"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import api, { getErrorMessage } from "@/lib/axios";
import { formatCnpj, formatCpf, formatPhone, maskPhone, normalizeDigits, validateCnpj, validateCpf, validatePixKey } from "@/lib/br-data";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ChoiceCard } from "@/components/ui/choice-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Stepper, type StepperStep } from "@/components/ui/stepper";

type TipoPessoa = "PF" | "PJ" | "";
type SolicitationStatus = 1 | 2 | 3;

type VerificationState = {
  solicitacao: { id: number; status: SolicitationStatus; tipo: string; createdAt: string; dataResposta: string | null } | null;
  dadosAtuais: {
    tipoPessoa: "PF" | "PJ" | null;
    cpf: string | null;
    cnpj: string | null;
    chavePix: string | null;
    telefone: string | null;
    telefoneVerificado: boolean | null;
    nivelProdutor: number | null;
  };
};

const STEPS = ["Tipo", "Documento", "PIX", "Celular", "Termos"];
const OBRIGACOES = [
  "Sou responsável pelos pagamentos recebidos e por reembolsos de eventos cancelados.",
  "Entendo que fraude, uso ilícito ou tentativa de ocultar titularidade geram bloqueio permanente.",
  "Confirmo que documento e chave PIX pertencem a mim ou à minha empresa.",
];

function formatDate(value?: string | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

function getInitialStep(params: { tipoPessoa: TipoPessoa; cpf: string; cnpj: string; chavePix: string; telefoneVerificado: boolean }) {
  if (!params.tipoPessoa) return 0;
  if (params.tipoPessoa === "PF" && !validateCpf(params.cpf)) return 1;
  if (params.tipoPessoa === "PJ" && !validateCnpj(params.cnpj)) return 1;
  if (!validatePixKey(params.chavePix)) return 2;
  if (!params.telefoneVerificado) return 3;
  return 4;
}

export default function VerificarContaPage() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [solicitacao, setSolicitacao] = useState<VerificationState["solicitacao"]>(null);

  const [tipoPessoa, setTipoPessoa] = useState<TipoPessoa>("");
  const [cpf, setCpf] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [chavePix, setChavePix] = useState("");
  const [checks, setChecks] = useState([false, false, false]);

  const [phoneInput, setPhoneInput] = useState("");
  const [editingPhone, setEditingPhone] = useState(false);
  const [smsSent, setSmsSent] = useState(false);
  const [smsCode, setSmsCode] = useState("");
  const [smsError, setSmsError] = useState("");
  const [smsSending, setSmsSending] = useState(false);
  const [smsVerifying, setSmsVerifying] = useState(false);
  const [smsVerified, setSmsVerified] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const cpfValid = useMemo(() => validateCpf(cpf), [cpf]);
  const cnpjValid = useMemo(() => validateCnpj(cnpj), [cnpj]);
  const pixValid = useMemo(() => validatePixKey(chavePix), [chavePix]);
  const phoneDigits = useMemo(() => normalizeDigits(phoneInput).slice(0, 11), [phoneInput]);
  const allChecks = checks.every(Boolean);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const response = await api.get<VerificationState>("/produtor/minha-verificacao");
        const current = response.data.dadosAtuais;
        const nextTipoPessoa = (current.tipoPessoa ?? "") as TipoPessoa;
        const nextCpf = current.cpf ? formatCpf(current.cpf) : "";
        const nextCnpj = current.cnpj ? formatCnpj(current.cnpj) : "";
        const nextPix = current.chavePix ?? user?.chavePix ?? "";
        const nextPhone = formatPhone(current.telefone ?? user?.telefone ?? "");
        const nextVerified = Boolean(current.telefoneVerificado ?? user?.telefoneVerificado);

        setSolicitacao(response.data.solicitacao);
        setTipoPessoa(nextTipoPessoa);
        setCpf(nextCpf);
        setCnpj(nextCnpj);
        setChavePix(nextPix);
        setPhoneInput(nextPhone);
        setSmsVerified(nextVerified);
        setSmsSent(nextVerified);
        setEditingPhone(false);
        setSmsCode("");
        setSmsError("");

        if (!response.data.solicitacao || response.data.solicitacao.status === 3) {
          setStep(getInitialStep({ tipoPessoa: nextTipoPessoa, cpf: nextCpf, cnpj: nextCnpj, chavePix: nextPix, telefoneVerificado: nextVerified }));
        }
      } catch (error) {
        toast.error(getErrorMessage(error, "Não foi possível carregar a verificação."));
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [user]);

  const startCooldown = (seconds = 60) => {
    setCooldown(seconds);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCooldown((current) => {
        if (current <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
  };

  const canAdvance = () => {
    if (step === 0) return tipoPessoa !== "";
    if (step === 1) return tipoPessoa === "PF" ? cpfValid : cnpjValid;
    if (step === 2) return pixValid;
    if (step === 3) return smsVerified;
    if (step === 4) return allChecks;
    return false;
  };

  const pending = solicitacao?.status === 1 || submitted;
  const approved = solicitacao?.status === 2;
  const rejected = solicitacao?.status === 3;

  const savePhone = async () => {
    if (phoneDigits.length < 10) {
      setSmsError("Digite um telefone válido com DDD.");
      return;
    }
    try {
      await api.put("/produtor/atualizar-telefone-sms", { telefone: phoneDigits });
      setPhoneInput(formatPhone(phoneDigits));
      setEditingPhone(false);
      setSmsVerified(false);
      setSmsSent(false);
      setSmsCode("");
      setSmsError("");
      toast.success("Telefone atualizado");
    } catch (error) {
      setSmsError(getErrorMessage(error, "Não foi possível atualizar o telefone."));
    }
  };

  const sendSms = async () => {
    if (phoneDigits.length < 10) {
      setSmsError("Digite um telefone válido com DDD.");
      return;
    }
    setSmsSending(true);
    setSmsError("");
    try {
      await api.post("/produtor/enviar-sms-n2");
      setSmsSent(true);
      setSmsVerified(false);
      setSmsCode("");
      startCooldown(60);
      toast.success("Código enviado por SMS");
    } catch (error) {
      setSmsError(getErrorMessage(error, "Não foi possível enviar o SMS."));
    } finally {
      setSmsSending(false);
    }
  };

  const verifySms = async (value: string) => {
    const code = normalizeDigits(value).slice(0, 6);
    setSmsCode(code);
    setSmsVerified(false);
    setSmsError("");
    if (code.length < 6) return;
    setSmsVerifying(true);
    try {
      const response = await api.post("/produtor/verificar-sms-n2", { code });
      if (!response.data?.valid) {
        setSmsError("Código incorreto ou expirado.");
        return;
      }
      setSmsVerified(true);
      toast.success("Telefone verificado");
    } catch (error) {
      setSmsError(getErrorMessage(error, "Não foi possível validar o código."));
    } finally {
      setSmsVerifying(false);
    }
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      await api.post("/produtor/solicitar-verificacao", {
        tipoPessoa,
        cpf: tipoPessoa === "PF" ? normalizeDigits(cpf) : undefined,
        cnpj: tipoPessoa === "PJ" ? normalizeDigits(cnpj) : undefined,
        chavePix: chavePix.trim(),
        aceitouTermosFinanceiros: allChecks,
      });
      setSubmitted(true);
    } catch (error) {
      toast.error(getErrorMessage(error, "Não foi possível enviar a solicitação."));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <PageHeader back="/dashboard/eventos/dados-financeiros" title="Verificar conta" />
        <Skeleton className="h-20 rounded-card" />
        <Skeleton className="h-80 rounded-card" />
      </div>
    );
  }

  if (approved) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <PageHeader back="/dashboard/eventos/dados-financeiros" title="Verificar conta" />
        <EmptyState
          icon="check-circle"
          title="Conta verificada"
          description={`Sua conta já pode publicar eventos pagos e receber repasses.${solicitacao?.dataResposta ? ` Aprovação registrada em ${formatDate(solicitacao.dataResposta)}.` : ""}`}
          className="border-solid border-success-ring bg-callout-success"
          action={
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button asChild variant="outline">
                <Link href="/dashboard/eventos/dados-financeiros">Revisar dados</Link>
              </Button>
              <Button asChild>
                <Link href="/dashboard/financeiro">Ir para o financeiro</Link>
              </Button>
            </div>
          }
        />
      </div>
    );
  }

  if (pending) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <PageHeader back="/dashboard/eventos/dados-financeiros" title="Verificar conta" />
        <EmptyState
          icon="shield"
          title="Solicitação em análise"
          description={`Seus dados foram enviados e estão aguardando revisão manual.${solicitacao?.createdAt ? ` Enviado em ${formatDate(solicitacao.createdAt)}.` : ""}`}
          className="border-solid border-warning-ring bg-callout-warning"
          action={
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button asChild variant="outline">
                <Link href="/dashboard/eventos/dados-financeiros">Ver dados financeiros</Link>
              </Button>
              <Button asChild>
                <Link href="/dashboard/eventos">Voltar ao painel</Link>
              </Button>
            </div>
          }
        />
      </div>
    );
  }

  const steps: StepperStep[] = STEPS.map((label, index) => ({ label, status: index < step ? "done" : index === step ? "current" : "upcoming" }));

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-24 lg:pb-0">
      <PageHeader back="/dashboard/eventos/dados-financeiros" title="Verificar conta" description={`Etapa ${step + 1} de ${STEPS.length} · ${STEPS[step]}`} />

      {rejected ? (
        <Callout tone="danger" title="Solicitação rejeitada">
          Revise seus dados e envie uma nova solicitação.
          {solicitacao?.dataResposta ? <span className="block text-caption">Última resposta em {formatDate(solicitacao.dataResposta)}.</span> : null}
        </Callout>
      ) : null}

      <Stepper steps={steps} orientation="horizontal" className="rounded-card border border-border bg-surface px-5 pt-5 shadow-card md:py-5" />

      <Card key={step} className="route-enter">
        <CardHeader>
          <CardTitle>{step === 0 ? "Tipo de pessoa" : step === 1 ? (tipoPessoa === "PF" ? "Informe seu CPF" : "Informe o CNPJ da empresa") : step === 2 ? "Chave PIX" : step === 3 ? "Verifique seu celular" : "Confirme os termos"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {step === 0 && (
            <div role="radiogroup" className="grid grid-cols-2 gap-3">
              <ChoiceCard selected={tipoPessoa === "PF"} onSelect={() => setTipoPessoa("PF")} icon="user" title="Pessoa física" description="CPF" />
              <ChoiceCard selected={tipoPessoa === "PJ"} onSelect={() => setTipoPessoa("PJ")} icon="building" title="Pessoa jurídica" description="CNPJ" />
            </div>
          )}

          {step === 1 &&
            (tipoPessoa === "PF" ? (
              <Field label="CPF" htmlFor="cpf" error={cpf && !cpfValid ? "CPF inválido." : undefined} hint={cpf && cpfValid ? "CPF válido." : undefined} className="sm:max-w-sm">
                <Input id="cpf" value={cpf} onChange={(event) => setCpf(formatCpf(event.target.value))} placeholder="000.000.000-00" inputMode="numeric" maxLength={14} autoFocus aria-invalid={Boolean(cpf && !cpfValid)} />
              </Field>
            ) : (
              <Field label="CNPJ" htmlFor="cnpj" error={cnpj && !cnpjValid ? "CNPJ inválido." : undefined} hint={cnpj && cnpjValid ? "CNPJ válido." : undefined} className="sm:max-w-sm">
                <Input id="cnpj" value={cnpj} onChange={(event) => setCnpj(formatCnpj(event.target.value))} placeholder="00.000.000/0000-00" inputMode="numeric" maxLength={18} autoFocus aria-invalid={Boolean(cnpj && !cnpjValid)} />
              </Field>
            ))}

          {step === 2 && (
            <Field label="Chave PIX" htmlFor="chavePix" error={chavePix && !pixValid ? "Chave PIX inválida." : undefined} hint={chavePix && pixValid ? "Chave PIX válida." : "Use uma chave coerente com o documento informado: CPF, CNPJ, e-mail, telefone ou aleatória."} className="sm:max-w-md">
              <Input id="chavePix" leftIcon="pix" value={chavePix} onChange={(event) => setChavePix(event.target.value)} placeholder="Sua chave PIX" autoFocus aria-invalid={Boolean(chavePix && !pixValid)} />
            </Field>
          )}

          {step === 3 && (
            <>
              <div className="surface-inset rounded-xl p-4">
                <p className="text-micro font-semibold uppercase tracking-[0.08em] text-subtle-foreground">Número atual</p>
                {editingPhone ? (
                  <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                    <Input aria-label="Telefone" value={phoneInput} onChange={(event) => setPhoneInput(formatPhone(event.target.value))} placeholder="(11) 99999-9999" inputMode="numeric" autoFocus />
                    <div className="flex gap-2">
                      <Button type="button" variant="ghost" onClick={() => setEditingPhone(false)} className="h-11 md:h-10">
                        Cancelar
                      </Button>
                      <Button type="button" onClick={savePhone} className="h-11 md:h-10">
                        Salvar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-1.5 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-foreground tnum">{phoneDigits ? maskPhone(phoneDigits) : "Nenhum telefone cadastrado"}</p>
                    <Button type="button" variant="outline" size="sm" onClick={() => setEditingPhone(true)}>
                      Alterar
                    </Button>
                  </div>
                )}
              </div>

              {smsVerified ? (
                <Callout tone="success" title="Telefone verificado">
                  Pronto pra análise.
                </Callout>
              ) : !smsSent ? (
                <Button type="button" leftIcon="send" onClick={sendSms} loading={smsSending} disabled={editingPhone || phoneDigits.length < 10} className="h-11 w-full sm:w-auto md:h-10">
                  Enviar código por SMS
                </Button>
              ) : (
                <div className="space-y-3">
                  <Field label="Código de verificação" htmlFor="smsCode" hint={smsVerifying ? "Verificando código…" : "6 dígitos, enviados por SMS."} className="sm:max-w-xs">
                    <Input id="smsCode" value={smsCode} onChange={(event) => void verifySms(event.target.value)} placeholder="000000" inputMode="numeric" maxLength={6} autoFocus className="text-center font-mono text-lg tracking-[0.4em]" />
                  </Field>
                  <div className="flex items-center justify-between gap-3">
                    <Button type="button" variant="link" size="sm" leftIcon="refresh" disabled={cooldown > 0 || smsSending} onClick={() => cooldown === 0 && void sendSms()}>
                      {cooldown > 0 ? `Reenviar em ${cooldown}s` : "Reenviar código"}
                    </Button>
                    <Button
                      type="button"
                      variant="subtle"
                      size="sm"
                      onClick={() => {
                        setSmsSent(false);
                        setSmsCode("");
                        setSmsError("");
                      }}
                    >
                      Trocar número
                    </Button>
                  </div>
                </div>
              )}

              {smsError ? (
                <p role="alert" className="flex items-center gap-1.5 text-caption text-danger">
                  <Icon name="exclamation-circle" size={12} />
                  {smsError}
                </p>
              ) : null}
            </>
          )}

          {step === 4 && (
            <>
              <div className="space-y-2">
                {OBRIGACOES.map((text, index) => (
                  <label key={text} className={cn("flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors", checks[index] ? "border-brand-ring bg-brand-soft/60" : "surface-inset hover:border-border-strong")}>
                    <Checkbox checked={checks[index]} onCheckedChange={(value) => setChecks((current) => current.map((item, itemIndex) => (itemIndex === index ? Boolean(value) : item)))} className="mt-0.5 shrink-0" />
                    <span className="text-sm text-foreground">{text}</span>
                  </label>
                ))}
              </div>
              <p className="text-caption text-muted-foreground">
                Ao enviar, você também concorda com os{" "}
                <Link href="/termos" target="_blank" className="text-brand underline-offset-4 hover:underline">
                  Termos de Serviço
                </Link>{" "}
                e a{" "}
                <Link href="/privacidade" target="_blank" className="text-brand underline-offset-4 hover:underline">
                  Política de Privacidade
                </Link>
                .
              </p>
            </>
          )}
        </CardContent>
        <CardFooter className="fixed inset-x-0 bottom-0 z-30 justify-between border-t border-border bg-surface p-4 pb-safe shadow-2 lg:static lg:border-t lg:p-5 lg:shadow-none">
          <Button variant="ghost" leftIcon="arrow-left" disabled={step === 0} onClick={() => setStep(step - 1)} className="h-11 lg:h-10">
            Voltar
          </Button>
          {step < STEPS.length - 1 ? (
            <Button rightIcon="arrow-right" onClick={() => setStep(step + 1)} disabled={!canAdvance()} className="h-11 flex-1 sm:flex-none lg:h-10">
              Continuar
            </Button>
          ) : (
            <Button leftIcon="shield" onClick={submit} loading={submitting} disabled={!canAdvance()} className="h-11 flex-1 sm:flex-none lg:h-10">
              Enviar para análise
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
