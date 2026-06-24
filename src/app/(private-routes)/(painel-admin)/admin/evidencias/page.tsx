"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Download,
  FileText,
  RefreshCw,
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

interface RecentTicket {
  id: number;
  code: string;
  status: number;
  bloqueado: boolean;
  createdAt: string;
  dono: { nome: string; sobrenome: string; email: string };
  evento: { nome: string; data: string };
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
  contextoCheckout?: {
    ip: string | null;
    fingerprint: string | null;
    userAgent: string | null;
    buyerPhoneVerified: boolean | null;
    buyerAccountActive: boolean | null;
    buyerAccountAgeDays: number | null;
  } | null;
  gateway?: {
    gatewayId: string | null;
    threedsStatus: string | null;
    antifraudeStatus: string | null;
  } | null;
  termosAceitos?: {
    versao: string;
    aceiteEm: string;
  } | null;
  webhooks?: Array<{
    eventType: string;
    signatureValid: boolean;
    processedOk: boolean;
    data: string;
  }>;
  comunicacoes?: Array<{
    canal: string;
    tipo: string;
    destinatario: string;
    status: string;
    data: string;
  }>;
  acessosIngresso?: {
    totalAcessos: number;
    qrViews: number;
    ultimoAcesso: string | null;
  } | null;
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
    case "muito_forte":
    case "forte":
      return "text-green-600 border-green-500";
    case "moderado":
      return "text-yellow-600 border-yellow-500";
    case "fraco":
      return "text-red-600 border-red-500";
    default:
      return "text-gray-600 border-gray-500";
  }
}

function scoreBg(nivel: string): string {
  switch (nivel) {
    case "muito_forte":
    case "forte":
      return "bg-green-50";
    case "moderado":
      return "bg-yellow-50";
    case "fraco":
      return "bg-red-50";
    default:
      return "bg-gray-50";
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
      return { bg: "bg-green-50 border-green-200", text: "Defesa recomendada", icon: "\u{1F7E2}" };
    case "analisar_manualmente":
      return { bg: "bg-yellow-50 border-yellow-200", text: "Analisar manualmente", icon: "\u{1F7E1}" };
    case "alto_risco":
      return { bg: "bg-red-50 border-red-200", text: "Alto risco", icon: "\u{1F534}" };
    default:
      return { bg: "bg-gray-50 border-gray-200", text: tipo, icon: "⚪" };
  }
}

function timelineDotColor(tipo: string): string {
  const upper = tipo.toUpperCase();
  if (upper.includes("VALIDADO") || upper.includes("ATIVAD")) return "bg-green-500";
  if (upper.includes("FALHA") || upper.includes("CANCELADO") || upper.includes("BLOQUEADO")) return "bg-red-500";
  if (upper.includes("CRIADO") || upper.includes("PAGA") || upper.includes("COMPRA")) return "bg-violet-500";
  if (upper.includes("TRANSFER") || upper.includes("REVEND")) return "bg-blue-500";
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

function ticketStatusBadge(status: number, bloqueado: boolean) {
  if (bloqueado) return { className: "bg-red-100 text-red-800", label: "Bloqueado" };
  switch (status) {
    case 1: return { className: "bg-green-100 text-green-800", label: "Ativo" };
    case 2: return { className: "bg-blue-100 text-blue-800", label: "Transferido" };
    case 3: return { className: "bg-orange-100 text-orange-800", label: "Revendido" };
    case 4: return { className: "bg-red-100 text-red-800", label: "Cancelado" };
    default: return { className: "bg-gray-100 text-gray-700", label: `Status ${status}` };
  }
}

function canalIcon(canal: string): string {
  switch (canal.toLowerCase()) {
    case "email": return "\u{1F4E7}";
    case "whatsapp": return "\u{1F4AC}";
    default: return "\u{1F4E8}";
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
  const [view, setView] = useState<"feed" | "search" | "investigation">("feed");
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  /* live feed state */
  const [recentTickets, setRecentTickets] = useState<RecentTicket[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [secondsAgo, setSecondsAgo] = useState(0);
  const feedIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [data, setData] = useState<InvestigationData | null>(null);
  const [loadingInvestigation, setLoadingInvestigation] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* --- fetch live feed --- */

  const fetchFeed = useCallback(async () => {
    try {
      const { data: res } = await api.get<{ data: RecentTicket[] }>(
        "/admin/ingressos",
        { params: { page: 1, limit: 10 } }
      );
      setRecentTickets(res.data);
      setLastRefresh(new Date());
      setSecondsAgo(0);
    } catch {
      /* silently fail on auto-refresh */
    } finally {
      setLoadingFeed(false);
    }
  }, []);

  useEffect(() => {
    fetchFeed();
    feedIntervalRef.current = setInterval(fetchFeed, 30000);
    tickerRef.current = setInterval(() => {
      setSecondsAgo((prev) => prev + 1);
    }, 1000);

    return () => {
      if (feedIntervalRef.current) clearInterval(feedIntervalRef.current);
      if (tickerRef.current) clearInterval(tickerRef.current);
    };
  }, [fetchFeed]);

  /* --- search --- */

  const doSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) return;
    setSearching(true);
    setSearched(true);
    setView("search");
    try {
      const { data: res } = await api.get<SearchResult[]>(
        "/admin/evidencias/investigar",
        { params: { q: q.trim() } }
      );
      setResults(res);
    } catch (err) {
      toast.error(getErrorMessage(err, "Erro ao buscar evidências."));
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
    } else if (value.trim().length === 0) {
      setView("feed");
      setSearched(false);
      setResults([]);
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
      toast.error(getErrorMessage(err, "Erro ao carregar investigação."));
      setData(null);
    } finally {
      setLoadingInvestigation(false);
    }
  }

  function backToFeed() {
    setView(searched && results.length > 0 ? "search" : "feed");
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
      toast.success("Dossiê baixado com sucesso.");
    } catch (err) {
      toast.error(getErrorMessage(err, "Erro ao gerar dossiê PDF."));
    } finally {
      setDownloadingPdf(false);
    }
  }

  /* ---------- HEADER (always visible) ---------- */

  const header = (
    <>
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Shield size={22} className="text-violet-600" />
          <h1 className="text-2xl font-bold text-gray-800">Nokta Protect</h1>
        </div>
        <p className="text-sm text-gray-500">
          Sistema de evidências e defesa contra disputas
        </p>
      </div>

      {/* Search bar */}
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
    </>
  );

  /* ---------- FEED VIEW ---------- */

  if (view === "feed") {
    return (
      <div className="space-y-6">
        {header}

        {/* Feed heading */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">
            Últimos ingressos vendidos
          </h2>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">
              Atualizado há {secondsAgo}s
            </span>
            <button
              type="button"
              onClick={() => { fetchFeed(); setSecondsAgo(0); }}
              className="text-violet-600 hover:text-violet-800 transition-colors"
              title="Atualizar agora"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {loadingFeed ? (
          <p className="text-sm text-gray-500 animate-pulse">
            Carregando ingressos recentes...
          </p>
        ) : recentTickets.length === 0 ? (
          <div className="rounded-xl border bg-white p-8 text-center text-gray-500">
            Nenhum ingresso encontrado
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500 bg-gray-50">
                  <th className="px-4 py-3 font-medium">Código</th>
                  <th className="px-4 py-3 font-medium">Evento</th>
                  <th className="px-4 py-3 font-medium">Comprador</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Data</th>
                </tr>
              </thead>
              <tbody>
                {recentTickets.map((t) => {
                  const badge = ticketStatusBadge(t.status, t.bloqueado);
                  return (
                    <tr
                      key={t.id}
                      onClick={() => loadInvestigation(t.id)}
                      className="border-b last:border-0 hover:bg-violet-50 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-gray-800">
                        {t.code}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {t.evento.nome}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {t.dono.nome} {t.dono.sobrenome}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={badge.className}>
                          {badge.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {t.createdAt}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  /* ---------- SEARCH VIEW ---------- */

  if (view === "search") {
    return (
      <div className="space-y-6">
        {header}

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
          onClick={backToFeed}
          className="flex items-center gap-1 text-sm text-violet-600 hover:underline"
        >
          <ArrowLeft size={14} /> Voltar
        </button>
        <p className="text-sm text-gray-500 animate-pulse">
          Carregando investigação...
        </p>
      </div>
    );
  }

  const { score, veredito } = data;
  const vs = veredictoStyle(veredito.tipo);

  const totalFav = data.evidenciasFavoraveis.length;
  const presentFav = data.evidenciasFavoraveis.filter((e) => e.presente).length;

  function favConclusion() {
    if (totalFav === 0) return "Sem evidências registradas.";
    const ratio = presentFav / totalFav;
    if (ratio >= 0.9) return "Há fortes indícios de que o serviço foi efetivamente prestado.";
    if (ratio >= 0.5) return "A maioria das evidências indica prestação efetiva do serviço.";
    return "Evidências insuficientes para conclusão definitiva.";
  }

  return (
    <div className="space-y-6">
      {/* Back */}
      <button
        type="button"
        onClick={backToFeed}
        className="flex items-center gap-1 text-sm text-violet-600 hover:underline"
      >
        <ArrowLeft size={14} /> Voltar
      </button>

      {/* ===== TOP SECTION (3 columns) ===== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Left: Resumo */}
        <div className="rounded-xl border bg-white p-5 shadow-sm space-y-2">
          <p className="font-bold text-gray-800 text-lg">Resumo</p>
          <p className="text-sm text-gray-600">
            <span className="text-gray-500">Ingresso:</span>{" "}
            <span className="font-mono font-medium">{data.ingresso.codigo}</span>
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
            <span className="text-gray-500">Evento:</span> {data.evento.nome}
          </p>
          <p className="text-sm text-gray-600">
            <span className="text-gray-500">Comprador:</span> {data.comprador.nome}
          </p>
          <p className="text-xs text-gray-500">
            Compra: {data.pedido?.criadoEm ?? "—"}
          </p>
          <p className="text-xs text-gray-500">
            Check-in: {data.checkin.utilizado ? data.checkin.dataHora : "Não utilizado"}
          </p>
        </div>

        {/* Center: Score de Defesa */}
        <div className="rounded-xl border bg-white p-5 shadow-sm flex flex-col items-center justify-center">
          <p className="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wide">
            Score de Defesa
          </p>
          <div
            className={`w-28 h-28 rounded-full border-4 flex items-center justify-center ${scoreColor(score.nivel)} ${scoreBg(score.nivel)}`}
          >
            <div className="text-center">
              <span className="text-3xl font-bold">{score.total}</span>
              <span className="text-sm text-gray-400">/{score.maximo}</span>
            </div>
          </div>
          <p className={`mt-2 text-sm font-semibold ${scoreColor(score.nivel)}`}>
            {scoreLabel(score.nivel)}
          </p>
          {/* Score breakdown */}
          {score.itens.length > 0 && (
            <div className="mt-3 w-full space-y-1">
              {score.itens.map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
                  <span className={item.ativo ? "text-green-600" : "text-gray-300"}>
                    {item.ativo ? "✓" : "✗"}
                  </span>
                  <span>{item.evidencia}</span>
                  <span className="text-gray-400 ml-auto">+{item.pontos}</span>
                </div>
              ))}
            </div>
          )}
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
          <Download size={16} className="mr-2" />
          {downloadingPdf ? "Gerando..." : "Gerar Dossiê PDF"}
        </Button>
      </div>

      {/* ===== COLLAPSIBLE SECTIONS ===== */}

      {/* 1. Evidências Favoráveis à Nokta */}
      <CollapsibleSection
        title="Evidências Favoráveis à Nokta"
        defaultOpen
        borderColor="border-l-green-500"
      >
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm text-gray-600">
            {presentFav} de {totalFav} evidências presentes
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          {data.evidenciasFavoraveis.map((ev, i) => (
            <div
              key={i}
              className="flex items-start gap-2 rounded-lg border p-3 bg-white"
            >
              <span className="mt-0.5 shrink-0">
                {ev.presente ? (
                  <span className="text-green-600 font-bold">{"✅"}</span>
                ) : (
                  <span className="text-red-500 font-bold">{"❌"}</span>
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

      {/* 2. Identidade do Comprador */}
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
                <span className="text-green-600 font-semibold">{"✓"} Verificado</span>
              ) : (
                <span className="text-red-500 font-semibold">{"✗"} Não verificado</span>
              )
            }
          />
          <InfoCard
            label="Conta ativa"
            value={
              data.comprador.contaAtiva ? (
                <span className="text-green-600 font-semibold">{"✓"} Ativa</span>
              ) : (
                <span className="text-red-500 font-semibold">{"✗"} Inativa</span>
              )
            }
          />
          <InfoCard label="Conta criada em" value={data.comprador.contaCriadaEm} />
          <InfoCard
            label="Conta bloqueada"
            value={
              data.comprador.bloqueado ? (
                <span className="text-red-600 font-semibold">Sim</span>
              ) : (
                <span className="text-green-600 font-semibold">Não</span>
              )
            }
          />
        </div>
      </CollapsibleSection>

      {/* 3. Histórico do Usuário */}
      <CollapsibleSection title="Histórico do Usuário" defaultOpen>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <InfoCard label="Pedidos pagos" value={data.historicoComprador.pedidosPagos} />
          <InfoCard label="Total de ingressos" value={data.historicoComprador.totalIngressos} />
          <InfoCard
            label="Transferências realizadas"
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

      {/* 4. Dados da Compra */}
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
            <InfoCard label="Pago em" value={data.pedido.pagoEm || "—"} />
            <InfoCard label="Criado em" value={data.pedido.criadoEm} />
            <InfoCard label="Quantidade" value={data.pedido.quantidade} />
            <InfoCard label="Itens" value={data.pedido.itens} />
            <InfoCard label="Transações" value={data.pedido.transacoes} />
            <InfoCard label="Lote" value={data.lote.nome} />
            <InfoCard label="Número do lote" value={data.lote.lote} />
            <InfoCard label="Tipo do ingresso" value={loteTipoNome(data.lote.tipo)} />
            <InfoCard label="Valor do lote" value={data.lote.valor} />
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            Nenhum pedido associado a este ingresso
          </p>
        )}
      </CollapsibleSection>

      {/* 5. Gateway / 3DS / Antifraude */}
      <CollapsibleSection title="Gateway / 3DS / Antifraude" borderColor="border-l-violet-500">
        {data.gateway && (data.gateway.gatewayId || data.gateway.threedsStatus || data.gateway.antifraudeStatus) ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <InfoCard label="Gateway ID" value={data.gateway.gatewayId ?? "—"} />
              <InfoCard
                label="3DS"
                value={
                  data.gateway.threedsStatus ? (
                    <Badge className="bg-green-100 text-green-800">3DS Autenticado</Badge>
                  ) : (
                    <Badge className="bg-gray-100 text-gray-700">Sem 3DS</Badge>
                  )
                }
              />
              <InfoCard
                label="Antifraude"
                value={
                  data.gateway.antifraudeStatus ? (
                    <Badge className="bg-green-100 text-green-800">
                      {data.gateway.antifraudeStatus}
                    </Badge>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )
                }
              />
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            Sem dados do gateway disponíveis
          </p>
        )}
      </CollapsibleSection>

      {/* 6. Contexto Técnico do Checkout */}
      <CollapsibleSection title="Contexto Técnico do Checkout">
        {data.contextoCheckout ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <InfoCard label="IP" value={data.contextoCheckout.ip ?? "—"} />
            <InfoCard
              label="Fingerprint"
              value={
                data.contextoCheckout.fingerprint ? (
                  <span className="font-mono text-xs">{data.contextoCheckout.fingerprint}</span>
                ) : "—"
              }
            />
            <InfoCard
              label="User Agent"
              value={
                data.contextoCheckout.userAgent ? (
                  <span className="text-xs break-all">{data.contextoCheckout.userAgent}</span>
                ) : "—"
              }
            />
            <InfoCard
              label="Telefone verificado (checkout)"
              value={
                data.contextoCheckout.buyerPhoneVerified === true ? (
                  <span className="text-green-600 font-semibold">{"✓"} Sim</span>
                ) : data.contextoCheckout.buyerPhoneVerified === false ? (
                  <span className="text-red-500 font-semibold">{"✗"} Não</span>
                ) : "—"
              }
            />
            <InfoCard
              label="Conta ativa (checkout)"
              value={
                data.contextoCheckout.buyerAccountActive === true ? (
                  <span className="text-green-600 font-semibold">{"✓"} Sim</span>
                ) : data.contextoCheckout.buyerAccountActive === false ? (
                  <span className="text-red-500 font-semibold">{"✗"} Não</span>
                ) : "—"
              }
            />
            <InfoCard
              label="Idade da conta"
              value={
                data.contextoCheckout.buyerAccountAgeDays != null
                  ? `${data.contextoCheckout.buyerAccountAgeDays} dias`
                  : "—"
              }
            />
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            Compra anterior ao Nokta Protect — sem contexto técnico
          </p>
        )}
      </CollapsibleSection>

      {/* 7. Aceite de Termos */}
      <CollapsibleSection title="Aceite de Termos">
        {data.termosAceitos ? (
          <div className="rounded-lg bg-green-50 border border-green-200 p-4">
            <p className="text-green-800 font-medium">
              {"✅"} Termos aceitos — versão {data.termosAceitos.versao} — em {data.termosAceitos.aceiteEm}
            </p>
          </div>
        ) : (
          <div className="rounded-lg bg-gray-50 border border-gray-200 p-4">
            <p className="text-gray-500">Sem registro de aceite de termos</p>
          </div>
        )}
      </CollapsibleSection>

      {/* 8. Evidências de Entrega */}
      <CollapsibleSection title="Evidências de Entrega">
        {(data.comunicacoes && data.comunicacoes.length > 0) || (data.acessosIngresso && data.acessosIngresso.totalAcessos > 0) ? (
          <div className="space-y-4">
            {/* Comunicações */}
            {data.comunicacoes && data.comunicacoes.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700 mb-2">Comunicações enviadas</p>
                {data.comunicacoes.map((c, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg border p-3 bg-white">
                    <span className="text-lg">{canalIcon(c.canal)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800">{c.tipo}</p>
                      <p className="text-xs text-gray-500">
                        Para: {c.destinatario} — {c.data}
                      </p>
                    </div>
                    <Badge
                      className={
                        c.status === "enviado" || c.status === "entregue"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-700"
                      }
                    >
                      {c.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
            {/* Acessos */}
            {data.acessosIngresso && data.acessosIngresso.totalAcessos > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <InfoCard label="Total de acessos" value={data.acessosIngresso.totalAcessos} />
                <InfoCard label="Visualizações do QR" value={data.acessosIngresso.qrViews} />
                <InfoCard label="Último acesso" value={data.acessosIngresso.ultimoAcesso ?? "—"} />
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            Sem evidências de entrega registradas
          </p>
        )}
      </CollapsibleSection>

      {/* 9. Histórico de Posse */}
      <CollapsibleSection title="Histórico de Posse">
        {data.transferencias.length === 0 && data.revendas.length === 0 ? (
          <p className="text-sm text-gray-500">
            Nenhuma transferência ou revenda registrada
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
                  Revenda por{" "}
                  <span className="font-medium">{r.precoRevenda}</span>{" "}
                  &mdash;{" "}
                  <Badge className="bg-gray-100 text-gray-700 text-xs">
                    Status {r.status}
                  </Badge>{" "}
                  &mdash; {r.criadaEm}
                </p>
              </div>
            ))}
          </div>
        )}
      </CollapsibleSection>

      {/* 10. Check-in do Evento */}
      <CollapsibleSection title="Check-in do Evento">
        {data.checkin.utilizado ? (
          <div className="space-y-3">
            <div className="rounded-lg bg-green-50 border-2 border-green-300 p-5 text-center">
              <p className="text-xl font-bold text-green-700">
                {"✅"} SERVIÇO EFETIVAMENTE UTILIZADO
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <InfoCard label="Data/hora da validação" value={data.checkin.dataHora ?? "—"} />
              <InfoCard label="Operador ID" value={data.checkin.operadorId ?? "—"} />
              <InfoCard label="IP da validação" value={data.checkin.ip ?? "—"} />
              <InfoCard
                label="Fingerprint"
                value={
                  data.checkin.fingerprint ? (
                    <span className="font-mono text-xs">{data.checkin.fingerprint}</span>
                  ) : "—"
                }
              />
              <InfoCard label="Tentativas anteriores" value={data.checkin.tentativasAntes} />
            </div>
          </div>
        ) : (
          <div className="rounded-lg bg-gray-50 border border-gray-200 p-5 text-center">
            <p className="text-gray-500 font-medium">
              Ingresso ainda não utilizado
            </p>
          </div>
        )}
      </CollapsibleSection>

      {/* 11. Timeline Completa */}
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
                    {ev.ip && ` — IP: ${ev.ip}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CollapsibleSection>

      {/* 12. Indicadores de Risco */}
      <CollapsibleSection title="Indicadores de Risco" borderColor="border-l-red-400">
        {data.indicadores.length === 0 ? (
          <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-center">
            <p className="text-green-700 font-medium">
              {"✅"} Nenhum indicador de risco encontrado
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.indicadores.map((ind, i) => (
              <div key={i} className="rounded-lg border p-4 bg-white space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-800">
                    {ind.descricao}
                  </p>
                  <Badge className={`text-xs ${severityColor(ind.severidade)}`}>
                    {ind.severidade}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CollapsibleSection>

      {/* Footer: Auditoria */}
      <div className="rounded-xl border bg-white p-5 shadow-sm space-y-4">
        <p className="font-semibold text-gray-800">Auditoria</p>
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full ${
              data.auditoria.integridadeVerificada ? "bg-green-500" : "bg-red-500"
            }`}
          />
          <p className="text-sm text-gray-700">
            Integridade:{" "}
            {data.auditoria.integridadeVerificada
              ? `✅ Verificada (${data.auditoria.totalRegistros} registros)`
              : "❌ Comprometida"}
          </p>
        </div>

        {/* Webhooks */}
        {data.webhooks && data.webhooks.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Webhooks recebidos</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="pb-2 pr-4 font-medium">Evento</th>
                    <th className="pb-2 pr-4 font-medium">Assinatura</th>
                    <th className="pb-2 pr-4 font-medium">Processado</th>
                    <th className="pb-2 font-medium">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {data.webhooks.map((wh, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-2 pr-4 text-gray-700">{wh.eventType}</td>
                      <td className="py-2 pr-4">
                        <Badge
                          className={
                            wh.signatureValid
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }
                        >
                          {wh.signatureValid ? "Válida" : "Inválida"}
                        </Badge>
                      </td>
                      <td className="py-2 pr-4">
                        <Badge
                          className={
                            wh.processedOk
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }
                        >
                          {wh.processedOk ? "OK" : "Falha"}
                        </Badge>
                      </td>
                      <td className="py-2 text-gray-500">{wh.data}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
