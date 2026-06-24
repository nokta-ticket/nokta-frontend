"use client";

import { useCallback, useRef, useState } from "react";
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
  id: number;
  code: string;
  status: number;
  evento: string;
  comprador: string;
  dataCompra: string;
}

interface InvestigationData {
  ingresso: {
    id: number;
    codigo: string;
    status: number;
    statusNome: string;
    bloqueado: boolean;
    bloqueadoMotivo: string | null;
    resaleAddCount: number;
    criadoEm: string;
  };
  evento: {
    id: number;
    nome: string;
    data: string;
    endereco: string;
  };
  lote: {
    id: number;
    nome: string;
    valor: string;
    tipo: number;
    lote: number;
  };
  comprador: {
    id: number;
    nome: string;
    email: string;
    cpf: string;
    telefone: string;
    telefoneVerificado: boolean;
    contaAtiva: boolean;
    contaCriadaEm: string;
    bloqueado: boolean;
  };
  pedido: {
    id: number;
    codigo: string;
    status: number;
    statusNome: string;
    valorTotal: string;
    quantidade: number;
    pagoEm: string;
    criadoEm: string;
    itens: number;
    transacoes: number;
    chargebacks: number;
  } | null;
  transferencias: Array<{
    id: number;
    de: { id: number; nome: string; email: string };
    para: { id: number; nome: string; email: string };
    data: string;
  }>;
  revendas: Array<{
    id: number;
    vendedor: { id: number; nome: string; email: string };
    comprador: { id: number; nome: string; email: string } | null;
    precoOriginal: string;
    precoRevenda: string;
    status: number;
    criadaEm: string;
    vendidaEm: string;
  }>;
  historicoComprador: {
    pedidosPagos: number;
    totalIngressos: number;
    transferenciasRealizadas: number;
    revendasRealizadas: number;
    chargebacks: number;
    eventosComparecidos: number;
  };
  indicadores: Array<{
    tipo: string;
    severidade: "critico" | "alto" | "medio" | "baixo";
    descricao: string;
    valor: number;
  }>;
  score: {
    total: number;
    maximo: number;
    nivel: "muito_forte" | "forte" | "moderado" | "fraco";
    itens: Array<{ evidencia: string; pontos: number; ativo: boolean }>;
  };
  veredito: {
    tipo: "defesa_recomendada" | "analisar_manualmente" | "alto_risco";
    motivos: string[];
  };
  evidenciasFavoraveis: Array<{
    descricao: string;
    presente: boolean;
  }>;
  timeline: Array<{
    data: string;
    tipo: string;
    descricao: string;
    ator: string | null;
    ip: string | null;
    fingerprint: string | null;
  }>;
  checkin: {
    utilizado: boolean;
    dataHora: string | null;
    operadorId: number | null;
    ip: string | null;
    fingerprint: string | null;
    tentativasAntes: number;
  };
  auditoria: {
    totalRegistros: number;
    integridadeVerificada: boolean;
    cadeiaQuebrada: unknown | null;
  };
  eventosSeguranca: Array<{
    tipo: string;
    ip: string | null;
    fingerprint: string | null;
    data: string;
  }>;
}

/* ---------- helpers ---------- */

function loteTipoNome(tipo: number): string {
  switch (tipo) {
    case 1: return "Normal";
    case 2: return "Meia";
    case 3: return "Gratuito";
    default: return `Tipo ${tipo}`;
  }
}

function scoreColor(nivel: string): string {
  switch (nivel) {
    case "muito_forte": return "text-green-600 border-green-500";
    case "forte": return "text-green-600 border-green-500";
    case "moderado": return "text-yellow-600 border-yellow-500";
    case "fraco": return "text-red-600 border-red-500";
    default: return "text-gray-600 border-gray-500";
  }
}

function scoreBg(nivel: string): string {
  switch (nivel) {
    case "muito_forte":
    case "forte": return "bg-green-50";
    case "moderado": return "bg-yellow-50";
    case "fraco": return "bg-red-50";
    default: return "bg-gray-50";
  }
}

function scoreLabel(nivel: string): string {
  switch (nivel) {
    case "muito_forte": return "Muito forte";
    case "forte": return "Forte";
    case "moderado": return "Moderado";
    case "fraco": return "Fraco";
    default: return nivel;
  }
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
  const green = ["INGRESSO_VALIDADO", "ACCOUNT_ACTIVATED"];
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

function calcDiasConta(contaCriadaEm: string): number {
  try {
    const parts = contaCriadaEm.match(/(\d{2})\/(\d{2})\/(\d{4})/);
    if (parts) {
      const d = new Date(Number(parts[3]), Number(parts[2]) - 1, Number(parts[1]));
      const diff = Date.now() - d.getTime();
      return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
    }
    const d = new Date(contaCriadaEm);
    if (!isNaN(d.getTime())) {
      const diff = Date.now() - d.getTime();
      return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
    }
    return 0;
  } catch {
    return 0;
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
      a.download = `dossie-${data.ingresso.codigo}.pdf`;
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
                key={r.id}
                type="button"
                onClick={() => loadInvestigation(r.id)}
                className="rounded-xl border bg-white p-4 shadow-sm text-left hover:border-violet-300 hover:shadow transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-800">{r.code}</p>
                    <p className="text-sm text-gray-600">{r.evento}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-700">{r.comprador}</p>
                    <p className="text-xs text-gray-400">{r.dataCompra}</p>
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

  const { score, veredito } = data;
  const pct = score.maximo > 0
    ? Math.round((score.total / score.maximo) * 100)
    : 0;
  const vs = veredictoStyle(veredito.tipo);

  const totalFav = data.evidenciasFavoraveis.length;
  const presentFav = data.evidenciasFavoraveis.filter((e) => e.presente).length;

  function favConclusion() {
    if (totalFav === 0) return "Sem evidencias registradas.";
    const ratio = presentFav / totalFav;
    if (ratio === 1) return "Ha fortes indicios de que o servico foi efetivamente prestado.";
    if (ratio >= 0.6) return "A maioria das evidencias indica prestacao efetiva do servico.";
    return "Evidencias insuficientes para conclusao definitiva.";
  }

  const diasConta = calcDiasConta(data.comprador.contaCriadaEm);

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
          <p className="font-bold text-gray-800">Resumo</p>
          <p className="text-sm text-gray-600">
            <span className="text-gray-500">Ingresso:</span>{" "}
            <span className="font-medium">{data.ingresso.codigo}</span>
          </p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Status:</span>
            <Badge
              className={
                data.ingresso.status === 1
                  ? "bg-green-100 text-green-800"
                  : data.ingresso.status === 4
                    ? "bg-red-100 text-red-800"
                    : "bg-gray-100 text-gray-700"
              }
            >
              {data.ingresso.statusNome}
            </Badge>
          </div>
          <p className="text-sm text-gray-600">
            <span className="text-gray-500">Evento:</span>{" "}
            {data.evento.nome}
          </p>
          <p className="text-sm text-gray-600">
            <span className="text-gray-500">Comprador:</span>{" "}
            {data.comprador.nome}
          </p>
          <p className="text-xs text-gray-500">
            Compra: {data.pedido?.criadoEm ?? "---"}
          </p>
          <p className="text-xs text-gray-500">
            Check-in:{" "}
            {data.checkin.utilizado ? data.checkin.dataHora : "Nao utilizado"}
          </p>
        </div>

        {/* Center: Score */}
        <div className="rounded-xl border bg-white p-5 shadow-sm flex flex-col items-center justify-center">
          <p className="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wide">
            Score de Defesa
          </p>
          <div
            className={`w-24 h-24 rounded-full border-4 flex items-center justify-center ${scoreColor(score.nivel)} ${scoreBg(score.nivel)}`}
          >
            <div className="text-center">
              <span className="text-2xl font-bold">{score.total}</span>
              <span className="text-xs text-gray-400">/{score.maximo}</span>
            </div>
          </div>
          <p className={`mt-2 text-sm font-semibold ${scoreColor(score.nivel)}`}>
            {scoreLabel(score.nivel)}
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

      {/* Section 1 - Evidencias Favoraveis a Nokta */}
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
          <InfoCard label="Nome" value={data.comprador.nome} />
          <InfoCard label="Email" value={data.comprador.email} />
          <InfoCard label="Telefone" value={data.comprador.telefone} />
          <InfoCard label="CPF" value={data.comprador.cpf} />
          <InfoCard
            label="Telefone verificado"
            value={
              data.comprador.telefoneVerificado ? (
                <span className="text-green-600 font-semibold">Verificado</span>
              ) : (
                <span className="text-red-500 font-semibold">Nao verificado</span>
              )
            }
          />
          <InfoCard
            label="Status da conta"
            value={
              data.comprador.contaAtiva ? (
                <span className="text-green-600 font-semibold">Ativa</span>
              ) : (
                <span className="text-red-500 font-semibold">Inativa</span>
              )
            }
          />
          <InfoCard
            label="Conta criada em"
            value={data.comprador.contaCriadaEm}
          />
        </div>
      </CollapsibleSection>

      {/* Section 3 - Historico do Usuario */}
      <CollapsibleSection title="Historico do Usuario" defaultOpen>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <InfoCard
            label="Conta criada ha"
            value={`${diasConta} dias`}
          />
          <InfoCard
            label="Pedidos pagos"
            value={data.historicoComprador.pedidosPagos}
          />
          <InfoCard
            label="Total de ingressos"
            value={data.historicoComprador.totalIngressos}
          />
          <InfoCard
            label="Transferencias realizadas"
            value={data.historicoComprador.transferenciasRealizadas}
          />
          <InfoCard
            label="Revendas realizadas"
            value={data.historicoComprador.revendasRealizadas}
          />
          <InfoCard
            label="Chargebacks"
            value={
              data.historicoComprador.chargebacks > 0 ? (
                <span className="text-red-600 font-semibold">
                  {data.historicoComprador.chargebacks}
                </span>
              ) : (
                <span className="text-green-600 font-semibold">0</span>
              )
            }
          />
          <InfoCard
            label="Eventos comparecidos"
            value={data.historicoComprador.eventosComparecidos}
          />
        </div>
      </CollapsibleSection>

      {/* Section 4 - Dados da Compra */}
      <CollapsibleSection title="Dados da Compra">
        {data.pedido ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <InfoCard label="Pedido" value={data.pedido.codigo} />
            <InfoCard label="Valor total" value={data.pedido.valorTotal} />
            <InfoCard
              label="Status do pagamento"
              value={
                <Badge
                  className={
                    data.pedido.statusNome === "Pago"
                      ? "bg-green-100 text-green-800"
                      : data.pedido.statusNome === "Cancelado"
                        ? "bg-red-100 text-red-800"
                        : "bg-gray-100 text-gray-700"
                  }
                >
                  {data.pedido.statusNome}
                </Badge>
              }
            />
            <InfoCard label="Pago em" value={data.pedido.pagoEm || "---"} />
            <InfoCard
              label="Quantidade de ingressos"
              value={data.pedido.quantidade}
            />
            <InfoCard label="Lote" value={data.lote.nome} />
            <InfoCard label="Numero do lote" value={data.lote.lote} />
            <InfoCard label="Tipo do ingresso" value={loteTipoNome(data.lote.tipo)} />
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            Nenhum pedido associado a este ingresso
          </p>
        )}
      </CollapsibleSection>

      {/* Section 5 - Evidencias Tecnicas */}
      <CollapsibleSection title="Evidencias Tecnicas">
        {data.eventosSeguranca.length === 0 ? (
          <p className="text-sm text-gray-500">
            Nenhuma evidencia tecnica registrada
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2 pr-4 font-medium">Tipo</th>
                  <th className="pb-2 pr-4 font-medium">IP</th>
                  <th className="pb-2 pr-4 font-medium">Fingerprint</th>
                  <th className="pb-2 font-medium">Data</th>
                </tr>
              </thead>
              <tbody>
                {data.eventosSeguranca.map((ev, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-2 pr-4 text-gray-700">{ev.tipo}</td>
                    <td className="py-2 pr-4 text-gray-700">{ev.ip ?? "---"}</td>
                    <td className="py-2 pr-4 text-gray-700 font-mono text-xs">
                      {ev.fingerprint ?? "---"}
                    </td>
                    <td className="py-2 text-gray-500">{ev.data}</td>
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
        {data.transferencias.length === 0 && data.revendas.length === 0 ? (
          <p className="text-sm text-gray-500">
            Nenhuma transferencia ou revenda registrada
          </p>
        ) : (
          <div className="relative pl-6 space-y-4">
            <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-gray-200" />

            {data.transferencias.map((t) => (
              <div key={`t-${t.id}`} className="relative">
                <div className="absolute -left-4 top-1.5 w-3 h-3 rounded-full bg-blue-500" />
                <p className="text-sm text-gray-700">
                  Transferido de{" "}
                  <span className="font-medium">{t.de.nome}</span>{" "}
                  <span className="text-xs text-gray-400">({t.de.email})</span>{" "}
                  para{" "}
                  <span className="font-medium">{t.para.nome}</span>{" "}
                  <span className="text-xs text-gray-400">({t.para.email})</span>{" "}
                  &mdash; {t.data}
                </p>
              </div>
            ))}

            {data.revendas.map((r) => (
              <div key={`r-${r.id}`} className="relative">
                <div className="absolute -left-4 top-1.5 w-3 h-3 rounded-full bg-orange-500" />
                <p className="text-sm text-gray-700">
                  Revendido por{" "}
                  <span className="font-medium">{r.vendedor.nome}</span>{" "}
                  <span className="text-xs text-gray-400">({r.vendedor.email})</span>
                  {r.comprador && (
                    <>
                      {" "}para{" "}
                      <span className="font-medium">{r.comprador.nome}</span>{" "}
                      <span className="text-xs text-gray-400">({r.comprador.email})</span>
                    </>
                  )}
                  {" "}&mdash; Original: {r.precoOriginal} / Revenda: {r.precoRevenda}
                  {" "}&mdash; {r.criadaEm}
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
                value={data.checkin.dataHora ?? "---"}
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
                    {ev.data}
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
                <p className="text-xs text-gray-500">
                  Tipo: {ind.tipo} | Valor: {ind.valor}
                </p>
              </div>
            ))}
          </div>
        )}
      </CollapsibleSection>

      {/* Footer: Auditoria */}
      <div className="rounded-xl border bg-white p-4 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full ${
              data.auditoria.integridadeVerificada ? "bg-green-500" : "bg-red-500"
            }`}
          />
          <p className="text-sm text-gray-700">
            {data.auditoria.integridadeVerificada
              ? "Integridade da auditoria verificada"
              : "Falha na verificacao de integridade"}
          </p>
        </div>
        <p className="text-xs text-gray-500">
          {data.auditoria.totalRegistros} registros auditados
        </p>
      </div>
    </div>
  );
}
