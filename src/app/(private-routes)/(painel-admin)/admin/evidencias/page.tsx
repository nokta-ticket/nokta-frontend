"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  FileText,
  Search,
  Shield,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api, { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";

/* ---------- types ---------- */

interface SearchResult {
  ticketId: number;
  codigo: string;
  evento: string;
  comprador: string;
  data: string;
}

interface InvestigationData {
  resumo: {
    code: string;
    status: string;
    risco: string;
    evento: string;
    comprador: string;
    dataCompra: string;
    dataCheckin: string | null;
  };
  scoreDefesa: {
    total: number;
    maximo: number;
    nivel: string;
    itens: { evidencia: string; pontos: number; ativo: boolean }[];
  };
  veredito: {
    tipo: "defesa_recomendada" | "analisar_manualmente" | "alto_risco";
    motivos: string[];
  };
  evidenciasFavoraveis: { descricao: string; presente: boolean }[];
  identidade: {
    id: number;
    nome: string;
    email: string;
    cpf: string;
    telefone: string;
    telefoneVerificado: boolean;
    ativo: boolean;
    createdAt: string;
  };
  historicoUsuario: {
    diasConta: number;
    eventosComprados: number;
    eventosComparecidos: number;
    transferencias: number;
    revendas: number;
    chargebacksAnteriores: number;
  };
  compra: {
    pedidoCodigo: string;
    valor: number;
    status: string;
    dataPagamento: string;
    dataCriacao: string;
    quantidade: number;
    tipo: string;
    lote: string;
    transacoes: unknown[];
  };
  evidenciasTecnicas: {
    ips: { ip: string; data: string }[];
    fingerprints: { fingerprint: string; data: string }[];
  };
  evidenciasEntrega: {
    qrGerado: boolean;
    emailEnviado: boolean;
    whatsappEnviado: boolean;
    meusIngressosAcessado: boolean;
  };
  historicoPosse: {
    transfers: { de: string; para: string; data: string }[];
    resales: {
      vendedor: string;
      comprador: string;
      valor: number;
      status: string;
      data: string;
    }[];
  };
  checkin: {
    utilizado: boolean;
    dataHora: string | null;
    operadorId: number | null;
    ip: string | null;
    fingerprint: string | null;
    tentativasAntes: number;
  };
  timeline: {
    data: string;
    tipo: string;
    descricao: string;
    ator: string | null;
    ip: string | null;
    fingerprint: string | null;
  }[];
  indicadores: {
    tipo: string;
    severidade: "critico" | "alto" | "medio" | "baixo";
    descricao: string;
    valor: string;
  }[];
  integridade: { valid: boolean; total: number };
}

/* ---------- helpers ---------- */

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "---";
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function scoreColor(score: number): string {
  if (score >= 70) return "text-green-600 border-green-500";
  if (score >= 50) return "text-yellow-600 border-yellow-500";
  return "text-red-600 border-red-500";
}

function scoreLabel(score: number): string {
  if (score >= 80) return "Muito forte";
  if (score >= 70) return "Forte";
  if (score >= 50) return "Moderado";
  return "Fraco";
}

function scoreBg(score: number): string {
  if (score >= 70) return "bg-green-50";
  if (score >= 50) return "bg-yellow-50";
  return "bg-red-50";
}

function veredictoStyle(tipo: string) {
  switch (tipo) {
    case "defesa_recomendada":
      return { bg: "bg-green-50 border-green-200", text: "Defesa recomendada", icon: "🟢" };
    case "analisar_manualmente":
      return { bg: "bg-yellow-50 border-yellow-200", text: "Analisar manualmente", icon: "🟡" };
    case "alto_risco":
      return { bg: "bg-red-50 border-red-200", text: "Alto risco", icon: "🔴" };
    default:
      return { bg: "bg-gray-50 border-gray-200", text: tipo, icon: "⚪" };
  }
}

function timelineDotColor(tipo: string): string {
  const green = ["INGRESSO_VALIDADO", "ACCOUNT_ACTIVATED", "CODE_VALID"];
  const red = ["INGRESSO_VALIDACAO_FALHA", "INGRESSO_CANCELADO"];
  const violet = ["INGRESSO_CRIADO", "INGRESSO_COMPRA_PAGA"];
  const blue = ["INGRESSO_TRANSFERIDO", "INGRESSO_REVENDIDO"];

  if (green.includes(tipo)) return "bg-green-500";
  if (red.includes(tipo)) return "bg-red-500";
  if (violet.includes(tipo)) return "bg-violet-500";
  if (blue.includes(tipo)) return "bg-blue-500";
  return "bg-gray-400";
}

function severityColor(sev: string) {
  switch (sev) {
    case "critico":
      return "bg-red-100 text-red-800 border-red-300";
    case "alto":
      return "bg-orange-100 text-orange-800 border-orange-300";
    case "medio":
      return "bg-yellow-100 text-yellow-800 border-yellow-300";
    case "baixo":
      return "bg-gray-100 text-gray-700 border-gray-300";
    default:
      return "bg-gray-100 text-gray-700 border-gray-300";
  }
}

/* ---------- CollapsibleSection ---------- */

function CollapsibleSection({
  title,
  defaultOpen = false,
  borderColor = "border-l-violet-500",
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  borderColor?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={`rounded-xl border shadow-sm overflow-hidden border-l-4 ${borderColor}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-5 py-4 text-left font-semibold text-gray-800 hover:bg-gray-50 transition-colors"
      >
        <span>{title}</span>
        {open ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
      </button>
      {open && <div className="px-5 pb-5 pt-0">{children}</div>}
    </div>
  );
}

/* ---------- InfoCard ---------- */

function InfoCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-sm font-medium text-gray-800 break-words">{value}</p>
    </div>
  );
}

/* ========== PAGE ========== */

export default function EvidenciasPage() {
  const [view, setView] = useState<"search" | "investigation">("search");
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [data, setData] = useState<InvestigationData | null>(null);
  const [loadingInvestigation, setLoadingInvestigation] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* --- search --- */

  const doSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) return;
    setSearching(true);
    setSearched(true);
    try {
      const { data: res } = await api.get<SearchResult[]>(
        "/admin/evidencias/investigar",
        { params: { q: q.trim() } }
      );
      setResults(res);
    } catch (err) {
      toast.error(getErrorMessage(err, "Erro ao buscar evidencias."));
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  function handleSearchInput(value: string) {
    setSearchTerm(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length >= 2) {
      debounceRef.current = setTimeout(() => doSearch(value), 500);
    }
  }

  function handleSearchKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      doSearch(searchTerm);
    }
  }

  /* --- investigation --- */

  async function loadInvestigation(ticketId: number) {
    setSelectedTicketId(ticketId);
    setView("investigation");
    setLoadingInvestigation(true);
    try {
      const { data: res } = await api.get<InvestigationData>(
        `/admin/evidencias/ingresso/${ticketId}`
      );
      setData(res);
    } catch (err) {
      toast.error(getErrorMessage(err, "Erro ao carregar investigacao."));
      setData(null);
    } finally {
      setLoadingInvestigation(false);
    }
  }

  function backToSearch() {
    setView("search");
    setData(null);
    setSelectedTicketId(null);
  }

  /* --- PDF download --- */

  async function downloadDossie() {
    if (!selectedTicketId || !data) return;
    setDownloadingPdf(true);
    try {
      const res = await api.get(
        `/admin/evidencias/dossie/${selectedTicketId}`,
        { responseType: "blob" }
      );
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `dossie-${data.resumo.code}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Dossie baixado com sucesso.");
    } catch (err) {
      toast.error(getErrorMessage(err, "Erro ao gerar dossie PDF."));
    } finally {
      setDownloadingPdf(false);
    }
  }

  /* ---------- SEARCH VIEW ---------- */

  if (view === "search") {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield size={22} className="text-violet-600" />
            <h1 className="text-2xl font-bold text-gray-800">
              Central de Evidencias
            </h1>
          </div>
          <p className="text-sm text-gray-500">
            Investigue a jornada completa de um ingresso para disputas e
            chargebacks
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <Input
            placeholder="Buscar por pedido, ingresso, CPF, email, telefone ou nome..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => handleSearchInput(e.target.value)}
            onKeyDown={handleSearchKeyDown}
          />
        </div>

        {/* Results */}
        {searching && (
          <p className="text-sm text-gray-500 animate-pulse">Buscando...</p>
        )}

        {!searching && searched && results.length === 0 && (
          <div className="rounded-xl border bg-white p-8 text-center text-gray-500">
            Nenhum resultado encontrado
          </div>
        )}

        {!searching && results.length > 0 && (
          <div className="grid gap-3">
            {results.map((r) => (
              <button
                key={r.ticketId}
                type="button"
                onClick={() => loadInvestigation(r.ticketId)}
                className="rounded-xl border bg-white p-4 shadow-sm text-left hover:border-violet-300 hover:shadow transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-800">{r.codigo}</p>
                    <p className="text-sm text-gray-600">{r.evento}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-700">{r.comprador}</p>
                    <p className="text-xs text-gray-400">
                      {formatDate(r.data)}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  /* ---------- INVESTIGATION VIEW ---------- */

  if (loadingInvestigation || !data) {
    return (
      <div className="space-y-6">
        <button
          type="button"
          onClick={backToSearch}
          className="flex items-center gap-1 text-sm text-violet-600 hover:underline"
        >
          <ArrowLeft size={14} /> Voltar a busca
        </button>
        <p className="text-sm text-gray-500 animate-pulse">
          Carregando investigacao...
        </p>
      </div>
    );
  }

  const { resumo, scoreDefesa, veredito } = data;
  const pct = scoreDefesa.maximo > 0
    ? Math.round((scoreDefesa.total / scoreDefesa.maximo) * 100)
    : 0;
  const vs = veredictoStyle(veredito.tipo);

  // count favorable evidence
  const totalFav = data.evidenciasFavoraveis.length;
  const presentFav = data.evidenciasFavoraveis.filter((e) => e.presente).length;

  function favConclusion() {
    if (totalFav === 0) return "Sem evidencias registradas.";
    const ratio = presentFav / totalFav;
    if (ratio === 1) return "Ha fortes indicios de que o servico foi efetivamente prestado.";
    if (ratio >= 0.6) return "A maioria das evidencias indica prestacao efetiva do servico.";
    return "Evidencias insuficientes para conclusao definitiva.";
  }

  return (
    <div className="space-y-6">
      {/* Back */}
      <button
        type="button"
        onClick={backToSearch}
        className="flex items-center gap-1 text-sm text-violet-600 hover:underline"
      >
        <ArrowLeft size={14} /> Voltar a busca
      </button>

      {/* ===== TOP SECTION ===== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Left: Resumo */}
        <div className="rounded-xl border bg-white p-5 shadow-sm space-y-2">
          <p className="font-bold text-gray-800">
            Pedido: #{resumo.code}
          </p>
          <Badge
            className={
              resumo.status === "PAGO"
                ? "bg-green-100 text-green-800"
                : resumo.status === "CANCELADO"
                  ? "bg-red-100 text-red-800"
                  : "bg-gray-100 text-gray-700"
            }
          >
            {resumo.status}
          </Badge>
          <p className="text-sm text-gray-600">{resumo.evento}</p>
          <p className="text-sm text-gray-600">{resumo.comprador}</p>
          <p className="text-xs text-gray-500">
            Compra: {formatDate(resumo.dataCompra)}
          </p>
          <p className="text-xs text-gray-500">
            Check-in:{" "}
            {resumo.dataCheckin ? formatDate(resumo.dataCheckin) : "Nao utilizado"}
          </p>
        </div>

        {/* Center: Score */}
        <div className="rounded-xl border bg-white p-5 shadow-sm flex flex-col items-center justify-center">
          <p className="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wide">
            Score de Defesa
          </p>
          <div
            className={`w-24 h-24 rounded-full border-4 flex items-center justify-center ${scoreColor(pct)} ${scoreBg(pct)}`}
          >
            <span className="text-3xl font-bold">{pct}</span>
          </div>
          <p className={`mt-2 text-sm font-semibold ${scoreColor(pct)}`}>
            {scoreLabel(pct)}
          </p>
        </div>

        {/* Right: Veredito */}
        <div className={`rounded-xl border p-5 shadow-sm space-y-3 ${vs.bg}`}>
          <p className="text-lg font-bold">
            {vs.icon} {vs.text}
          </p>
          {veredito.motivos.length > 0 && (
            <ul className="space-y-1">
              {veredito.motivos.map((m, i) => (
                <li key={i} className="text-sm text-gray-700 flex items-start gap-1">
                  <span className="mt-1 shrink-0">&#8226;</span> {m}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* PDF Button */}
      <div>
        <Button
          onClick={downloadDossie}
          disabled={downloadingPdf}
          className="bg-violet-600 hover:bg-violet-700 text-white"
        >
          <FileText size={16} className="mr-2" />
          {downloadingPdf ? "Gerando..." : "Gerar Dossie PDF"}
        </Button>
      </div>

      {/* ===== COLLAPSIBLE SECTIONS ===== */}

      {/* Section 1 - Evidencias Favoraveis */}
      <CollapsibleSection
        title="Evidencias Favoraveis a Nokta"
        defaultOpen
        borderColor="border-l-green-500"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          {data.evidenciasFavoraveis.map((ev, i) => (
            <div
              key={i}
              className="flex items-start gap-2 rounded-lg border p-3 bg-white"
            >
              <span className="mt-0.5 shrink-0">
                {ev.presente ? (
                  <span className="text-green-600">&#10003;</span>
                ) : (
                  <span className="text-red-500">&#10007;</span>
                )}
              </span>
              <span className="text-sm text-gray-700">{ev.descricao}</span>
            </div>
          ))}
        </div>
        <p className="text-sm font-medium text-gray-600 italic">
          {favConclusion()}
        </p>
      </CollapsibleSection>

      {/* Section 2 - Identidade do Comprador */}
      <CollapsibleSection title="Identidade do Comprador" defaultOpen>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <InfoCard label="Nome" value={data.identidade.nome} />
          <InfoCard label="Email" value={data.identidade.email} />
          <InfoCard label="Telefone" value={data.identidade.telefone} />
          <InfoCard label="CPF" value={data.identidade.cpf} />
          <InfoCard
            label="Conta criada em"
            value={formatDate(data.identidade.createdAt)}
          />
          <InfoCard
            label="Telefone verificado"
            value={
              data.identidade.telefoneVerificado ? (
                <span className="text-green-600 font-semibold">Verificado</span>
              ) : (
                <span className="text-red-500 font-semibold">Nao verificado</span>
              )
            }
          />
          <InfoCard
            label="Status da conta"
            value={
              data.identidade.ativo ? (
                <span className="text-green-600 font-semibold">Ativa</span>
              ) : (
                <span className="text-red-500 font-semibold">Inativa</span>
              )
            }
          />
        </div>
      </CollapsibleSection>

      {/* Section 3 - Historico do Usuario */}
      <CollapsibleSection title="Historico do Usuario" defaultOpen>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <InfoCard
            label="Conta criada ha"
            value={`${data.historicoUsuario.diasConta} dias`}
          />
          <InfoCard
            label="Eventos comprados"
            value={data.historicoUsuario.eventosComprados}
          />
          <InfoCard
            label="Eventos comparecidos"
            value={data.historicoUsuario.eventosComparecidos}
          />
          <InfoCard
            label="Transferencias"
            value={data.historicoUsuario.transferencias}
          />
          <InfoCard
            label="Revendas"
            value={data.historicoUsuario.revendas}
          />
          <InfoCard
            label="Chargebacks anteriores"
            value={
              data.historicoUsuario.chargebacksAnteriores > 0 ? (
                <span className="text-red-600 font-semibold">
                  {data.historicoUsuario.chargebacksAnteriores}
                </span>
              ) : (
                <span className="text-green-600 font-semibold">0</span>
              )
            }
          />
        </div>
      </CollapsibleSection>

      {/* Section 4 - Dados da Compra */}
      <CollapsibleSection title="Dados da Compra">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <InfoCard label="Pedido" value={data.compra.pedidoCodigo} />
          <InfoCard label="Valor" value={formatBRL(data.compra.valor)} />
          <InfoCard
            label="Status do pagamento"
            value={
              <Badge
                className={
                  data.compra.status === "PAGO"
                    ? "bg-green-100 text-green-800"
                    : data.compra.status === "CANCELADO"
                      ? "bg-red-100 text-red-800"
                      : "bg-gray-100 text-gray-700"
                }
              >
                {data.compra.status}
              </Badge>
            }
          />
          <InfoCard
            label="Data da compra"
            value={formatDate(data.compra.dataCriacao)}
          />
          <InfoCard
            label="Quantidade de ingressos"
            value={data.compra.quantidade}
          />
          <InfoCard label="Tipo do ingresso" value={data.compra.tipo} />
          <InfoCard label="Lote" value={data.compra.lote} />
        </div>
      </CollapsibleSection>

      {/* Section 5 - Evidencias Tecnicas */}
      <CollapsibleSection title="Evidencias Tecnicas">
        {data.evidenciasTecnicas.ips.length === 0 &&
        data.evidenciasTecnicas.fingerprints.length === 0 ? (
          <p className="text-sm text-gray-500">
            Nenhuma evidencia tecnica registrada
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2 pr-4 font-medium">IP</th>
                  <th className="pb-2 pr-4 font-medium">Fingerprint</th>
                  <th className="pb-2 font-medium">Data</th>
                </tr>
              </thead>
              <tbody>
                {data.evidenciasTecnicas.ips.map((item, i) => (
                  <tr key={`ip-${i}`} className="border-b last:border-0">
                    <td className="py-2 pr-4 text-gray-700">{item.ip}</td>
                    <td className="py-2 pr-4 text-gray-400">---</td>
                    <td className="py-2 text-gray-500">{formatDate(item.data)}</td>
                  </tr>
                ))}
                {data.evidenciasTecnicas.fingerprints.map((item, i) => (
                  <tr key={`fp-${i}`} className="border-b last:border-0">
                    <td className="py-2 pr-4 text-gray-400">---</td>
                    <td className="py-2 pr-4 text-gray-700 font-mono text-xs">
                      {item.fingerprint}
                    </td>
                    <td className="py-2 text-gray-500">{formatDate(item.data)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CollapsibleSection>

      {/* Section 6 - Evidencias de Entrega */}
      <CollapsibleSection title="Evidencias de Entrega">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-center gap-2 rounded-lg border p-3 bg-white">
            <span className="text-green-600">&#10003;</span>
            <span className="text-sm text-gray-700">QR gerado</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border p-3 bg-white">
            <span className="text-gray-400">&#8212;</span>
            <span className="text-sm text-gray-500">
              Email enviado: Sem dados (rastreamento futuro)
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border p-3 bg-white">
            <span className="text-gray-400">&#8212;</span>
            <span className="text-sm text-gray-500">
              WhatsApp enviado: Sem dados (rastreamento futuro)
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border p-3 bg-white">
            <span className="text-gray-400">&#8212;</span>
            <span className="text-sm text-gray-500">
              Meus Ingressos acessado: Sem dados (rastreamento futuro)
            </span>
          </div>
        </div>
      </CollapsibleSection>

      {/* Section 7 - Historico de Posse */}
      <CollapsibleSection title="Historico de Posse">
        {data.historicoPosse.transfers.length === 0 &&
        data.historicoPosse.resales.length === 0 ? (
          <p className="text-sm text-gray-500">
            Nenhuma transferencia ou revenda registrada
          </p>
        ) : (
          <div className="relative pl-6 space-y-4">
            {/* vertical line */}
            <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-gray-200" />

            {/* Original purchase */}
            <div className="relative">
              <div className="absolute -left-4 top-1.5 w-3 h-3 rounded-full bg-violet-500" />
              <p className="text-sm text-gray-700">
                <span className="font-medium">Compra original:</span>{" "}
                {resumo.comprador} &mdash; {formatDate(resumo.dataCompra)}
              </p>
            </div>

            {data.historicoPosse.transfers.map((t, i) => (
              <div key={`t-${i}`} className="relative">
                <div className="absolute -left-4 top-1.5 w-3 h-3 rounded-full bg-blue-500" />
                <p className="text-sm text-gray-700">
                  Transferido de <span className="font-medium">{t.de}</span> para{" "}
                  <span className="font-medium">{t.para}</span> &mdash;{" "}
                  {formatDate(t.data)}
                </p>
              </div>
            ))}

            {data.historicoPosse.resales.map((r, i) => (
              <div key={`r-${i}`} className="relative">
                <div className="absolute -left-4 top-1.5 w-3 h-3 rounded-full bg-orange-500" />
                <p className="text-sm text-gray-700">
                  Revendido por {formatBRL(r.valor)} &mdash; {r.status} &mdash;{" "}
                  {formatDate(r.data)}
                </p>
              </div>
            ))}
          </div>
        )}
      </CollapsibleSection>

      {/* Section 8 - Check-in do Evento */}
      <CollapsibleSection title="Check-in do Evento">
        {data.checkin.utilizado ? (
          <div className="space-y-3">
            <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-center">
              <p className="text-lg font-bold text-green-700">
                SERVICO EFETIVAMENTE UTILIZADO
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <InfoCard
                label="Data/hora da validacao"
                value={formatDate(data.checkin.dataHora)}
              />
              <InfoCard
                label="Operador"
                value={data.checkin.operadorId ?? "---"}
              />
              <InfoCard
                label="IP da validacao"
                value={data.checkin.ip ?? "---"}
              />
              <InfoCard
                label="Tentativas anteriores"
                value={data.checkin.tentativasAntes}
              />
            </div>
          </div>
        ) : (
          <div className="rounded-lg bg-gray-50 border border-gray-200 p-4 text-center">
            <p className="text-gray-500 font-medium">
              Ingresso ainda nao utilizado
            </p>
          </div>
        )}
      </CollapsibleSection>

      {/* Section 9 - Timeline Completa */}
      <CollapsibleSection title="Timeline Completa">
        {data.timeline.length === 0 ? (
          <p className="text-sm text-gray-500">Nenhum evento registrado</p>
        ) : (
          <div className="relative pl-6 space-y-4">
            <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-gray-200" />
            {data.timeline.map((ev, i) => (
              <div key={i} className="relative">
                <div
                  className={`absolute -left-4 top-1.5 w-3 h-3 rounded-full ${timelineDotColor(ev.tipo)}`}
                />
                <div>
                  <p className="text-sm text-gray-800">{ev.descricao}</p>
                  <p className="text-xs text-gray-400">
                    {formatDate(ev.data)}
                    {ev.ator && ` — ${ev.ator}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CollapsibleSection>

      {/* Section 10 - Indicadores de Risco */}
      <CollapsibleSection title="Indicadores de Risco" borderColor="border-l-red-400">
        {data.indicadores.length === 0 ? (
          <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-center">
            <p className="text-green-700 font-medium">
              Nenhum indicador de risco encontrado
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.indicadores.map((ind, i) => (
              <div
                key={i}
                className="rounded-lg border p-4 bg-white space-y-2"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-800">
                    {ind.descricao}
                  </p>
                  <Badge
                    className={`text-xs ${severityColor(ind.severidade)}`}
                  >
                    {ind.severidade}
                  </Badge>
                </div>
                {ind.valor && (
                  <p className="text-xs text-gray-500">Valor: {ind.valor}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </CollapsibleSection>
    </div>
  );
}
