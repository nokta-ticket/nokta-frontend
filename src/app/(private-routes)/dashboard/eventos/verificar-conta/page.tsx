"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import api, { getErrorMessage } from "@/lib/axios";
import {
  formatCnpj,
  formatCpf,
  formatPhone,
  maskPhone,
  normalizeDigits,
  validateCnpj,
  validateCpf,
  validatePixKey,
} from "@/lib/br-data";
import { toast } from "@/lib/toast";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  Shield,
} from "lucide-react";

type TipoPessoa = "PF" | "PJ" | "";
type SolicitationStatus = 1 | 2 | 3;

type VerificationState = {
  solicitacao: {
    id: number;
    status: SolicitationStatus;
    tipo: string;
    createdAt: string;
    dataResposta: string | null;
  } | null;
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
  "Sou responsavel pelos pagamentos recebidos e por reembolsos de eventos cancelados.",
  "Entendo que fraude, uso ilicito ou tentativa de ocultar titularidade geram bloqueio permanente.",
  "Confirmo que documento e chave PIX pertencem a mim ou a minha empresa.",
];

function formatDate(value?: string | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function getInitialStep(params: {
  tipoPessoa: TipoPessoa;
  cpf: string;
  cnpj: string;
  chavePix: string;
  telefoneVerificado: boolean;
}) {
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
          setStep(
            getInitialStep({
              tipoPessoa: nextTipoPessoa,
              cpf: nextCpf,
              cnpj: nextCnpj,
              chavePix: nextPix,
              telefoneVerificado: nextVerified,
            }),
          );
        }
      } catch (error) {
        toast.error(getErrorMessage(error, "Nao foi possivel carregar a verificacao."));
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
      setSmsError("Digite um telefone valido com DDD.");
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
      toast.success("Telefone atualizado.");
    } catch (error) {
      setSmsError(getErrorMessage(error, "Nao foi possivel atualizar o telefone."));
    }
  };

  const sendSms = async () => {
    if (phoneDigits.length < 10) {
      setSmsError("Digite um telefone valido com DDD.");
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
      toast.success("Codigo enviado por SMS.");
    } catch (error) {
      setSmsError(getErrorMessage(error, "Nao foi possivel enviar o SMS."));
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
        setSmsError("Codigo incorreto ou expirado.");
        return;
      }
      setSmsVerified(true);
      toast.success("Telefone verificado com sucesso.");
    } catch (error) {
      setSmsError(getErrorMessage(error, "Nao foi possivel validar o codigo."));
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
      toast.error(getErrorMessage(error, "Nao foi possivel enviar a solicitacao."));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          Carregando verificacao...
        </div>
      </div>
    );
  }

  if (approved) {
    return (
      <div className="mx-auto max-w-xl px-4 py-10">
        <div className="rounded-3xl border border-green-200 bg-white p-8 shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="text-green-600" size={28} />
          </div>
          <h1 className="mt-5 text-2xl font-bold text-gray-900">Conta verificada</h1>
          <p className="mt-2 text-sm text-gray-500">
            Sua conta ja pode publicar eventos pagos e receber repasses.
          </p>
          {solicitacao?.dataResposta && (
            <p className="mt-4 text-xs text-gray-500">
              Aprovacao registrada em {formatDate(solicitacao.dataResposta)}.
            </p>
          )}
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Link href="/dashboard/eventos/dados-financeiros">
              <Button variant="outline" className="h-11 w-full">
                Revisar dados
              </Button>
            </Link>
            <Link href="/dashboard/financeiro">
              <Button className="h-11 w-full bg-violet-600 text-white hover:bg-violet-700">
                Ir para financeiro
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (pending) {
    return (
      <div className="mx-auto max-w-xl px-4 py-10">
        <div className="rounded-3xl border border-amber-200 bg-white p-8 shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
            <Shield className="text-amber-700" size={28} />
          </div>
          <h1 className="mt-5 text-2xl font-bold text-gray-900">Solicitacao em analise</h1>
          <p className="mt-2 text-sm text-gray-500">
            Seus dados foram enviados e estao aguardando revisao manual.
          </p>
          {solicitacao?.createdAt && (
            <p className="mt-4 text-xs text-gray-500">
              Enviado em {formatDate(solicitacao.createdAt)}.
            </p>
          )}
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Link href="/dashboard/eventos/dados-financeiros">
              <Button variant="outline" className="h-11 w-full">
                Ver dados financeiros
              </Button>
            </Link>
            <Link href="/dashboard/eventos">
              <Button className="h-11 w-full bg-violet-600 text-white hover:bg-violet-700">
                Voltar ao painel
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Verificar conta</h1>
        <p className="mt-1 text-sm text-gray-500">
          Conclua o cadastro financeiro para liberar eventos pagos.
        </p>
      </div>

      {rejected && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          Revise seus dados e envie uma nova solicitacao.
          {solicitacao?.dataResposta && (
            <span className="block pt-1 text-xs text-red-700">
              Ultima resposta em {formatDate(solicitacao.dataResposta)}.
            </span>
          )}
        </div>
      )}

      <div className="mb-8 flex items-center gap-2">
        {STEPS.map((label, index) => (
          <div key={label} className="flex flex-1 items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
                index < step
                  ? "bg-violet-600 text-white"
                  : index === step
                    ? "border-2 border-violet-600 bg-white text-violet-600"
                    : "border-2 border-gray-200 bg-white text-gray-400"
              }`}
            >
              {index < step ? <Check size={14} /> : index + 1}
            </div>
            <span className={`text-xs ${index === step ? "text-gray-900" : "text-gray-400"}`}>
              {label}
            </span>
            {index < STEPS.length - 1 && <div className="h-px flex-1 bg-gray-200" />}
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Tipo de pessoa</h2>
            <div className="grid grid-cols-2 gap-4">
              {(["PF", "PJ"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTipoPessoa(value)}
                  className={`rounded-2xl border-2 p-5 text-left transition-all ${
                    tipoPessoa === value
                      ? "border-violet-600 bg-violet-50"
                      : "border-gray-200 hover:border-violet-200"
                  }`}
                >
                  <p className="text-sm font-semibold text-gray-900">
                    {value === "PF" ? "Pessoa fisica" : "Pessoa juridica"}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">{value === "PF" ? "CPF" : "CNPJ"}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {tipoPessoa === "PF" ? "Informe seu CPF" : "Informe o CNPJ da empresa"}
            </h2>
            {tipoPessoa === "PF" ? (
              <div className="space-y-1.5">
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  id="cpf"
                  value={cpf}
                  onChange={(event) => setCpf(formatCpf(event.target.value))}
                  placeholder="000.000.000-00"
                  inputMode="numeric"
                  maxLength={14}
                />
                {cpf && (
                  <p className={`text-xs ${cpfValid ? "text-green-600" : "text-red-500"}`}>
                    {cpfValid ? "CPF valido." : "CPF invalido."}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input
                  id="cnpj"
                  value={cnpj}
                  onChange={(event) => setCnpj(formatCnpj(event.target.value))}
                  placeholder="00.000.000/0000-00"
                  inputMode="numeric"
                  maxLength={18}
                />
                {cnpj && (
                  <p className={`text-xs ${cnpjValid ? "text-green-600" : "text-red-500"}`}>
                    {cnpjValid ? "CNPJ valido." : "CNPJ invalido."}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Chave PIX</h2>
            <p className="text-sm text-gray-500">
              Use uma chave coerente com o documento informado acima.
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="chavePix">Chave PIX</Label>
              <Input
                id="chavePix"
                value={chavePix}
                onChange={(event) => setChavePix(event.target.value)}
                placeholder="CPF, CNPJ, email, telefone ou chave aleatoria"
              />
              {chavePix && (
                <p className={`text-xs ${pixValid ? "text-green-600" : "text-red-500"}`}>
                  {pixValid ? "Chave PIX valida." : "Chave PIX invalida."}
                </p>
              )}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Verifique seu celular</h2>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs text-gray-500">Numero atual</p>
              {editingPhone ? (
                <div className="mt-3 flex gap-2">
                  <Input
                    value={phoneInput}
                    onChange={(event) => setPhoneInput(formatPhone(event.target.value))}
                    placeholder="(11) 99999-9999"
                  />
                  <Button type="button" variant="outline" onClick={() => setEditingPhone(false)}>
                    Cancelar
                  </Button>
                  <Button type="button" onClick={savePhone}>
                    Salvar
                  </Button>
                </div>
              ) : (
                <div className="mt-2 flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-gray-900">
                    {phoneDigits ? maskPhone(phoneDigits) : "Nenhum telefone cadastrado"}
                  </p>
                  <Button type="button" variant="outline" onClick={() => setEditingPhone(true)}>
                    Alterar
                  </Button>
                </div>
              )}
            </div>

            {smsVerified ? (
              <div className="flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
                <CheckCircle2 size={18} className="shrink-0" />
                Telefone verificado e pronto para analise.
              </div>
            ) : (
              <div className="space-y-4 rounded-2xl border border-gray-200 p-4">
                {!smsSent ? (
                  <Button
                    type="button"
                    onClick={sendSms}
                    disabled={smsSending || editingPhone || phoneDigits.length < 10}
                    className="h-11 w-full bg-violet-600 text-white hover:bg-violet-700"
                  >
                    {smsSending ? "Enviando..." : "Enviar codigo por SMS"}
                  </Button>
                ) : (
                  <>
                    <div className="space-y-1.5">
                      <Label htmlFor="smsCode">Codigo de verificacao</Label>
                      <Input
                        id="smsCode"
                        value={smsCode}
                        onChange={(event) => void verifySms(event.target.value)}
                        placeholder="000000"
                        inputMode="numeric"
                        maxLength={6}
                      />
                    </div>
                    {smsVerifying && <p className="text-xs text-gray-500">Verificando codigo...</p>}
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          if (cooldown === 0) void sendSms();
                        }}
                        disabled={cooldown > 0 || smsSending}
                        className="flex items-center gap-1 text-violet-600 disabled:opacity-50"
                      >
                        <RefreshCw size={12} />
                        {cooldown > 0 ? `Reenviar em ${cooldown}s` : "Reenviar codigo"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSmsSent(false);
                          setSmsCode("");
                          setSmsError("");
                        }}
                        className="text-gray-500 underline"
                      >
                        Alterar fluxo
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {smsError && (
              <p className="flex items-center gap-1.5 text-xs text-red-500">
                <AlertCircle size={13} />
                {smsError}
              </p>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Confirme os termos</h2>
            <div className="space-y-3">
              {OBRIGACOES.map((text, index) => (
                <label
                  key={text}
                  className={`flex cursor-pointer items-start gap-3 rounded-2xl border-2 p-4 ${
                    checks[index] ? "border-violet-200 bg-violet-50" : "border-gray-200"
                  }`}
                >
                  <Checkbox
                    checked={checks[index]}
                    onCheckedChange={(value) =>
                      setChecks((current) => current.map((item, itemIndex) => (
                        itemIndex === index ? Boolean(value) : item
                      )))
                    }
                    className="mt-0.5 shrink-0"
                  />
                  <span className="text-sm text-gray-700">{text}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-500">
              Ao enviar, voce tambem concorda com os{" "}
              <Link href="/termos" target="_blank" className="text-violet-600 underline">
                Termos de Servico
              </Link>{" "}
              e a{" "}
              <Link href="/privacidade" target="_blank" className="text-violet-600 underline">
                Politica de Privacidade
              </Link>
              .
            </p>
          </div>
        )}

        <div className="mt-8 flex gap-3">
          {step > 0 && (
            <Button variant="outline" className="h-11 flex-1" onClick={() => setStep(step - 1)}>
              <ChevronLeft size={16} className="mr-1" />
              Voltar
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button
              className="h-11 flex-1 bg-violet-600 text-white hover:bg-violet-700"
              onClick={() => setStep(step + 1)}
              disabled={!canAdvance()}
            >
              Continuar
              <ChevronRight size={16} className="ml-1" />
            </Button>
          ) : (
            <Button
              className="h-11 flex-1 bg-violet-600 text-white hover:bg-violet-700"
              onClick={submit}
              disabled={!canAdvance() || submitting}
            >
              {submitting ? "Enviando..." : "Enviar para analise"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
