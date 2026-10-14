"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import api, { getErrorMessage } from "@/lib/axios";
import { formatCnpj, formatCpf, maskPhone, normalizeDigits, validateCnpj, validateCpf, validatePixKey } from "@/lib/br-data";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ChoiceCard } from "@/components/ui/choice-card";
import { DetailGrid, DetailItem, BooleanValue } from "@/components/ui/detail-list";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge, type Tone } from "@/components/ui/badge";

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
  solicitacaoAtual: { id: number; status: SolicitationStatus; tipo: string; createdAt: string; dataResposta: string | null } | null;
};

const NIVEL_INFO: Record<number, { label: string; tone: Tone; description: string }> = {
  1: { label: "Nível 1", tone: "neutral", description: "Pode criar eventos gratuitos." },
  2: { label: "Nível 2", tone: "info", description: "Pode criar eventos pagos e receber repasses." },
  3: { label: "Nível 3", tone: "brand", description: "Conta confiável com benefícios extras." },
};

const SOLICITATION_INFO: Record<SolicitationStatus, { label: string; tone: Tone; description: string }> = {
  1: { label: "Em análise", tone: "warning", description: "Os dados ficam bloqueados até a resposta da revisão manual." },
  2: { label: "Aprovada", tone: "success", description: "Sua conta está liberada para operação paga." },
  3: { label: "Rejeitada", tone: "danger", description: "Revise os dados e envie uma nova solicitação de verificação." },
};

function formatDate(value?: string | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
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
      setError(getErrorMessage(loadError, "Não foi possível carregar os dados financeiros."));
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
    if (tipoPessoa === "PF" && !cpfValid) return toast.error("Informe um CPF válido.");
    if (tipoPessoa === "PJ" && !cnpjValid) return toast.error("Informe um CNPJ válido.");
    if (!pixValid) return toast.error("Informe uma chave PIX válida.");

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
      toast.success("Dados financeiros salvos");
    } catch (saveError) {
      toast.error(getErrorMessage(saveError, "Não foi possível salvar os dados."));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <PageHeader back="/dashboard/eventos" title="Dados financeiros" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-32 rounded-card" />
          <Skeleton className="h-32 rounded-card" />
        </div>
        <Skeleton className="h-80 rounded-card" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <PageHeader back="/dashboard/eventos" title="Dados financeiros" />
        <ErrorState title="Não foi possível carregar os dados financeiros" description={error} onRetry={() => void load()} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <PageHeader back="/dashboard/eventos" title="Dados financeiros" />
        <EmptyState icon="wallet" title="Nenhum dado financeiro encontrado" description="Cadastre seus documentos e a chave PIX para liberar os recursos da conta." action={<Button variant="outline" leftIcon="refresh" onClick={() => void load()}>Atualizar</Button>} />
      </div>
    );
  }

  const nivelInfo = NIVEL_INFO[data.nivelProdutor ?? 1] ?? NIVEL_INFO[1];
  const solicitationInfo = data.solicitacaoAtual ? SOLICITATION_INFO[data.solicitacaoAtual.status] : null;
  const canRequestVerification = (data.nivelProdutor ?? 1) < 2 && !pendingSolicitation && Boolean(data.telefoneVerificado);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader back="/dashboard/eventos" title="Dados financeiros" description="Documento, PIX, taxa e janela de saque da sua conta." badge={<StatusBadge tone={nivelInfo.tone}>{nivelInfo.label}</StatusBadge>} />

      {!data.telefoneVerificado ? (
        <Callout
          tone="warning"
          title="Confirme o telefone antes de pedir a verificação"
          action={
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/eventos/verificar-conta">Ir para verificação</Link>
            </Button>
          }
        >
          A verificação de conta exige um celular confirmado por SMS.
        </Callout>
      ) : null}

      {canRequestVerification ? (
        <Callout
          tone="info"
          icon="shield"
          title="Sua conta ainda não está liberada para eventos pagos"
          action={
            <Button asChild size="sm">
              <Link href="/dashboard/eventos/verificar-conta">Solicitar verificação</Link>
            </Button>
          }
        >
          Leva poucos minutos: documento, chave PIX e aceite dos termos.
        </Callout>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="fade-up">
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <Icon name="shield" size={15} className="text-brand" />
                Conta e regras
              </CardTitle>
              <CardDescription>{nivelInfo.description}</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <DetailGrid columns={2}>
              <DetailItem label="Você recebe" icon="sack-dollar" value="Valor integral do ingresso" />
              <DetailItem label="Janela de saque" icon="clock" value={`${data.withdrawalDelayDays} dias após o evento`} />
              <DetailItem label="Telefone" icon="phone" value={data.telefone ? maskPhone(data.telefone) : null} />
              <DetailItem label="Telefone verificado" icon="check-circle">
                <BooleanValue value={data.telefoneVerificado} yes="Verificado por SMS" no="Ainda não confirmado" />
              </DetailItem>
            </DetailGrid>
            <p className="mt-3 text-caption text-muted-foreground">As taxas de serviço e processamento são pagas pelo comprador, por cima do ingresso.</p>
          </CardContent>
        </Card>

        <Card className="fade-up" style={{ ["--i" as string]: 1 } as never}>
          <CardHeader>
            <div>
              <CardTitle>Verificação da conta</CardTitle>
              <CardDescription>Status da última solicitação.</CardDescription>
            </div>
            {solicitationInfo ? <StatusBadge tone={solicitationInfo.tone}>{solicitationInfo.label}</StatusBadge> : null}
          </CardHeader>
          <CardContent className="pt-4">
            {solicitationInfo ? (
              <Callout tone={solicitationInfo.tone} title={solicitationInfo.label}>
                {solicitationInfo.description}
                {data.solicitacaoAtual?.createdAt ? <span className="mt-1 block text-caption tnum">Enviada em {formatDate(data.solicitacaoAtual.createdAt)}</span> : null}
                {data.solicitacaoAtual?.dataResposta ? <span className="block text-caption tnum">Respondida em {formatDate(data.solicitacaoAtual.dataResposta)}</span> : null}
              </Callout>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhuma solicitação aberta no momento.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="fade-up" style={{ ["--i" as string]: 2 } as never}>
        <form onSubmit={handleSave} className="contents">
          <CardHeader>
            <div>
              <CardTitle>Documento e chave PIX</CardTitle>
              <CardDescription>{pendingSolicitation ? "Bloqueado enquanto a verificação estiver em análise." : "É pra essa chave que os saques vão."}</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <Field label="Tipo de pessoa">
              <div role="radiogroup" className="grid grid-cols-2 gap-3">
                <ChoiceCard selected={tipoPessoa === "PF"} onSelect={() => setTipoPessoa("PF")} disabled={pendingSolicitation} icon="user" title="Pessoa física" description="CPF" />
                <ChoiceCard selected={tipoPessoa === "PJ"} onSelect={() => setTipoPessoa("PJ")} disabled={pendingSolicitation} icon="building" title="Pessoa jurídica" description="CNPJ" />
              </div>
            </Field>

            {tipoPessoa === "PF" ? (
              <Field label="CPF" htmlFor="cpf" error={cpf && !cpfValid ? "CPF inválido." : undefined} hint={cpf && cpfValid ? "CPF válido." : undefined} className="sm:max-w-sm">
                <Input id="cpf" value={cpf} onChange={(event) => setCpf(formatCpf(event.target.value))} placeholder="000.000.000-00" inputMode="numeric" maxLength={14} disabled={pendingSolicitation} aria-invalid={Boolean(cpf && !cpfValid)} />
              </Field>
            ) : (
              <Field label="CNPJ" htmlFor="cnpj" error={cnpj && !cnpjValid ? "CNPJ inválido." : undefined} hint={cnpj && cnpjValid ? "CNPJ válido." : undefined} className="sm:max-w-sm">
                <Input id="cnpj" value={cnpj} onChange={(event) => setCnpj(formatCnpj(event.target.value))} placeholder="00.000.000/0000-00" inputMode="numeric" maxLength={18} disabled={pendingSolicitation} aria-invalid={Boolean(cnpj && !cnpjValid)} />
              </Field>
            )}

            <Field label="Chave PIX" htmlFor="chavePix" error={chavePix && !pixValid ? "Chave PIX inválida." : undefined} hint={chavePix && pixValid ? "Chave PIX válida." : "CPF, CNPJ, e-mail, telefone ou chave aleatória."} className="sm:max-w-md">
              <Input id="chavePix" leftIcon="pix" value={chavePix} onChange={(event) => setChavePix(event.target.value)} placeholder="Sua chave PIX" disabled={pendingSolicitation} aria-invalid={Boolean(chavePix && !pixValid)} />
            </Field>
          </CardContent>
          <CardFooter className="justify-end">
            <Button asChild variant="ghost">
              <Link href="/dashboard/eventos">Voltar</Link>
            </Button>
            <Button type="submit" leftIcon="save" loading={saving} disabled={pendingSolicitation}>
              Salvar dados
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
