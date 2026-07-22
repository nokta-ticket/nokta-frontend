"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import QRCode from "react-qr-code";
import {
  ArrowLeft, CalendarDays, Clock, MapPin, Ticket,
  TicketCheck, TicketX, Gift, AlertTriangle, ExternalLink,
  Phone, Mail, Instagram, Copy, Tag, Loader2, BookOpen,
  RefreshCcw, X, Info, Download, Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TicketDetailSkeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/formatCurrency";
import { toast } from "@/lib/toast";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/axios";
import { resolveMediaUrl } from "@/lib/media";
import { RefundRequestCard } from "./_components/refund-request-card";

// ── API shape ──────────────────────────────────────────────────
interface TicketDetail {
  id: number;
  code: string;
  status: number; // 1=not validated, 2=validated
  createdAt: string;
  orderId: number;
  event: {
    id: number;
    nome: string;
    descricao?: string | null;
    data: string | null;
    horario: string | null;
    thumbnails: { id: number; path: string }[];
    endereco: {
      cep?: string;
      logradouro: string;
      bairro?: string;
      localidade: string;
      numero: string;
      uf: string;
    } | null;
  } | null;
  ticket: {
    id: number;
    nome: string;
    tipo: number;
    valor: number;
    lote: number;
  };
}

// ── Helpers ────────────────────────────────────────────────────
const TIPO_LABELS: Record<number, string> = { 1: "Inteira", 2: "Meia-entrada", 3: "Gratuito" };

function formatDate(raw: string | null) {
  if (!raw) return null;
  const d = new Date(raw);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric", timeZone: "UTC" });
}
function formatTime(raw: string | null) {
  if (!raw) return null;
  const d = new Date(raw);
  if (!isNaN(d.getTime())) return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
  return raw.slice(0, 5);
}
function formatDateShort(raw: string | null) {
  if (!raw) return "—";
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" });
}

function StatusBadge({ status }: { status: number }) {
  if (status === 2) return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-500">
      <TicketX size={14} /> Usado
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
      <TicketCheck size={14} /> Válido
    </span>
  );
}

// ── Main ───────────────────────────────────────────────────────
export default function DetalheIngressoPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const exportRef = useRef<HTMLDivElement>(null);

  const [item, setItem] = useState<TicketDetail | null | undefined>(undefined);
  const [siblings, setSiblings] = useState<{ id: number; code: string; tipo: number; lote: number }[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [showResale, setShowResale] = useState(false);
  const [resaleStep, setResaleStep] = useState<"form" | "confirm">("form");
  const [resalePreview, setResalePreview] = useState<{
    activated: boolean;
    reason: "TOO_EARLY" | "PERCENT_NOT_REACHED" | null;
    canAdd: boolean;
    sellerAmount: number;
    buyerPrice: number;
  } | null>(null);
  const [resalePreviewLoading, setResalePreviewLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resaleAccordion, setResaleAccordion] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // Transferência
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferEmail, setTransferEmail] = useState("");
  const [transferStep, setTransferStep] = useState<"form" | "confirm">("form");
  const [transferring, setTransferring] = useState(false);

  // Accordions
  const [openAbout, setOpenAbout]       = useState(false);
  const [openLocation, setOpenLocation] = useState(false);
  const [openRules, setOpenRules]       = useState(false);

  const load = async () => {
    try {
      const res = await api.get(`/tickets/${id}`);
      const data = res.data;
      setItem(data);

      // Busca ingressos do mesmo evento para o carrossel
      if (data?.event?.id) {
        const all = await api.get(`/tickets?limit=50`);
        const same = (all.data.data ?? [])
          .filter((t: any) => t.event?.id === data.event.id)
          .map((t: any) => ({ id: t.id, code: t.code, tipo: t.ticket?.tipo ?? 1, lote: t.ticket?.lote ?? 1 }));
        setSiblings(same);
      }
    } catch {
      setItem(null);
    }
  };

  useEffect(() => { load(); }, [id]);

  // Fire-and-forget: registra visualização do QR code
  useEffect(() => {
    if (item && item.code) {
      api.post(`/tickets/${id}/qr-view`).catch(() => {});
    }
  }, [item?.id]);

  const handleExport = async (format: "png" | "pdf") => {
    if (!exportRef.current) return;
    setExporting(true);
    setShowExportModal(false);

    const el = exportRef.current;

    // Temporarily reveal the element so html-to-image can capture it
    const prevOpacity = el.style.opacity;
    const prevPointerEvents = el.style.pointerEvents;
    const prevZIndex = el.style.zIndex;
    el.style.opacity = "1";
    el.style.pointerEvents = "none";
    el.style.zIndex = "9999";

    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(el, { pixelRatio: 2, cacheBust: true, skipFonts: true });

      const baseName = `ingresso-${item?.code ?? "ticket"}`;

      if (format === "png") {
        // Open in new tab — avoids Playwright/browser download interception.
        // User can right-click → "Salvar imagem como..." in the opened tab.
        const newTab = window.open();
        if (newTab) {
          newTab.document.write(`
            <html>
              <head><title>${baseName}.png</title></head>
              <body style="margin:0;background:#111;display:flex;align-items:center;justify-content:center;min-height:100vh">
                <img src="${dataUrl}" style="max-width:100%;border-radius:12px;box-shadow:0 8px 40px rgba(0,0,0,.5)" />
              </body>
            </html>
          `);
          newTab.document.close();
        } else {
          // Fallback if pop-ups are blocked
          const link = document.createElement("a");
          link.download = `${baseName}.png`;
          link.href = dataUrl;
          link.click();
        }
      } else {
        const { jsPDF } = await import("jspdf");
        const img = new window.Image();
        img.src = dataUrl;
        await new Promise<void>((resolve) => { img.onload = () => resolve(); });
        const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: [img.naturalWidth / 2, img.naturalHeight / 2] });
        pdf.addImage(dataUrl, "PNG", 0, 0, img.naturalWidth / 2, img.naturalHeight / 2);
        pdf.save(`${baseName}.pdf`);
      }
    } catch (err) {
      toast.error("Erro ao exportar. Tente novamente.");
    } finally {
      // Restore hidden state
      el.style.opacity = prevOpacity;
      el.style.pointerEvents = prevPointerEvents;
      el.style.zIndex = prevZIndex;
      setExporting(false);
    }
  };

  // ── Loading ──────────────────────────────────────────────────
  if (item === undefined) {
    return <TicketDetailSkeleton />;
  }

  // ── Not found ────────────────────────────────────────────────
  if (item === null) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-50">
          <TicketX size={36} className="text-red-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Ingresso não encontrado</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Verifique se você está logado com a conta correta.
          </p>
        </div>
        <Button onClick={() => router.push("/meus-ingressos")} variant="outline">
          ← Voltar para meus ingressos
        </Button>
      </div>
    );
  }

  const ev = item.event;
  const tk = item.ticket;
  const cover = resolveMediaUrl(ev?.thumbnails?.[0]?.path, null);
  const isFree = tk.valor === 0;
  const isUsed = item.status === 2;
  const date = formatDate(ev?.data ?? null);
  const time = formatTime(ev?.horario ?? null);

  const copyCode = async () => {
    await navigator.clipboard.writeText(item.code);
    toast.success("Código copiado!");
  };

  const openMaps = () => {
    if (!ev?.endereco) return;
    const q = encodeURIComponent(`${ev.endereco?.logradouro}, ${ev.endereco?.numero}, ${ev.endereco?.localidade}, ${ev.endereco?.uf}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, "_blank");
  };

  const openResaleModal = async () => {
    setResalePreviewLoading(true);
    setShowResale(true);
    setResaleStep("form");
    setResaleAccordion(null);
    setResalePreview(null);
    try {
      const res = await api.get(`/revenda/preview/${item.id}`);
      setResalePreview(res.data);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Não foi possível verificar a revenda.");
      setShowResale(false);
    } finally {
      setResalePreviewLoading(false);
    }
  };

  const handleResaleSubmit = async () => {
    try {
      setSubmitting(true);
      await api.post("/revenda", { userTicketId: item.id });
      toast.success("Ingresso colocado para revenda!");
      setShowResale(false);
      setResaleStep("form");
      setResalePreview(null);
      setResaleAccordion(null);
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Não foi possível colocar para revenda.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTransferSubmit = async () => {
    try {
      setTransferring(true);
      await api.post(`/tickets/${id}/transferir`, { email: transferEmail.trim() });
      toast.success("Ingresso transferido com sucesso!");
      setShowTransfer(false);
      setTransferEmail("");
      setTransferStep("form");
      router.push("/meus-ingressos");
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Não foi possível realizar a transferência.");
    } finally {
      setTransferring(false);
    }
  };

  // helper accordion
  function Accordion({ label, open, onToggle, children }: { label: string; open: boolean; onToggle: () => void; children: React.ReactNode }) {
    return (
      <div className="border-b last:border-b-0">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-between px-4 py-3.5 text-[13px] font-semibold text-gray-700 hover:text-gray-900 transition-colors"
        >
          {label}
          <svg
            xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24"
            className={cn("transition-transform text-muted-foreground", open && "rotate-180")}
          >
            <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
          </svg>
        </button>
        {open && <div className="px-4 pb-4 text-sm text-muted-foreground">{children}</div>}
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen bg-white pb-20", isUsed && "grayscale")}>


      {/* ── BANNER ──────────────────────────────────── */}
      <div className="relative h-[200px] w-full overflow-hidden">
        {!cover && (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" />
        )}
        {cover && (
          <Image src={cover} alt={ev?.nome ?? ""} fill className="object-cover" unoptimized />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Conteúdo do banner */}
        <div className="absolute bottom-6 left-5 right-5 z-10">
          {(date || time) && (
            <p className="text-white/70 text-[11px] font-semibold tracking-[0.15em] uppercase mb-1.5">
              {date}{time && ` · ${time}h`}
            </p>
          )}
          <h1 className="text-white font-bold text-[22px] leading-tight line-clamp-2 drop-shadow">
            {ev?.nome}
          </h1>
        </div>
      </div>

      {/* ── CORPO ───────────────────────────────────── */}
      <div className="px-4 max-w-2xl mx-auto space-y-3 mt-4">

        {/* Card do QR ─ protagonista */}
        <div className="rounded-xl overflow-hidden border border-gray-200 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.08)]">

          {/* Faixa Nokta */}
          <div className="h-[3px] w-full bg-gradient-to-r from-[#9944CC] via-[#D86CFA] to-[#3399FF]" />

          {/* Header do ticket */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
            <div>
              <p className="text-[11px] font-bold tracking-[0.18em] uppercase text-gray-800">
                {isUsed ? "Ingresso utilizado" : "Ingresso digital"}
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {isUsed ? "Validado na entrada" : "Apresente na entrada do evento"}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-semibold tracking-widest uppercase text-gray-400 border border-gray-200 px-2 py-0.5 rounded">
                {TIPO_LABELS[siblings.length > 1 ? (siblings[activeIdx]?.tipo ?? tk.tipo) : tk.tipo] ?? "Ingresso"}
              </span>
              <span className="text-[10px] font-semibold tracking-widest uppercase text-gray-400 border border-gray-200 px-2 py-0.5 rounded">
                L{siblings.length > 1 ? (siblings[activeIdx]?.lote ?? tk.lote) : tk.lote}
              </span>
            </div>
          </div>

          {/* QR — carrossel se houver múltiplos ingressos do mesmo evento */}
          {siblings.length > 1 ? (
            <div>
              <div
                ref={carouselRef}
                className="flex overflow-x-auto"
                style={{ scrollSnapType: "x mandatory", scrollbarWidth: "none" }}
                onScroll={(e) => {
                  const el = e.currentTarget;
                  const idx = Math.round(el.scrollLeft / el.offsetWidth);
                  setActiveIdx(idx);
                }}
              >
                {siblings.map((s, idx) => (
                  <div
                    key={s.id}
                    className="flex-none w-full flex flex-col items-center px-8 py-8 bg-[#f7f7f8]"
                    style={{ scrollSnapAlign: "start" }}
                  >
                    <QRCode value={s.code} size={216} fgColor="#000000" bgColor="#f7f7f8" />
                    <p className="mt-3 text-[10px] font-semibold tracking-widest uppercase text-gray-400">
                      {idx + 1} / {siblings.length}
                    </p>
                  </div>
                ))}
              </div>
              {/* Dots */}
              <div className="flex justify-center gap-1.5 pb-3">
                {siblings.map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-1 rounded-full transition-all",
                      i === activeIdx ? "w-4 bg-violet-500" : "w-1.5 bg-gray-300"
                    )}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className={cn("flex justify-center px-8 py-8 bg-[#f7f7f8]", isUsed && "opacity-30")}>
              <QRCode value={item.code} size={216} fgColor="#000000" bgColor="#f7f7f8" />
            </div>
          )}

          {isUsed && (
            <div className="mx-5 mb-4 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded px-4 py-2.5 text-[12px] text-gray-500 justify-center">
              <Info size={12} /> Este ingresso já foi validado
            </div>
          )}

          {/* Rodapé com código */}
          <div className="border-t border-dashed border-gray-200 mx-5" />
          <button
            onClick={async () => {
              const code = siblings.length > 1 ? (siblings[activeIdx]?.code ?? item.code) : item.code;
              await navigator.clipboard.writeText(code);
              toast.success("Código copiado!");
            }}
            className="w-full flex items-center justify-center gap-2 px-5 py-3.5 text-[11px] font-mono text-gray-500 hover:text-violet-600 hover:bg-gray-50 transition-colors"
          >
            <Copy size={11} className="text-gray-300" />
            {siblings.length > 1 ? (siblings[activeIdx]?.code ?? item.code) : item.code}
          </button>
        </div>



        {/* Ações principais */}
        <div className="grid grid-cols-2 gap-2.5">
          {!isUsed ? (
            <button
              onClick={() => { setShowTransfer(true); setTransferStep("form"); setTransferEmail(""); }}
              className="flex items-center justify-center gap-2 rounded-lg py-3 text-[13px] font-semibold text-violet-600 border border-violet-200 hover:bg-violet-50 active:scale-[0.98] transition-all"
            >
              <Send size={14} /> Transferir
            </button>
          ) : (
            <div className="rounded-lg border border-gray-100 bg-gray-50 flex items-center justify-center text-[12px] text-gray-400 font-medium">
              Não transferível
            </div>
          )}
          <button
            onClick={() => setShowExportModal(true)}
            disabled={exporting}
            className="flex items-center justify-center gap-2 rounded-lg py-3 text-[13px] font-semibold text-white bg-violet-600 hover:bg-violet-700 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {exporting ? <><Loader2 size={14} className="animate-spin" /> Gerando</> : <><Download size={14} /> Exportar Ingresso</>}
          </button>
        </div>

        {/* Revenda */}
        {!isUsed && tk.valor > 0 && (
          <button
            onClick={openResaleModal}
            className="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-[13px] font-medium text-gray-500 border border-gray-200 hover:border-violet-300 hover:text-violet-600 transition-colors"
          >
            <RefreshCcw size={13} /> Não poderei comparecer
          </button>
        )}

        {/* Cancelamento (arrependimento até 7 dias) */}
        {tk.valor > 0 && (
          <RefundRequestCard
            orderId={item.orderId}
            userTicketId={item.id}
            ticketValue={tk.valor}
            ticketStatus={item.status}
            purchasedAt={item.createdAt}
          />
        )}

        {/* Meta */}
        <div className="flex justify-between text-[10px] font-semibold tracking-[0.12em] uppercase text-gray-400 border-t border-dashed border-gray-200 pt-3">
          <span>Ingresso #{item.id}</span>
          <span>Nokta Tickets</span>
        </div>

        {/* Accordions */}
        <div className="rounded-2xl overflow-hidden border border-gray-100 bg-white shadow-sm divide-y divide-gray-100">
          {ev?.descricao && (
            <Accordion label="Sobre o evento" open={openAbout} onToggle={() => setOpenAbout(v => !v)}>
              <p className="text-gray-500 whitespace-pre-line leading-relaxed">{ev.descricao}</p>
            </Accordion>
          )}
          {ev?.endereco && (
            <Accordion label="Localização" open={openLocation} onToggle={() => setOpenLocation(v => !v)}>
              <p className="text-gray-500 leading-relaxed">
                {ev.endereco?.logradouro}, {ev.endereco?.numero}
                {ev.endereco?.bairro && ` · ${ev.endereco.bairro}`}
                <br />{ev.endereco?.localidade}/{ev.endereco?.uf}
                {ev.endereco?.cep && ` · CEP ${ev.endereco.cep}`}
              </p>
              <button onClick={openMaps} className="mt-2 flex items-center gap-1 text-violet-600 text-xs font-medium hover:text-violet-700 transition-colors">
                <ExternalLink size={11} /> Abrir no Google Maps
              </button>
            </Accordion>
          )}
          <Accordion label="Regras do ingresso" open={openRules} onToggle={() => setOpenRules(v => !v)}>
            <ul className="text-gray-500 space-y-1.5 list-disc list-inside leading-relaxed">
              <li>Apresente o QR Code na entrada mesmo sem internet</li>
              <li>Chegue com antecedência para evitar filas</li>
              <li>Documento de identidade pode ser solicitado</li>
              <li>Ingresso válido para 1 pessoa</li>
            </ul>
          </Accordion>
        </div>
      </div>

        {/* ── Hidden Export Card ────────────────────── */}
        <div
          ref={exportRef}
          style={{
            position: "fixed",
            top: "0",
            left: "0",
            opacity: 0,
            pointerEvents: "none",
            zIndex: -1,
            width: "400px",
            fontFamily: "'Segoe UI', system-ui, sans-serif",
            borderRadius: "16px",
            overflow: "hidden",
            boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
          }}
        >
          {/* Rainbow band */}
          <div style={{ height: "6px", background: "linear-gradient(90deg, #7c3aed, #6366f1, #10b981)" }} />

          {/* Header */}
          <div style={{ background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 60%, #312e81 100%)", padding: "24px 24px 20px", position: "relative" }}>
            <div style={{ marginBottom: "4px", fontSize: "11px", fontWeight: 700, letterSpacing: "3px", color: "rgba(255,255,255,0.6)", textTransform: "uppercase" }}>NOKTA TICKETS</div>
            <div style={{ fontSize: "22px", fontWeight: 800, color: "#fff", lineHeight: 1.2, marginBottom: "6px" }}>{ev?.nome ?? "Evento"}</div>
            <div style={{ display: "inline-block", background: isFree ? "rgba(16,185,129,0.25)" : "rgba(255,255,255,0.15)", borderRadius: "20px", padding: "3px 10px", fontSize: "12px", fontWeight: 600, color: isFree ? "#6ee7b7" : "#e0e7ff" }}>
              {TIPO_LABELS[tk.tipo] ?? "Ingresso"} · Lote {tk.lote}
            </div>
          </div>

          {/* Tear line */}
          <div style={{ background: "#f8f7ff", display: "flex", alignItems: "center", padding: "0 16px" }}>
            <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "#fff", border: "2px solid #e5e7eb", marginLeft: "-26px", flexShrink: 0 }} />
            <div style={{ flex: 1, borderTop: "2px dashed #d1d5db" }} />
            <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "#fff", border: "2px solid #e5e7eb", marginRight: "-26px", flexShrink: 0 }} />
          </div>

          {/* Body */}
          <div style={{ background: "#f8f7ff", padding: "20px 24px 0" }}>
            {/* Info row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
              <div>
                <div style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "1.5px", color: "#7c3aed", textTransform: "uppercase", marginBottom: "3px" }}>Data</div>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "#1e1b4b" }}>{formatDateShort(ev?.data ?? null)}</div>
                {ev?.horario && <div style={{ fontSize: "12px", color: "#6b7280" }}>{formatTime(ev.horario)}h</div>}
              </div>
              <div>
                <div style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "1.5px", color: "#7c3aed", textTransform: "uppercase", marginBottom: "3px" }}>Local</div>
                <div style={{ fontSize: "12px", fontWeight: 600, color: "#1e1b4b" }}>{ev?.endereco ? `${ev.endereco.localidade}/${ev.endereco.uf}` : "—"}</div>
              </div>
              <div>
                <div style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "1.5px", color: "#7c3aed", textTransform: "uppercase", marginBottom: "3px" }}>Titular</div>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "#1e1b4b" }}>{user?.nome ?? "—"} {user?.sobrenome ?? ""}</div>
              </div>
              <div>
                <div style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "1.5px", color: "#7c3aed", textTransform: "uppercase", marginBottom: "3px" }}>CPF</div>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "#1e1b4b", letterSpacing: "1px" }}>{user?.cpf ? user.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4") : "—"}</div>
              </div>
              <div>
                <div style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "1.5px", color: "#7c3aed", textTransform: "uppercase", marginBottom: "3px" }}>Valor</div>
                <div style={{ fontSize: "15px", fontWeight: 800, color: isFree ? "#059669" : "#7c3aed" }}>{isFree ? "Grátis" : formatCurrency(tk.valor)}</div>
              </div>
              <div>
                <div style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "1.5px", color: "#7c3aed", textTransform: "uppercase", marginBottom: "3px" }}>Status</div>
                <div style={{ fontSize: "12px", fontWeight: 700, color: isUsed ? "#6b7280" : "#059669" }}>{isUsed ? "Utilizado" : "✓ Válido"}</div>
              </div>
            </div>

            {/* QR + code */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", padding: "16px", background: "#fff", borderRadius: "12px", marginBottom: "20px" }}>
              <QRCode value={item.code} size={140} />
              <div style={{ fontSize: "12px", fontFamily: "monospace", fontWeight: 700, letterSpacing: "2px", color: "#4c1d95" }}>{item.code}</div>
              <div style={{ fontSize: "10px", color: "#9ca3af", textAlign: "center" }}>Apresente na entrada · Ingresso pessoal e intransferível</div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ background: "#ede9fe", padding: "10px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: "10px", color: "#7c3aed", fontWeight: 700, letterSpacing: "1px" }}>NOKTA TICKETS</div>
            <div style={{ fontSize: "9px", color: "#a78bfa" }}>nokta.com.br</div>
          </div>
        </div>

      {/* ── Save Modal ───────────────────────────────── */}
      {showExportModal && (() => {
        const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
        const isIOS     = /iPad|iPhone|iPod/.test(ua);
        const isAndroid = /Android/.test(ua);
        const isMobile  = isIOS || isAndroid;

        const handleSaveImage = async () => {
          if (!exportRef.current) return;
          setExporting(true);
          setShowExportModal(false);
          const el = exportRef.current;
          const prev = { opacity: el.style.opacity, pe: el.style.pointerEvents, z: el.style.zIndex };
          el.style.opacity = "1"; el.style.pointerEvents = "none"; el.style.zIndex = "9999";
          try {
            const { toPng } = await import("html-to-image");
            const dataUrl = await toPng(el, { pixelRatio: 2, cacheBust: true, skipFonts: true });
            const blob = await (await fetch(dataUrl)).blob();
            const file = new File([blob], `ingresso-${item?.code ?? "ticket"}.png`, { type: "image/png" });
            if (navigator.canShare?.({ files: [file] })) {
              await navigator.share({ files: [file], title: ev?.nome ?? "Ingresso" });
            } else {
              const link = document.createElement("a");
              link.download = file.name;
              link.href = dataUrl;
              link.click();
            }
          } catch { toast.error("Erro ao salvar. Tente novamente."); }
          finally {
            el.style.opacity = prev.opacity; el.style.pointerEvents = prev.pe; el.style.zIndex = prev.z;
            setExporting(false);
          }
        };

        return (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center px-4 pt-4 pb-[max(16px,env(safe-area-inset-bottom))]">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden max-h-[85dvh] overflow-y-auto">

              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
                <div>
                  <h2 className="text-[16px] font-bold text-gray-900">Salvar Ingresso</h2>
                  <p className="text-[12px] text-gray-400 mt-0.5">Escolha onde deseja salvar seu ingresso</p>
                </div>
                <button onClick={() => setShowExportModal(false)} className="text-gray-400 hover:text-gray-700 transition">
                  <X size={18} />
                </button>
              </div>

              <div className="px-4 py-3 space-y-2">

                {/* Carteira digital — recomendado */}
                {isMobile && (
                  <div>
                    <p className="text-[10px] font-semibold tracking-widest uppercase text-gray-400 mb-2 px-1">
                      Adicionar à carteira
                    </p>
                    <button
                      onClick={() => { setShowExportModal(false); toast.success("Em breve disponível!"); }}
                      className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border-2 border-violet-200 bg-violet-50 hover:bg-violet-100 transition-colors text-left"
                    >
                      <div className="flex items-center justify-center shrink-0">
                        {isIOS ? (
                          /* Apple Wallet icon */
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="28" height="28">
                            <path fill="#1e1e1f" d="M26,0H94a25.9482,25.9482,0,0,1,26,26V94a25.9482,25.9482,0,0,1-26,26H26A25.9482,25.9482,0,0,1,0,94V26A26.012,26.012,0,0,1,26,0Z"/>
                            <path fill="#fff" fillRule="evenodd" d="M24,30H96a6.01764,6.01764,0,0,1,6,6V70a6.01764,6.01764,0,0,1-6,6H24a6.01764,6.01764,0,0,1-6-6V36A6.01764,6.01764,0,0,1,24,30Z"/>
                            <path fill="#d9d6cc" fillRule="evenodd" d="M22,26H98a8.02352,8.02352,0,0,1,8,8V86a8.02352,8.02352,0,0,1-8,8H22a8.02352,8.02352,0,0,1-8-8V34A8.02352,8.02352,0,0,1,22,26Z"/>
                            <path fill="#3b99c9" fillRule="evenodd" d="M24,30H96a6.01764,6.01764,0,0,1,6,6V70a6.01764,6.01764,0,0,1-6,6H24a6.01764,6.01764,0,0,1-6-6V36A6.01764,6.01764,0,0,1,24,30Z"/>
                            <path fill="#ffb003" fillRule="evenodd" d="M24,37H96a6.01764,6.01764,0,0,1,6,6V55a6.01764,6.01764,0,0,1-6,6H24a6.01764,6.01764,0,0,1-6-6V43A6.01764,6.01764,0,0,1,24,37Z"/>
                            <path fill="#50be3d" fillRule="evenodd" d="M24,44H96a6.01764,6.01764,0,0,1,6,6V62a6.01764,6.01764,0,0,1-6,6H24a6.01764,6.01764,0,0,1-6-6V50A6.01764,6.01764,0,0,1,24,44Z"/>
                            <path fill="#f26d5f" fillRule="evenodd" d="M24,51H96a6.01764,6.01764,0,0,1,6,6V69a6.01764,6.01764,0,0,1-6,6H24a6.01764,6.01764,0,0,1-6-6V57A6.01764,6.01764,0,0,1,24,51Z"/>
                            <path fill="#d9d6cc" fillRule="evenodd" d="M14,58h92V86a8.02352,8.02352,0,0,1-8,8H22a8.02352,8.02352,0,0,1-8-8Zm27,0c9,0,10,11.5,19,11.5S70,58,79,58Z"/>
                          </svg>
                        ) : (
                          /* Google Wallet icon */
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="28" height="28" fillRule="evenodd" strokeLinejoin="round" strokeMiterlimit="2" clipRule="evenodd">
                            <path fill="#34a853" d="M510.992 192.735V107.73c0-49.084-36.4-89.087-81.06-89.087H82.082C37.398 19.09 1 59.093 1 107.73v85.004c0 8.634 6.212 15.462 14.069 15.462h481.876c7.856 0 14.047-6.828 14.047-15.462z"/>
                            <path fill="#fbbc04" d="M510.992 267.298V182.74c0-49.107-36.4-89.11-81.06-89.11H82.082C37.398 93.63 1 133.633 1 182.74v85.004c0 8.634 6.212 15.462 14.069 15.462h481.876c7.856-.47 14.047-7.274 14.047-15.908"/>
                            <path fill="#ea4335" d="M510.992 342.308v-85.005c0-49.106-36.4-89.11-81.06-89.11H82.082C37.398 168.193 1 208.197 1 257.303v85.005c0 8.634 6.212 15.438 14.069 15.438h481.876c7.856-.446 14.047-7.273 14.047-15.438"/>
                            <path fill="#4285f4" d="M325.282 301.39 1 218.66v187.278c0 49.106 36.399 89.11 81.081 89.11h347.851c44.66 0 81.06-40.004 81.06-89.11V215.024l-77.345 61.823c-31.425 24.988-70.728 34.091-108.365 24.542z"/>
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-[14px] font-semibold text-gray-900">
                            {isIOS ? "Apple Wallet" : "Google Wallet"}
                          </p>
                          <span className="text-[10px] font-bold text-violet-600 bg-violet-100 px-1.5 py-0.5 rounded tracking-wide">
                            Recomendado
                          </span>
                        </div>
                        <p className="text-[12px] text-gray-400">
                          {isIOS ? "Adicionar ao Apple Wallet" : "Adicionar ao Google Wallet"}
                        </p>
                      </div>
                    </button>
                  </div>
                )}

                {/* PDF e Imagem */}
                <div>
                  <p className="text-[10px] font-semibold tracking-widest uppercase text-gray-400 mb-2 px-1">
                    Outras opções
                  </p>
                  <div className="space-y-2">
                    <button
                      onClick={() => { handleExport("pdf"); setShowExportModal(false); }}
                      className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="flex items-center justify-center shrink-0">
                        <svg viewBox="0 0 512 512" width="32" height="32" xmlns="http://www.w3.org/2000/svg">
                          <path fill="#e53e3e" d="M378.413,0H208.297h-13.182L185.8,9.314L57.02,138.102l-9.314,9.314v13.176v265.514c0,47.36,38.528,85.895,85.896,85.895h244.811c47.353,0,85.881-38.535,85.881-85.895V85.896C464.294,38.528,425.766,0,378.413,0zM432.497,426.105c0,29.877-24.214,54.091-54.084,54.091H133.602c-29.884,0-54.098-24.214-54.098-54.091V160.591h83.716c24.885,0,45.077-20.178,45.077-45.07V31.804h170.116c29.87,0,54.084,24.214,54.084,54.092V426.105z"/>
                          <path fill="#e53e3e" d="M171.947,252.785h-28.529c-5.432,0-8.686,3.533-8.686,8.825v73.754c0,6.388,4.204,10.599,10.041,10.599c5.711,0,9.914-4.21,9.914-10.599v-22.406c0-0.545,0.279-0.817,0.824-0.817h16.436c20.095,0,32.188-12.226,32.188-29.612C204.136,264.871,192.182,252.785,171.947,252.785zM170.719,294.888h-15.208c-0.545,0-0.824-0.272-0.824-0.81v-23.23c0-0.545,0.279-0.816,0.824-0.816h15.208c8.42,0,13.447,5.027,13.447,12.498C184.167,290,179.139,294.888,170.719,294.888z"/>
                          <path fill="#e53e3e" d="M250.191,252.785h-21.868c-5.432,0-8.686,3.533-8.686,8.825v74.843c0,5.3,3.253,8.693,8.686,8.693h21.868c19.69,0,31.923-6.249,36.81-21.324c1.76-5.3,2.723-11.681,2.723-24.857c0-13.175-0.964-19.557-2.723-24.856C282.113,259.034,269.881,252.785,250.191,252.785zM267.856,316.896c-2.318,7.331-8.965,10.459-18.21,10.459h-9.23c-0.545,0-0.824-0.272-0.824-0.816v-55.146c0-0.545,0.279-0.817,0.824-0.817h9.23c9.245,0,15.892,3.128,18.21,10.46c0.95,3.128,1.62,8.56,1.62,17.93C269.476,308.336,268.805,313.768,267.856,316.896z"/>
                          <path fill="#e53e3e" d="M361.167,252.785h-44.812c-5.432,0-8.7,3.533-8.7,8.825v73.754c0,6.388,4.218,10.599,10.055,10.599c5.697,0,9.914-4.21,9.914-10.599v-26.351c0-0.538,0.265-0.81,0.81-0.81h26.086c5.837,0,9.23-3.532,9.23-8.56c0-5.028-3.393-8.553-9.23-8.553h-26.086c-0.545,0-0.81-0.272-0.81-0.817v-19.425c0-0.545,0.265-0.816,0.81-0.816h32.733c5.572,0,9.245-3.666,9.245-8.553C370.411,256.45,366.738,252.785,361.167,252.785z"/>
                        </svg>
                      </div>
                      <div>
                        <p className="text-[14px] font-semibold text-gray-900">Baixar PDF</p>
                        <p className="text-[12px] text-gray-400">Ideal para imprimir ou enviar</p>
                      </div>
                    </button>

                    <button
                      onClick={handleSaveImage}
                      disabled={exporting}
                      className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-left disabled:opacity-50"
                    >
                      <div className="flex items-center justify-center shrink-0">
                        <Download size={28} className="text-blue-500" />
                      </div>
                      <div>
                        <p className="text-[14px] font-semibold text-gray-900">Salvar imagem</p>
                        <p className="text-[12px] text-gray-400">Salvar ingresso completo na galeria</p>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              <div className="px-5 pb-5 pt-2">
                <button
                  onClick={() => setShowExportModal(false)}
                  className="w-full py-3 rounded-xl border border-gray-200 text-[13px] font-semibold text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Transfer Modal ───────────────────────── */}
      {showTransfer && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center px-4 pt-4 pb-[max(16px,env(safe-area-inset-bottom))]">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-5 max-h-[85dvh] overflow-y-auto">

            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-[17px] font-bold text-gray-900">
                  {transferStep === "form" ? "Transferir ingresso" : "Confirmar transferência?"}
                </h2>
                <p className="text-[13px] text-gray-400 mt-0.5">
                  {transferStep === "form" ? "Envie este ingresso para outra pessoa" : "Revise antes de confirmar"}
                </p>
              </div>
              <button
                onClick={() => { setShowTransfer(false); setTransferStep("form"); }}
                className="text-gray-400 hover:text-gray-700 transition mt-0.5"
              >
                <X size={18} />
              </button>
            </div>

            {transferStep === "form" ? (
              <>
                {/* Card de aviso */}
                <div className="rounded-xl bg-violet-50 border border-violet-200 px-4 py-3 space-y-1.5">
                  <p className="text-[13px] font-semibold text-violet-800 flex items-center gap-1.5">
                    <Info size={14} className="shrink-0" /> Antes de continuar
                  </p>
                  <p className="text-[13px] text-gray-700 leading-relaxed">
                    Use a transferência apenas para enviar seu ingresso para alguém de confiança.
                  </p>
                  <p className="text-[13px] text-gray-700 leading-relaxed">
                    Ao confirmar, o ingresso sai da sua carteira e passa automaticamente para a conta da outra pessoa.
                  </p>
                  <p className="text-[13px] text-gray-700 leading-relaxed">
                    Quer vender o ingresso? Use a <strong className="text-violet-700">revenda oficial da Nokta</strong> para evitar golpe, duplicidade ou problemas na entrada.
                  </p>
                </div>

                {/* Campo de e-mail */}
                <div className="space-y-1.5">
                  <Label htmlFor="transfer-email" className="text-[13px] font-semibold text-gray-700">
                    E-mail de quem vai receber
                  </Label>
                  <Input
                    id="transfer-email"
                    type="email"
                    placeholder="exemplo@email.com"
                    value={transferEmail}
                    onChange={(e) => setTransferEmail(e.target.value)}
                    className="h-11"
                  />
                  <p className="text-[12px] text-gray-500">A pessoa precisa ter uma conta Nokta com este e-mail.</p>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setShowTransfer(false)}>
                    Cancelar
                  </Button>
                  <Button
                    className="flex-1 bg-violet-600 hover:bg-violet-700"
                    disabled={!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(transferEmail)}
                    onClick={() => setTransferStep("confirm")}
                  >
                    Continuar
                  </Button>
                </div>
              </>
            ) : (
              <>
                {/* Confirmação */}
                <div className="space-y-4">
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-1">
                    <p className="text-[13px] text-gray-500">Você está enviando este ingresso para:</p>
                    <p className="font-bold text-gray-900 text-[16px] break-all">{transferEmail}</p>
                    <p className="text-[12px] text-gray-400 pt-0.5">Confira o e-mail antes de continuar.</p>
                  </div>
                  <p className="text-[13px] text-gray-600 leading-relaxed">
                    Após confirmar, o ingresso será transferido automaticamente para esta conta e não aparecerá mais na sua carteira.
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1"
                    onClick={() => setTransferStep("form")} disabled={transferring}>
                    Voltar
                  </Button>
                  <Button className="flex-1 bg-violet-600 hover:bg-violet-700"
                    onClick={handleTransferSubmit} disabled={transferring}>
                    {transferring
                      ? <><Loader2 size={14} className="animate-spin mr-1.5" /> Transferindo…</>
                      : "Confirmar transferência"}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Resale Modal ─────────────────────────── */}
      {showResale && (() => {
        const closeResale = () => {
          setShowResale(false);
          setResaleStep("form");
          setResalePreview(null);
          setResaleAccordion(null);
        };

        const accordions = [
          {
            title: "O que acontece com meu ingresso?",
            content: (
              <div className="space-y-2 text-[13px] text-gray-600 leading-relaxed">
                <p>Enquanto o ingresso estiver na revenda, o QR Code fica suspenso e não poderá ser usado na entrada.</p>
                <p>Se você remover o ingresso da revenda antes de ele ser vendido, o QR Code volta a ficar válido normalmente.</p>
                <p>Se o ingresso for vendido, ele será transferido automaticamente para o comprador e deixará de aparecer na sua carteira.</p>
              </div>
            ),
          },
          {
            title: "Quanto eu recebo?",
            content: (
              <div className="space-y-2 text-[13px] text-gray-600 leading-relaxed">
                <p>Você recebe no máximo o valor que pagou pelo ingresso.</p>
                <p>A revenda não permite lucro para o vendedor.</p>
                <p>Se você comprou por {formatCurrency(tk.valor)}, poderá revender por até {formatCurrency(tk.valor)}.</p>
                <p>Taxas, diferenças de lote ou valores cobrados do comprador seguem as regras da plataforma e não representam lucro para o vendedor.</p>
              </div>
            ),
          },
          {
            title: "Até quando posso revender?",
            content: (
              <div className="space-y-2 text-[13px] text-gray-600 leading-relaxed">
                <p>A revenda fica disponível até 4 horas antes do início do evento.</p>
                <p>Depois desse prazo, o ingresso não poderá mais ser colocado à venda.</p>
              </div>
            ),
          },
          {
            title: "Posso cancelar a revenda?",
            content: (
              <div className="space-y-2 text-[13px] text-gray-600 leading-relaxed">
                <p>Sim. Enquanto o ingresso não for vendido, você pode remover ele da revenda.</p>
                <p>Ao remover, o QR Code volta a ficar ativo e você poderá usar o ingresso normalmente.</p>
              </div>
            ),
          },
          {
            title: "⚠️ Importante",
            content: (
              <div className="space-y-2 text-[13px] text-gray-600 leading-relaxed">
                <p>Não venda seu ingresso por fora.</p>
                <p>A revenda oficial evita golpe, duplicidade, problemas na entrada e conflitos entre comprador e vendedor.</p>
                <p>Depois que o ingresso for vendido, a venda não poderá ser desfeita pelo vendedor.</p>
              </div>
            ),
          },
        ];

        return (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center px-4 pt-4 pb-[max(16px,env(safe-area-inset-bottom))]">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90dvh] overflow-y-auto">

              {/* Header */}
              <div className="flex items-start justify-between px-5 pt-5 pb-4 border-b border-gray-100">
                <div>
                  <h2 className="text-[17px] font-bold text-gray-900">
                    {resaleStep === "form" ? "Colocar para revenda" : "Confirmar revenda?"}
                  </h2>
                  <p className="text-[13px] text-gray-400 mt-0.5">
                    {resaleStep === "form" ? "Venda seu ingresso com segurança pela Nokta" : "Revise antes de anunciar"}
                  </p>
                </div>
                <button onClick={closeResale} className="text-gray-400 hover:text-gray-700 transition mt-0.5">
                  <X size={18} />
                </button>
              </div>

              {resaleStep === "form" ? (
                <div className="px-5 py-4 space-y-4">

                  {/* Estado: carregando preview */}
                  {resalePreviewLoading && (
                    <div className="flex items-center justify-center py-6 gap-2 text-gray-400 text-[13px]">
                      <Loader2 size={16} className="animate-spin" /> Carregando informações…
                    </div>
                  )}

                  {/* Estado: revenda não liberada */}
                  {!resalePreviewLoading && resalePreview && !resalePreview.activated && (
                    <div className="rounded-xl bg-gray-50 border border-gray-200 px-4 py-4 text-center space-y-1.5">
                      <p className="text-[14px] font-semibold text-gray-700">Revenda não disponível</p>
                      {resalePreview.reason === "TOO_EARLY" ? (
                        <>
                          <p className="text-[13px] text-gray-500 leading-relaxed">
                            A revenda ainda não foi liberada para este evento.
                          </p>
                          <p className="text-[12px] text-gray-400">
                            Ela é liberada automaticamente quando faltarem 15 dias para o evento ou quando 60% dos ingressos forem vendidos.
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-[13px] text-gray-500 leading-relaxed">
                            A revenda será liberada quando 60% dos ingressos forem vendidos.
                          </p>
                          <p className="text-[12px] text-gray-400">
                            Você também pode aguardar os 15 dias antes do evento para a liberação automática.
                          </p>
                        </>
                      )}
                    </div>
                  )}

                  {/* Estado: limite atingido */}
                  {!resalePreviewLoading && resalePreview && !resalePreview.canAdd && (
                    <div className="rounded-xl bg-gray-50 border border-gray-200 px-4 py-4 text-center space-y-1">
                      <p className="text-[14px] font-semibold text-gray-700">Limite atingido</p>
                      <p className="text-[13px] text-gray-500">
                        Você atingiu o limite de alterações de revenda para este ingresso.
                      </p>
                    </div>
                  )}

                  {/* Estado: revenda disponível */}
                  {!resalePreviewLoading && resalePreview && resalePreview.activated && resalePreview.canAdd && (
                    <>
                      {/* Card principal */}
                      <div className="rounded-xl bg-violet-50 border border-violet-200 px-4 py-3.5 space-y-2">
                        <p className="text-[13px] font-semibold text-violet-800 flex items-center gap-1.5">
                          <Info size={14} className="shrink-0" /> Revenda oficial da Nokta
                        </p>
                        <p className="text-[13px] text-gray-700 leading-relaxed">
                          Seu ingresso será anunciado para outros compradores dentro da plataforma.
                        </p>
                        <p className="text-[13px] text-gray-700 leading-relaxed">
                          Enquanto o ingresso estiver anunciado, o QR Code ficará suspenso para evitar uso duplicado.
                        </p>
                      </div>

                      {/* Preços calculados (somente leitura) */}
                      <div className="rounded-xl border border-gray-200 overflow-hidden divide-y divide-gray-100">
                        <div className="flex items-center justify-between px-4 py-3.5">
                          <span className="text-[13px] text-gray-600">Você receberá</span>
                          <span className="text-[15px] font-bold text-violet-700">
                            {formatCurrency(resalePreview.sellerAmount)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between px-4 py-3.5">
                          <span className="text-[13px] text-gray-600">Preço final para o comprador</span>
                          <span className="text-[15px] font-bold text-gray-800">
                            {formatCurrency(resalePreview.buyerPrice)}
                          </span>
                        </div>
                        <div className="px-4 py-2.5 bg-gray-50">
                          <p className="text-[12px] text-gray-400 leading-relaxed">
                            O valor que você receberá é exatamente o valor pago originalmente.
                            Todas as taxas são pagas pelo novo comprador.
                          </p>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Accordions informativos */}
                  <div className="rounded-xl border border-gray-100 overflow-hidden divide-y divide-gray-100">
                    {accordions.map((acc, i) => (
                      <div key={i}>
                        <button
                          onClick={() => setResaleAccordion(resaleAccordion === i ? null : i)}
                          className="w-full flex items-center justify-between px-4 py-3.5 text-[13px] font-semibold text-gray-700 hover:text-gray-900 text-left transition-colors"
                        >
                          <span>{acc.title}</span>
                          <svg
                            xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24"
                            className={cn("shrink-0 ml-2 transition-transform text-gray-400", resaleAccordion === i && "rotate-180")}
                          >
                            <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
                          </svg>
                        </button>
                        {resaleAccordion === i && (
                          <div className="px-4 pb-4">{acc.content}</div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Botões */}
                  {!resalePreviewLoading && (
                    <div className="flex gap-3 pt-1 pb-1">
                      <Button variant="outline" className="flex-1" onClick={closeResale}>
                        Cancelar
                      </Button>
                      <Button
                        className="flex-1 bg-violet-600 hover:bg-violet-700"
                        disabled={!resalePreview || !resalePreview.activated || !resalePreview.canAdd}
                        onClick={() => setResaleStep("confirm")}
                      >
                        Continuar
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="px-5 py-4 space-y-4">

                  <p className="text-[13px] text-gray-600">Você está colocando este ingresso na revenda oficial:</p>

                  {/* Card de revisão */}
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-1">
                    <p className="font-bold text-gray-900 text-[15px]">{ev?.nome ?? "Evento"}</p>
                    <p className="text-[13px] text-gray-500">
                      {TIPO_LABELS[tk.tipo] ?? "Ingresso"} · Lote {tk.lote}
                    </p>
                    <div className="pt-2.5 mt-1 border-t border-gray-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-[12px] text-gray-400">Você receberá</p>
                        <p className="text-[16px] font-bold text-violet-700">
                          {resalePreview ? formatCurrency(resalePreview.sellerAmount) : "—"}
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-[12px] text-gray-400">Preço para o comprador</p>
                        <p className="text-[14px] font-semibold text-gray-700">
                          {resalePreview ? formatCurrency(resalePreview.buyerPrice) : "—"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Termos de confirmação */}
                  <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3.5 space-y-2">
                    <p className="text-[13px] font-semibold text-amber-800">Ao confirmar:</p>
                    <ul className="space-y-1.5">
                      {[
                        "Seu QR Code ficará suspenso enquanto o ingresso estiver anunciado.",
                        "Você não poderá usar o ingresso enquanto ele estiver na revenda.",
                        "Se vendido, ele será transferido automaticamente para o comprador.",
                        "Você receberá conforme as regras da plataforma.",
                        "Enquanto não vender, você poderá remover da revenda.",
                      ].map((line, i) => (
                        <li key={i} className="flex items-start gap-2 text-[13px] text-amber-800">
                          <span className="shrink-0 font-bold mt-0.5">•</span>
                          <span>{line}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Botões */}
                  <div className="flex gap-3 pt-1 pb-1">
                    <Button variant="outline" className="flex-1" onClick={() => setResaleStep("form")} disabled={submitting}>
                      Voltar
                    </Button>
                    <Button
                      className="flex-1 bg-violet-600 hover:bg-violet-700"
                      onClick={handleResaleSubmit}
                      disabled={submitting}
                    >
                      {submitting
                        ? <><Loader2 size={14} className="animate-spin mr-1.5" /> Anunciando…</>
                        : "Confirmar revenda"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
