"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import api, { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import {
  AlertCircle,
  Calendar,
  Clock,
  DollarSign,
  Loader2,
  MapPin,
  TrendingUp,
} from "lucide-react";
import { useOrganizations } from "@/context/OrganizationContext";
import { PageContainer } from "../../_components/page/page-container";
import { PageHeader } from "../../_components/page/page-header";

type FinancialEvent = {
  evento: {
    id: number;
    nome: string;
    data: string;
    localidade: string | null;
    uf: string | null;
  };
  financeiro: {
    taxaPlataformaPercentual: number;
    diasMinimosParaSaque: number;
    totalArrecadado: number;
    totalTaxa: number;
    valorLiquido: number;
    totalSacado: number;
    saldoDisponivel: number;
    custodiaStatus: string;
    eventoOcorreu: boolean;
    saqueLiberado: boolean;
    saqueDisponivelEm: string;
    ultimoSaque: {
      id: number;
      status: string;
      amount: number;
      requestedAt: string;
      completedAt: string | null;
    } | null;
  };
};

const CUSTODY_INFO: Record<string, { label: string; tone: string; description: string }> = {
  em_custodia: {
    label: "Em custodia",
    tone: "bg-yellow-100 text-yellow-700",
    description: "O evento ainda nao liberou saque.",
  },
  disponivel_para_saque: {
    label: "Disponivel para saque",
    tone: "bg-green-100 text-green-700",
    description: "Voce pode solicitar o saque agora.",
  },
  saque_solicitado: {
    label: "Saque solicitado",
    tone: "bg-blue-100 text-blue-700",
    description: "Existe um saque pendente ou em processamento.",
  },
  pago: {
    label: "Pago",
    tone: "bg-gray-100 text-gray-700",
    description: "Todo o saldo liquido deste evento ja foi pago.",
  },
};

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("pt-BR");
}

/**
 * Bloco de Financeiro de Tickets — migrado de `/produtor/financeiro`
 * (Fase 5). Escopado pela organização ativa (`organizationId`), não mais
 * por `userId` — ver docs/platform/unified-navigation.md "Fase 5".
 */
export default function TicketsFinanceiroPage() {
  const { currentOrg } = useOrganizations();
  const [summary, setSummary] = useState<FinancialEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requestingEventId, setRequestingEventId] = useState<number | null>(null);

  async function fetchSummary() {
    if (!currentOrg) return;
    setLoading(true);
    setError(null);

    try {
      const response = await api.get<FinancialEvent[]>("/produtor/financeiro", {
        params: { organizationId: currentOrg.id },
      });
      setSummary(response.data ?? []);
    } catch (error) {
      setError(getErrorMessage(error, "Nao foi possivel carregar o resumo financeiro."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentOrg?.id]);

  async function handleRequestWithdrawal(eventId: number) {
    const confirmed = window.confirm(
      "Deseja solicitar o saque do saldo disponivel deste evento?",
    );

    if (!confirmed) {
      return;
    }

    setRequestingEventId(eventId);

    try {
      const response = await api.post(`/produtor/eventos/${eventId}/solicitar-saque`);
      toast.success(response.data?.message ?? "Saque solicitado com sucesso.");
      await fetchSummary();
    } catch (error) {
      toast.error(getErrorMessage(error, "Nao foi possivel solicitar o saque."));
    } finally {
      setRequestingEventId(null);
    }
  }

  const totals = useMemo(() => {
    return summary.reduce(
      (acc, item) => {
        acc.arrecadado += item.financeiro.totalArrecadado;
        acc.taxa += item.financeiro.totalTaxa;
        acc.liquido += item.financeiro.valorLiquido;
        acc.disponivel += item.financeiro.saldoDisponivel;
        return acc;
      },
      { arrecadado: 0, taxa: 0, liquido: 0, disponivel: 0 },
    );
  }, [summary]);

  if (!currentOrg) return null;

  return (
    <PageContainer>
      <PageHeader
        title="Financeiro — Tickets"
        description="Acompanhe arrecadação, saldo líquido e saques por evento desta organização."
      />

      {!loading && !error && summary.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-4">
          <Card className="p-4">
            <p className="text-xs text-gray-500">Total arrecadado</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              {formatCurrency(totals.arrecadado)}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-gray-500">Taxa total</p>
            <p className="mt-2 text-2xl font-bold text-orange-500">
              {formatCurrency(totals.taxa)}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-gray-500">Liquido total</p>
            <p className="mt-2 text-2xl font-bold text-violet-700">
              {formatCurrency(totals.liquido)}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-gray-500">Saldo disponivel</p>
            <p className="mt-2 text-2xl font-bold text-green-600">
              {formatCurrency(totals.disponivel)}
            </p>
          </Card>
        </div>
      )}

      {loading ? (
        <div className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="rounded-2xl border bg-card p-4 space-y-2">
                <div className="h-3 w-24 animate-pulse rounded bg-gray-200" />
                <div className="h-8 w-28 animate-pulse rounded bg-gray-200" />
              </div>
            ))}
          </div>
          <div className="rounded-2xl border bg-card p-4 space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200" />
                <div className="h-3 w-1/3 animate-pulse rounded bg-gray-200" />
                <div className="h-20 w-full animate-pulse rounded bg-gray-200" />
              </div>
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="mt-4 flex flex-col items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-6 py-12 text-center">
          <AlertCircle className="h-10 w-10 text-red-500" />
          <p className="text-sm text-red-700">{error}</p>
          <Button variant="outline" onClick={() => void fetchSummary()}>
            Tentar novamente
          </Button>
        </div>
      ) : summary.length === 0 ? (
        <div className="mt-4 flex flex-col items-center gap-3 rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center">
          <DollarSign className="h-16 w-16 text-gray-300" />
          <h2 className="text-lg font-semibold text-gray-900">Nenhuma venda encontrada</h2>
          <p className="max-w-md text-sm text-gray-500">
            Quando seus eventos tiverem pagamentos confirmados, o resumo financeiro aparecera aqui.
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {summary.map(({ evento, financeiro }) => {
            const custody = CUSTODY_INFO[financeiro.custodiaStatus] ?? CUSTODY_INFO.em_custodia;
            const canWithdraw = financeiro.custodiaStatus === "disponivel_para_saque";

            return (
              <Card key={evento.id} className="space-y-4 p-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{evento.nome}</h3>
                    <div className="mt-1 flex flex-wrap gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(evento.data)}
                      </span>
                      {evento.localidade && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {evento.localidade}, {evento.uf}
                        </span>
                      )}
                    </div>
                  </div>
                  <Badge className={`${custody.tone} border-0 text-xs`}>{custody.label}</Badge>
                </div>

                <div className="grid gap-4 rounded-2xl border border-gray-100 bg-gray-50 p-4 md:grid-cols-4">
                  <div>
                    <p className="text-xs text-gray-500">Arrecadado</p>
                    <p className="mt-1 font-semibold text-gray-900">
                      {formatCurrency(financeiro.totalArrecadado)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">
                      Taxa ({financeiro.taxaPlataformaPercentual}%)
                    </p>
                    <p className="mt-1 font-semibold text-orange-500">
                      {formatCurrency(financeiro.totalTaxa)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Liquido</p>
                    <p className="mt-1 font-semibold text-violet-700">
                      {formatCurrency(financeiro.valorLiquido)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Saldo disponivel</p>
                    <p className="mt-1 font-semibold text-green-600">
                      {formatCurrency(financeiro.saldoDisponivel)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 text-sm text-gray-600">
                  <p>{custody.description}</p>
                  <p className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    Prazo minimo de saque: {financeiro.diasMinimosParaSaque} dias
                  </p>
                  <p className="text-xs text-gray-500">
                    Saque disponivel em: {formatDate(financeiro.saqueDisponivelEm)}
                  </p>
                  {financeiro.ultimoSaque && (
                    <p className="text-xs text-gray-500">
                      Ultimo saque: {formatDate(financeiro.ultimoSaque.requestedAt)} - status{" "}
                      <strong>{financeiro.ultimoSaque.status}</strong>
                    </p>
                  )}
                </div>

                {canWithdraw && (
                  <div className="flex justify-end">
                    <Button
                      onClick={() => void handleRequestWithdrawal(evento.id)}
                      disabled={requestingEventId === evento.id}
                    >
                      {requestingEventId === evento.id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <TrendingUp className="mr-2 h-4 w-4" />
                      )}
                      Solicitar saque
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
}
