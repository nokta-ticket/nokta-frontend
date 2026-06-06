"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  CalendarDays, MapPin, Ticket, QrCode, ChevronRight,
  TicketCheck, TicketX, Search, AlertCircle, RefreshCcw, ShoppingBag,
} from "lucide-react";
import { TicketCardSkeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/formatCurrency";
import api, { getErrorMessage } from "@/lib/axios";
import { resolveMediaUrl } from "@/lib/media";

// ── API shape ──────────────────────────────────────────────────
interface UserTicket {
  id: number;
  code: string;
  status: number; // 1=not validated, 2=validated
  createdAt: string;
  event: {
    id: number;
    nome: string;
    data: string | null;
    horario: string | null;
    thumbnail: string | null;
    endereco: { localidade: string; uf: string } | null;
  } | null;
  ticket: {
    id: number;
    nome: string;
    tipo: number;
    valor: number;
  };
}

interface PaginateInfo {
  total: number;
  perPage: number;
  currentPage: number;
  lastPage: number;
}

// ── Helpers ────────────────────────────────────────────────────
const TIPO_LABELS: Record<number, string> = {
  1: "Inteira",
  2: "Meia-entrada",
  3: "Gratuito",
};

function formatDate(raw: string | null) {
  if (!raw) return null;
  const d = new Date(raw);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString("pt-BR", {
    weekday: "short", day: "2-digit", month: "short",
    year: "numeric", timeZone: "UTC",
  });
}

function formatTime(raw: string | null) {
  if (!raw) return null;
  const d = new Date(raw);
  if (!isNaN(d.getTime()))
    return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
  return raw.slice(0, 5);
}

/* Ativo = não validado E horário do evento ainda não passou */
function isAtivo(t: UserTicket): boolean {
  if (t.status === 2) return false;
  if (!t.event?.data) return true;

  const dateOnly = t.event.data.slice(0, 10); // YYYY-MM-DD

  // Extrai HH:mm do horário — Prisma pode retornar ISO completo ou string "HH:mm:ss"
  let hhmm = "23:59";
  if (t.event.horario) {
    const h = t.event.horario;
    if (h.includes("T")) {
      // Ex: "1970-01-01T22:00:00.000Z" — extrai hora/min em UTC
      const d = new Date(h);
      hhmm = `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
    } else {
      hhmm = h.slice(0, 5); // "22:00"
    }
  }

  // Compara como UTC (mesmo critério usado no formatTime com timeZone:"UTC")
  const eventStart = new Date(`${dateOnly}T${hhmm}:00Z`);
  return eventStart > new Date();
}

// ── Ticket Card ────────────────────────────────────────────────
function TicketCard({ item, dim = false, count = 1 }: { item: UserTicket; dim?: boolean; count?: number }) {
  const isFree  = item.ticket.valor === 0;
  const date    = formatDate(item.event?.data ?? null);
  const time    = formatTime(item.event?.horario ?? null);
  const cover   = resolveMediaUrl(item.event?.thumbnail, null);

  return (
    <Link
      href={`/meus-ingressos/${item.id}`}
      className={cn("flex rounded-2xl border overflow-hidden mb-3 cursor-pointer group transition-all",
        dim ? "bg-muted/60 border-transparent" : "bg-card border-border shadow-sm hover:shadow-md hover:-translate-y-0.5"
      )}
    >
      <div className={cn(
        "relative w-[88px] shrink-0 bg-gradient-to-br from-violet-600 to-indigo-700",
        dim && "opacity-50"
      )}>
        {cover ? (
          <Image src={cover} alt={item.event?.nome ?? ""} fill className="object-cover" unoptimized />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Ticket size={26} className="text-white/60" />
          </div>
        )}
        {cover && !dim && <div className="absolute inset-0 bg-black/20" />}
        {dim && (
          <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-white/90 flex items-center justify-center">
            <TicketX size={11} className="text-gray-400" />
          </div>
        )}
        {count > 1 && (
          <div className="absolute bottom-1.5 left-1.5 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
            {count}×
          </div>
        )}
      </div>

      <div className="flex-1 p-3.5 min-w-0">
        <p className={cn("font-bold text-[14px] leading-snug line-clamp-2 mb-1.5", dim && "text-muted-foreground")}>
          {item.event?.nome ?? "Evento desconhecido"}
        </p>
        <div className="space-y-0.5 mb-2">
          {(date || time) && (
            <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
              <CalendarDays size={11} className="shrink-0" />
              <span className="capitalize">{date}{time && ` · ${time}h`}</span>
            </div>
          )}
          {item.event?.endereco && (
            <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
              <MapPin size={11} className="shrink-0" />
              <span>{item.event.endereco.localidade}/{item.event.endereco.uf}</span>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between border-t pt-2">
          <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-md", dim ? "bg-muted text-muted-foreground" : "bg-muted text-foreground")}>
            {TIPO_LABELS[item.ticket.tipo] ?? "Ingresso"}
          </span>
          <span className={cn("text-[13px] font-bold", dim ? "text-muted-foreground" : isFree ? "text-emerald-600" : "text-violet-700")}>
            {dim ? (item.status === 2 ? "Utilizado" : "Encerrado") : isFree ? "Grátis" : formatCurrency(item.ticket.valor)}
          </span>
        </div>
      </div>

      {!dim && (
        <div className="w-14 border-l border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground group-hover:text-violet-600 transition-colors shrink-0">
          <QrCode size={22} />
          <span className="text-[9px] font-bold">QR</span>
        </div>
      )}
    </Link>
  );
}

// ── Subseção com título ────────────────────────────────────────
function SubSection({
  title, count, children, muted = false,
}: {
  title: string; count: number; children: React.ReactNode; muted?: boolean;
}) {
  if (count === 0) return null;
  return (
    <div className={muted ? "mt-7" : ""}>
      <div className="flex items-baseline justify-between mb-3">
        <h2 className={cn("text-[15px] font-bold", muted && "text-muted-foreground")}>{title}</h2>
        <span className="text-[12px] font-semibold text-muted-foreground">
          {count} {count === 1 ? "ingresso" : "ingressos"}
        </span>
      </div>
      {children}
    </div>
  );
}

// ── Empty state ────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center px-6">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-violet-50">
        <Ticket size={36} className="text-violet-300" />
      </div>
      <div>
        <p className="font-semibold text-[17px]">Nenhum ingresso por aqui</p>
        <p className="text-muted-foreground text-[14px] mt-1 leading-relaxed max-w-[260px] mx-auto">
          Você ainda não tem ingressos. Que tal descobrir o que está rolando?
        </p>
      </div>
      <Link
        href="/eventos"
        className="mt-1 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-violet-700 transition-colors"
      >
        Explorar eventos
      </Link>
    </div>
  );
}

// ── Produtos: empty state (sem suporte ainda) ──────────────────
function ProdutosEmpty() {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center px-6">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
        <ShoppingBag size={36} className="text-muted-foreground/40" />
      </div>
      <div>
        <p className="font-semibold text-[17px]">Nenhum produto ainda</p>
        <p className="text-muted-foreground text-[14px] mt-1 leading-relaxed max-w-[260px] mx-auto">
          Produtos vinculados aos seus eventos aparecerão aqui.
        </p>
      </div>
    </div>
  );
}

// ── Error state ────────────────────────────────────────────────
function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-50">
        <AlertCircle size={34} className="text-red-400" />
      </div>
      <div>
        <p className="font-semibold text-lg">Não foi possível carregar seus ingressos</p>
        <p className="text-muted-foreground text-sm mt-1">{message}</p>
      </div>
      <button
        onClick={onRetry}
        className="mt-2 inline-flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-muted"
      >
        <RefreshCcw size={15} /> Tentar novamente
      </button>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────
export default function MeusIngressosPage() {
  const [items, setItems]         = useState<UserTicket[]>([]);
  const [paginate, setPaginate]   = useState<PaginateInfo | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [page, setPage]           = useState(1);
  const [filter, setFilter]       = useState<"todos" | "validos" | "usados">("todos");
  const [search, setSearch]       = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [mobileTab, setMobileTab] = useState<"ingressos" | "produtos">("ingressos");

  async function loadTickets(targetPage = page) {
    setLoading(true);
    try {
      setError(null);
      const res = await api.get(`/tickets?page=${targetPage}&limit=50`);
      setItems(res.data.data ?? []);
      setPaginate(res.data.paginate ?? null);
    } catch (err) {
      setItems([]);
      setPaginate(null);
      setError(getErrorMessage(err, "Não foi possível carregar seus ingressos."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadTickets(page); }, [page, reloadKey]);

  // Ordenados por data de compra (mais recentes primeiro)
  const sorted = useMemo(
    () => [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [items]
  );

  const ativos     = useMemo(() => sorted.filter(isAtivo),            [sorted]);
  const encerrados = useMemo(() => sorted.filter((t) => !isAtivo(t)), [sorted]);

  // Agrupa por evento — retorna apenas o primeiro de cada grupo (representante)
  // O count é passado para o card mostrar o indicador
  function agrupar(list: UserTicket[]): { item: UserTicket; count: number }[] {
    const map = new Map<string, { item: UserTicket; count: number }>();
    for (const t of list) {
      const key = String(t.event?.id ?? t.id);
      if (!map.has(key)) map.set(key, { item: t, count: 0 });
      map.get(key)!.count++;
    }
    return Array.from(map.values());
  }

  const gruposAtivos     = useMemo(() => agrupar(ativos),     [ativos]);
  const gruposEncerrados = useMemo(() => agrupar(encerrados), [encerrados]);

  // Desktop filter
  const filtered = useMemo(() => items.filter((t) => {
    if (filter === "validos" && t.status !== 1) return false;
    if (filter === "usados"  && t.status !== 2) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        t.event?.nome?.toLowerCase().includes(q) ||
        t.ticket.nome.toLowerCase().includes(q) ||
        t.code.toLowerCase().includes(q)
      );
    }
    return true;
  }), [items, filter, search]);

  const totalValid       = items.filter((t) => t.status === 1).length;
  const totalUsed        = items.filter((t) => t.status === 2).length;
  const hasActiveFilters = filter !== "todos" || search.trim().length > 0;

  const skeleton = (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => <TicketCardSkeleton key={i} />)}
    </div>
  );

  return (
    <>
      {/* ══════════════════════════════════════════════════════
          VERSÃO MOBILE  (oculta em lg+)
          ══════════════════════════════════════════════════════ */}
      <div className="lg:hidden min-h-screen bg-background pb-10">

        {/* App bar */}
        <div className="px-4 pt-5 pb-3">
          <h1 className="text-[20px] font-bold">Minha carteira</h1>
        </div>

        {/* Tabs: Ingressos / Produtos */}
        <div className="flex gap-1 mx-4 mb-5 bg-muted rounded-xl p-1">
          {(["ingressos", "produtos"] as const).map((tab) => {
            const count = tab === "ingressos" ? items.length : 0;
            return (
              <button
                key={tab}
                onClick={() => setMobileTab(tab)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[14px] font-semibold rounded-[10px] transition-all",
                  mobileTab === tab
                    ? "bg-white text-foreground shadow-sm"
                    : "text-muted-foreground"
                )}
              >
                {tab === "ingressos" ? "Ingressos" : "Produtos"}
                <span className={cn(
                  "text-[11px] font-bold px-1.5 py-0.5 rounded-full leading-none",
                  mobileTab === tab ? "bg-foreground text-background" : "bg-muted-foreground/20 text-muted-foreground"
                )}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Conteúdo */}
        <div className="px-4">
          {mobileTab === "ingressos" ? (
            loading ? skeleton
            : error ? <ErrorState message={error} onRetry={() => setReloadKey((k) => k + 1)} />
            : items.length === 0 ? <EmptyState />
            : (
              <>
                <SubSection title="Ativos" count={ativos.length}>
                  {gruposAtivos.map(({ item, count }) => (
                    <TicketCard key={item.id} item={item} count={count} />
                  ))}
                </SubSection>
                <SubSection title="Encerrados" count={encerrados.length} muted>
                  {gruposEncerrados.map(({ item, count }) => (
                    <TicketCard key={item.id} item={item} dim count={count} />
                  ))}
                </SubSection>
              </>
            )
          ) : (
            <ProdutosEmpty />
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          VERSÃO DESKTOP  (oculta abaixo de lg)
          ══════════════════════════════════════════════════════ */}
      <div className="hidden lg:block max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Ticket size={22} className="text-violet-600" /> Meus Ingressos
          </h1>
          {!loading && !error && paginate && (
            <p className="text-muted-foreground text-sm mt-1">
              {paginate.total} ingresso{paginate.total !== 1 ? "s" : ""} no total
              {totalValid > 0 && <> · <span className="text-emerald-600 font-medium">{totalValid} válido{totalValid !== 1 ? "s" : ""}</span></>}
              {totalUsed  > 0 && <> · <span className="text-muted-foreground">{totalUsed} usado{totalUsed !== 1 ? "s" : ""}</span></>}
            </p>
          )}
        </div>

        <div className="relative mb-4">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por evento, ingresso ou código..."
            className="w-full rounded-xl border bg-card pl-9 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-300 transition"
          />
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
          {(["todos", "validos", "usados"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-xs font-semibold border transition-all",
                filter === f
                  ? "bg-violet-600 text-white border-violet-600"
                  : "bg-card text-muted-foreground hover:border-violet-300"
              )}
            >
              {f === "todos" ? "Todos" : f === "validos" ? "✓ Válidos" : "× Usados"}
            </button>
          ))}
        </div>

        {loading ? skeleton
        : error ? <ErrorState message={error} onRetry={() => setReloadKey((k) => k + 1)} />
        : filtered.length === 0 && hasActiveFilters ? (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <Search size={32} className="text-muted-foreground" />
            <p className="font-semibold">Nenhum resultado</p>
            <button onClick={() => { setFilter("todos"); setSearch(""); }}
              className="rounded-xl border px-5 py-2.5 text-sm font-semibold hover:bg-muted transition">
              Limpar filtros
            </button>
          </div>
        ) : filtered.length === 0 ? <EmptyState />
        : <div className="space-y-4">{filtered.map((item) => <TicketCard key={item.id} item={item} />)}</div>}

        {!error && paginate && paginate.lastPage > 1 && (
          <div className="flex items-center justify-center gap-3 mt-8">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-40 disabled:pointer-events-none transition">
              ← Anterior
            </button>
            <span className="text-sm text-muted-foreground">{page} / {paginate.lastPage}</span>
            <button onClick={() => setPage((p) => Math.min(paginate.lastPage, p + 1))} disabled={page === paginate.lastPage}
              className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-40 disabled:pointer-events-none transition">
              Próxima →
            </button>
          </div>
        )}
      </div>
    </>
  );
}
