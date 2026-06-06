"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageState } from "@/components/ui/page-state";
import api, { getErrorMessage } from "@/lib/axios";
import {
  formatCnpj,
  formatCpf,
  maskPhone,
  normalizeDigits,
  validateCnpj,
  validateCpf,
  validatePixKey,
} from "@/lib/br-data";
import { toast } from "@/lib/toast";
import { AlertCircle, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";

type TipoPessoa = "PF" | "PJ";
type SolicitationStatus = 1 | 2 | 3;

type ProducerFinanceData = {
  tipoPessoa: TipoPessoa | null;
  cpf: string | null;
  cnpj: string | null;
  chavePix: string | null;
  telefone: string | null;
  telefoneVerificado: boolean | null;
  nivelProdutor: number | null;
  platformFeePercent: number;
  withdrawalDelayDays: number;
  solicitacaoAtual: {
    id: number;
    status: SolicitationStatus;
    tipo: string;
    createdAt: string;
    dataResposta: string | null;
  } | null;
};

const NIVEL_INFO: Record<number, { label: string; color: string; description: string }> = {
  1: {
    label: "Nivel 1",
    color: "bg-gray-100 text-gray-700",
    description: "Pode criar eventos gratuitos.",
  },
  2: {
    label: "Nivel 2",
    color: "bg-blue-100 text-blue-700",
    description: "Pode criar eventos pagos e receber repasses.",
  },
  3: {
    label: "Nivel 3",
    color: "bg-purple-100 text-purple-700",
    description: "Conta confiavel com beneficios extras.",
  },
};

const SOLICITATION_INFO: Record<
  SolicitationStatus,
  { label: string; tone: string; description: string }
> = {
  1: {
    label: "Em analise",
    tone: "border-amber-200 bg-amber-50 text-amber-800",
    description: "Os dados estao bloqueados ate a resposta da revisao manual.",
  },
  2: {
    label: "Aprovada",
    tone: "border-green-200 bg-green-50 text-green-800",
    description: "Sua conta esta liberada para operacao paga.",
  },
  3: {
    label: "Rejeitada",
    tone: "border-red-200 bg-red-50 text-red-800",
    description: "Revise os dados e envie uma nova solicitacao de verificacao.",
  },
};

function formatDate(value?: string | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function DadosFinanceirosPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ProducerFinanceData | null>(null);

  const [tipoPessoa, setTipoPessoa] = useState<TipoPessoa>("PF");
  const [cpf, setCpf] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [chavePix, setChavePix] = useState("");

  async function load() {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get<ProducerFinanceData>("/produtor/dados-financeiros");
      const payload = response.data;
      setData(payload);
      setTipoPessoa(payload.tipoPessoa ?? "PF");
      setCpf(payload.cpf ? formatCpf(payload.cpf) : "");
      setCnpj(payload.cnpj ? formatCnpj(payload.cnpj) : "");
      setChavePix(payload.chavePix ?? "");
    } catch (loadError) {
      setData(null);
      setError(
        getErrorMessage(loadError, "Nao foi possivel carregar os dados financeiros.")
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const cpfValid = useMemo(() => validateCpf(cpf), [cpf]);
  const cnpjValid = useMemo(() => validateCnpj(cnpj), [cnpj]);
  const pixValid = useMemo(() => validatePixKey(chavePix), [chavePix]);
  const pendingSolicitation = data?.solicitacaoAtual?.status === 1;

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (tipoPessoa === "PF" && !cpfValid) {
      toast.error("Informe um CPF valido.");
      return;
    }

    if (tipoPessoa === "PJ" && !cnpjValid) {
      toast.error("Informe um CNPJ valido.");
      return;
    }

    if (!pixValid) {
      toast.error("Informe uma chave PIX valida.");
      return;
    }

    setSaving(true);
    try {
      const response = await api.put<ProducerFinanceData>("/produtor/dados-financeiros", {
        tipoPessoa,
        cpf: tipoPessoa === "PF" ? normalizeDigits(cpf) : undefined,
        cnpj: tipoPessoa === "PJ" ? normalizeDigits(cnpj) : undefined,
        chavePix: chavePix.trim(),
      });

      const payload = response.data;
      setData(payload);
      setTipoPessoa(payload.tipoPessoa ?? "PF");
      setCpf(payload.cpf ? formatCpf(payload.cpf) : "");
      setCnpj(payload.cnpj ? formatCnpj(payload.cnpj) : "");
      setChavePix(payload.chavePix ?? "");
      toast.success("Dados financeiros salvos.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Nao foi possivel salvar os dados."));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          Carregando dados financeiros...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <PageState
        title="Nao foi possivel carregar os dados financeiros"
        description={error}
        icon={<AlertCircle className="h-8 w-8 text-red-500" />}
        actionLabel="Tentar novamente"
        onAction={() => void load()}
      />
    );
  }

  if (!data) {
    return (
      <PageState
        title="Nenhum dado financeiro encontrado"
        description="Cadastre seus documentos e a chave PIX para liberar os recursos da conta."
        actionLabel="Atualizar"
        onAction={() => void load()}
      />
    );
  }

  const nivelInfo = NIVEL_INFO[data.nivelProdutor ?? 1] ?? NIVEL_INFO[1];
  const solicitationInfo = data.solicitacaoAtual
    ? SOLICITATION_INFO[data.solicitacaoAtual.status]
    : null;
  const canRequestVerification =
    (data.nivelProdutor ?? 1) < 2 && !pendingSolicitation && Boolean(data.telefoneVerificado);

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dados financeiros</h1>
        <p className="mt-1 text-sm text-gray-500">
          Revise documento, PIX, taxa e janela de saque da sua conta.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="flex items-start gap-3 p-4">
          <ShieldCheck className="mt-0.5 h-8 w-8 text-violet-600" />
          <div>
            <Badge className={`${nivelInfo.color} border-0 text-xs`}>{nivelInfo.label}</Badge>
            <p className="mt-2 text-sm text-gray-700">{nivelInfo.description}</p>
          </div>
        </Card>

        <Card className="p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Regras atuais da conta
          </p>
          <div className="mt-3 space-y-2 text-sm text-gray-700">
            <p>Taxa da plataforma: <strong>{data.platformFeePercent}%</strong></p>
            <p>Janela minima para saque: <strong>{data.withdrawalDelayDays} dias</strong></p>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Verificacao de telefone
          </p>
          <div className="mt-3 flex items-start gap-3">
            {data.telefoneVerificado ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="mt-0.5 h-5 w-5 text-amber-600" />
            )}
            <div className="text-sm text-gray-700">
              <p>
                {data.telefone ? maskPhone(data.telefone) : "Nenhum telefone cadastrado"}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {data.telefoneVerificado
                  ? "Telefone verificado por SMS."
                  : "Telefone ainda precisa ser confirmado por SMS."}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Status da solicitacao
          </p>
          {solicitationInfo ? (
            <div className={`mt-3 rounded-2xl border p-4 text-sm ${solicitationInfo.tone}`}>
              <p className="font-medium">{solicitationInfo.label}</p>
              <p className="mt-1">{solicitationInfo.description}</p>
              {data.solicitacaoAtual?.createdAt && (
                <p className="mt-2 text-xs">
                  Enviado em {formatDate(data.solicitacaoAtual.createdAt)}
                </p>
              )}
              {data.solicitacaoAtual?.dataResposta && (
                <p className="mt-1 text-xs">
                  Respondido em {formatDate(data.solicitacaoAtual.dataResposta)}
                </p>
              )}
            </div>
          ) : (
            <div className="mt-3 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
              Nenhuma solicitacao aberta no momento.
            </div>
          )}
        </Card>
      </div>

      {!data.telefoneVerificado && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Confirme o telefone antes de enviar sua verificacao de conta.
          <div className="mt-3">
            <Link href="/produtor/verificar-conta">
              <Button variant="outline" className="h-10 border-amber-300 bg-white text-amber-800">
                Ir para verificacao
              </Button>
            </Link>
          </div>
        </div>
      )}

      {canRequestVerification && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
          Sua conta ainda nao esta liberada para eventos pagos.
          <div className="mt-3">
            <Link href="/produtor/verificar-conta">
              <Button variant="outline" className="h-10 border-blue-300 bg-white text-blue-800">
                Solicitar verificacao
              </Button>
            </Link>
          </div>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-5 rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
        <div className="space-y-2">
          <Label>Tipo de pessoa</Label>
          <div className="grid grid-cols-2 gap-3">
            {(["PF", "PJ"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setTipoPessoa(value)}
                disabled={pendingSolicitation}
                className={`h-11 rounded-xl border font-medium text-sm transition-all ${
                  tipoPessoa === value
                    ? "border-violet-600 bg-violet-50 text-violet-700"
                    : "border-gray-200 bg-white text-gray-700"
                } disabled:cursor-not-allowed disabled:opacity-60`}
              >
                {value === "PF" ? "Pessoa fisica" : "Pessoa juridica"}
              </button>
            ))}
          </div>
        </div>

        {tipoPessoa === "PF" ? (
          <div className="space-y-2">
            <Label htmlFor="cpf">CPF</Label>
            <Input
              id="cpf"
              value={cpf}
              onChange={(event) => setCpf(formatCpf(event.target.value))}
              placeholder="000.000.000-00"
              inputMode="numeric"
              maxLength={14}
              disabled={pendingSolicitation}
            />
            {cpf && (
              <p className={`text-xs ${cpfValid ? "text-green-600" : "text-red-500"}`}>
                {cpfValid ? "CPF valido." : "CPF invalido."}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="cnpj">CNPJ</Label>
            <Input
              id="cnpj"
              value={cnpj}
              onChange={(event) => setCnpj(formatCnpj(event.target.value))}
              placeholder="00.000.000/0000-00"
              inputMode="numeric"
              maxLength={18}
              disabled={pendingSolicitation}
            />
            {cnpj && (
              <p className={`text-xs ${cnpjValid ? "text-green-600" : "text-red-500"}`}>
                {cnpjValid ? "CNPJ valido." : "CNPJ invalido."}
              </p>
            )}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="chavePix">Chave PIX</Label>
          <Input
            id="chavePix"
            value={chavePix}
            onChange={(event) => setChavePix(event.target.value)}
            placeholder="CPF, CNPJ, email, telefone ou chave aleatoria"
            disabled={pendingSolicitation}
          />
          {chavePix && (
            <p className={`text-xs ${pixValid ? "text-green-600" : "text-red-500"}`}>
              {pixValid ? "Chave PIX valida." : "Chave PIX invalida."}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href="/produtor/eventos" className="sm:flex-1">
            <Button type="button" variant="outline" className="h-11 w-full">
              Voltar ao painel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={saving || pendingSolicitation}
            className="h-11 sm:flex-1"
          >
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {saving ? "Salvando..." : "Salvar dados"}
          </Button>
        </div>
      </form>
    </div>
  );
}
