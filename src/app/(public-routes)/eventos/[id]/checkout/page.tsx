"use client";

import { useRouter, useParams, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState, Suspense } from "react";
import Image from "next/image";
import {
  Loader2, Ticket, Gift, CalendarDays, Clock, MapPin,
  ChevronRight, PartyPopper, Copy, AlertCircle,
  Download, Map, X, Eye, EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import QRCode from "react-qr-code";
import { formatCurrency } from "@/lib/formatCurrency";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/lib/toast";
import { EventDetails } from "@/interfaces/events";
import api, { getErrorMessage } from "@/lib/axios";
import axios from "axios";
import { CpfGate } from "./_components/cpf-gate";
import { cn } from "@/lib/utils";
import { resolveThumbnailUrl } from "@/lib/media";

// ── Types ─────────────────────────────────────────────────────
type Ticket = {
  id: number; nome: string; lote: number; tipo: number;
  valor: number; quantidade: number; disponivelParaVenda: boolean;
  dataLimite?: string | null;
};
interface PaymentForm {
  cardNumber: string; cardName: string; expiryDate: string; cvv: string;
  phone: string; cep: string; city: string; state: string;
  number: string; street: string; neighborhood: string;
}

// ── Rate constants ─────────────────────────────────────────────
const TAXA_SERVICO   = 0.10;    // Nokta platform fee
const TAXA_PROTECAO  = 0.1284;

// Pagar.me gateway rates
const GATEWAY_PIX_RATE      = 0.0109;
const GATEWAY_PIX_FIXED     = 0.55;
const GATEWAY_CARD_1X_RATE  = 0.0319;
const GATEWAY_CARD_26_RATE  = 0.0449;
const GATEWAY_CARD_718_RATE = 0.0499;
const GATEWAY_CARD_FIXED    = 0.99;

// ── Helpers ───────────────────────────────────────────────────
const isGratis = (v: number) => Number(v) === 0;

function formatEventDateFull(raw: string) {
  if (!raw) return "";
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleDateString("pt-BR", {
    weekday: "short", day: "2-digit", month: "long", year: "numeric", timeZone: "UTC",
  });
}
function formatEventTime(raw: string) {
  if (!raw) return "";
  const d = new Date(raw);
  if (!isNaN(d.getTime())) return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
  return raw.slice(0, 5);
}
function formatTicketDate(raw: string) {
  if (!raw) return "";
  const d = new Date(raw);
  return isNaN(d.getTime()) ? raw : d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" });
}
function thumbSrc(ev: EventDetails | null) {
  const t = ev?.thumbnails?.[0];
  return t ? resolveThumbnailUrl(t, null) : null;
}
function round2(v: number) { return Math.round(v * 100) / 100; }

// ── Countdown baseado em deadline do backend ───────────────────
function useDeadlineCountdown(expiresAt: Date | null) {
  const calc = () => expiresAt ? Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000)) : null;
  const [left, setLeft] = useState<number | null>(calc);

  useEffect(() => {
    setLeft(calc());
  }, [expiresAt]);

  useEffect(() => {
    if (left === null || left <= 0) return;
    const t = setInterval(() => setLeft((s) => (s !== null ? Math.max(0, s - 1) : null)), 1000);
    return () => clearInterval(t);
  }, [left === null, left === 0]);

  if (left === null) return { display: "--:--", expired: false };
  const m = String(Math.floor(left / 60)).padStart(2, "0");
  const s = String(left % 60).padStart(2, "0");
  return { display: `${m}:${s}`, expired: left <= 0 };
}

// ── Login Modal ───────────────────────────────────────────────
function LoginModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, senha: password });
      signIn(res.data.token, res.data.user);
      toast.success("Login realizado!");
      onSuccess();
    } catch (err) {
      toast.error(getErrorMessage(err, "E-mail ou senha incorretos."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />
      <div
        className="relative z-10 w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl px-6 pt-5 pb-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* drag handle */}
        <div className="w-10 h-1 rounded-full bg-gray-200 mx-auto mb-5 sm:hidden" />

        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-[17px] text-[#0F172A]">Entre para continuar</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleLogin} className="space-y-3">
          <Input
            type="email" placeholder="E-mail" value={email}
            onChange={(e) => setEmail(e.target.value)} required
            className="h-11 text-[16px] sm:text-[14px]"
          />
          <div className="relative">
            <Input
              type={showPw ? "text" : "password"} placeholder="Senha" value={password}
              onChange={(e) => setPassword(e.target.value)} required
              className="h-11 text-[14px] pr-10"
            />
            <button type="button" onClick={() => setShowPw((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <Button type="submit" disabled={loading}
            className="w-full h-11 font-bold text-[14px] bg-gradient-to-r from-[#9944CC] to-[#3399FF] text-white">
            {loading ? <Loader2 size={16} className="animate-spin" /> : "Entrar"}
          </Button>
        </form>

        <p className="mt-4 text-center text-[13px] text-gray-500">
          Não tem conta?{" "}
          <button onClick={() => router.push("/register")} className="text-[#9944CC] font-semibold hover:underline">
            Cadastre-se
          </button>
        </p>
      </div>
    </div>
  );
}

// ── Success Screen ────────────────────────────────────────────
function SuccessScreen({
  evento, tickets, quantidades, total, onMyTickets, onExplore,
}: {
  evento: EventDetails; tickets: Ticket[]; quantidades: Record<string, number>;
  total: number; onMyTickets: () => void; onExplore: () => void;
}) {
  const ev = evento as any;
  const cover = thumbSrc(evento);
  const isFree = total === 0;
  const selected = Object.entries(quantidades)
    .filter(([, q]) => q > 0)
    .map(([id, q]) => ({ ticket: tickets.find((t) => t.id === Number(id))!, qty: q }))
    .filter((x) => x.ticket);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    let active = true;
    import("canvas-confetti").then(({ default: confetti }) => {
      if (!active) return;
      const fire = (r: number, o: object) => confetti({ origin: { y: 0.6 }, particleCount: Math.floor(200 * r), ...o });
      fire(0.25, { spread: 26, startVelocity: 55, colors: ["#9944CC", "#3399FF"] });
      fire(0.2, { spread: 60, colors: ["#10b981", "#059669"] });
      fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8, colors: ["#818cf8", "#c084fc"] });
      fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
      fire(0.1, { spread: 120, startVelocity: 45 });
    });
    return () => { active = false; };
  }, []);

  const handleMap = () => {
    const addr = ev.endereco
      ? encodeURIComponent(`${ev.endereco?.logradouro}, ${ev.endereco?.numero}, ${ev.endereco?.localidade}, ${ev.endereco?.uf}`)
      : encodeURIComponent(evento.nome);
    window.open(`https://www.google.com/maps/search/?api=1&query=${addr}`, "_blank");
  };

  const handleCalendar = () => {
    const rawDate = ev.data ?? "";
    const rawTime = ev.horario ?? "00:00";
    const start = new Date(`${rawDate.slice(0, 10)}T${rawTime.slice(0, 5)}:00`);
    const end = new Date(start.getTime() + 3 * 60 * 60 * 1000);
    const pad = (n: number) => String(n).padStart(2, "0");
    const fmt = (d: Date) => `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
    const addr = ev.endereco ? `${ev.endereco.logradouro}, ${ev.endereco.numero} - ${ev.endereco.localidade}/${ev.endereco.uf}` : "";
    const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "BEGIN:VEVENT", `SUMMARY:${evento.nome}`, `DTSTART:${fmt(start)}`, `DTEND:${fmt(end)}`, `LOCATION:${addr}`, "END:VEVENT", "END:VCALENDAR"].join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    a.download = `${evento.nome.replace(/\s+/g, "_")}.ics`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-[#F8F8FA] pb-16">
      <div className="relative w-full h-48 bg-gradient-to-br from-[#9944CC] to-[#3399FF]">
        {cover && <Image src={cover} alt={evento.nome} fill className="object-cover opacity-30" unoptimized />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-lg">
            <PartyPopper size={28} className="text-[#9944CC]" />
          </div>
          <span className="text-white font-bold text-base drop-shadow">Pedido confirmado!</span>
        </div>
        <p className="absolute bottom-3 left-4 text-white/80 text-sm font-medium">{evento.nome}</p>
      </div>

      <div className="max-w-2xl mx-auto px-4 space-y-4 mt-5">
        <div className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Seus ingressos</p>
          {selected.map(({ ticket: t, qty }) =>
            Array.from({ length: qty }).map((_, j) => (
              <div key={`${t.id}-${j}`} className="rounded-2xl bg-white border border-gray-100 overflow-hidden shadow-sm">
                <div className="h-1 bg-gradient-to-r from-[#9944CC] via-[#D86CFA] to-[#3399FF]" />
                <div className="flex items-center gap-3 p-4">
                  <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", isGratis(t.valor) ? "bg-emerald-100 text-emerald-600" : "bg-violet-100 text-[#9944CC]")}>
                    {isGratis(t.valor) ? <Gift size={18} /> : <Ticket size={18} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[14px] truncate">{t.nome}</p>
                    <p className="text-[11px] text-gray-400">Lote {t.lote}{t.dataLimite ? ` · Válido até ${formatTicketDate(t.dataLimite)}` : ""}</p>
                  </div>
                  <p className={cn("font-bold text-[14px] shrink-0", isGratis(t.valor) ? "text-emerald-600" : "text-[#9944CC]")}>
                    {isGratis(t.valor) ? "Grátis" : formatCurrency(Number(t.valor))}
                  </p>
                </div>
              </div>
            ))
          )}
          <div className="flex justify-between items-center px-1 pt-1 font-bold text-sm">
            <span className="text-[#0F172A]">Total pago</span>
            <span className={isFree ? "text-emerald-600" : "text-[#9944CC]"}>{isFree ? "Grátis 🎁" : formatCurrency(total)}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Agenda", action: handleCalendar, icon: <CalendarDays size={18} /> },
            { label: "Mapa", action: handleMap, icon: <Map size={18} /> },
            { label: "Exportar", action: () => window.print(), icon: <Download size={18} /> },
          ].map(({ label, action, icon }) => (
            <button key={label} onClick={action}
              className="flex flex-col items-center gap-1.5 rounded-2xl border bg-white p-4 text-xs hover:border-[#9944CC]/40 hover:bg-violet-50 transition-all">
              <span className="text-[#9944CC]">{icon}</span>
              <span className="font-medium">{label}</span>
            </button>
          ))}
        </div>

        <Button onClick={onMyTickets} className="w-full h-12 font-bold text-[15px] bg-gradient-to-r from-[#9944CC] to-[#3399FF] text-white">
          <Ticket size={16} className="mr-2" /> Ver meus ingressos
        </Button>
        <Button variant="outline" onClick={onExplore} className="w-full h-11 text-[14px]">
          Explorar mais eventos
        </Button>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────
function CheckoutContent() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isAuthenticated, isAuthResolved, signIn } = useAuth();

  const [evento, setEvento] = useState<EventDetails | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [quantidades, setQuantidades] = useState<Record<string, number>>({});
  const [cupomDesconto, setCupomDesconto] = useState(0);
  const [cupomCodigo, setCupomCodigo] = useState("");

  const [protecaoSelected, setProtecaoSelected] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "card" | null>(null);
  const [pixUrl, setPixUrl] = useState<string | null>(null);
  const [orderCode, setOrderCode] = useState<string | null>(null);
  const [reservationCode, setReservationCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [needsCpf, setNeedsCpf] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showCardForm, setShowCardForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showCoverages, setShowCoverages] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [parcelas, setParcelas] = useState(1);
  const [maxParcelas, setMaxParcelas] = useState(12);
  const [maxSemJuros, setMaxSemJuros] = useState(0);
  const [cardRateBps, setCardRateBps] = useState<number[]>([]);
  const [cardFixedCfg, setCardFixedCfg] = useState<number | null>(null);
  const [pixRateCfg, setPixRateCfg] = useState<number | null>(null);
  const [pixFixedCfg, setPixFixedCfg] = useState<number | null>(null);

  const { display: timerDisplay, expired: timerExpired } = useDeadlineCountdown(expiresAt);

  const [form, setForm] = useState<PaymentForm>({
    cardNumber: "", cardName: "", expiryDate: "", cvv: "",
    phone: "", cep: "", city: "", state: "", number: "", street: "", neighborhood: "",
  });

  // Parse URL params
  useEffect(() => {
    const itemsParam = searchParams.get("items");
    const cupomParam = searchParams.get("cupom");
    if (itemsParam) {
      const parsed: Record<string, number> = {};
      itemsParam.split(",").forEach((part) => {
        const [tid, qty] = part.split(":");
        if (tid && qty) parsed[tid] = Number(qty);
      });
      setQuantidades(parsed);
    }
    if (cupomParam) setCupomCodigo(cupomParam);
  }, [searchParams]);

  // ── Calculations (declaradas antes dos useEffects que as usam) ──
  const selectedItems = Object.entries(quantidades)
    .filter(([, q]) => q > 0)
    .map(([ticketId, quantity]) => ({ ticketId: Number(ticketId), quantity }));

  const isFree = Object.values(quantidades).some((q) => q > 0) &&
    selectedItems.every(({ ticketId }) => {
      const t = tickets.find((tk) => tk.id === ticketId);
      return !t || Number(t.valor) === 0;
    });

  useEffect(() => {
    if (!cupomCodigo || !id) return;
    api.post("/cupons/validar", { codigo: cupomCodigo, eventoId: Number(id) })
      .then((res) => setCupomDesconto(Number(res.data.desconto ?? 0)))
      .catch(() => {});
  }, [cupomCodigo, id]);

  useEffect(() => {
    if (!id) return;
    Promise.all([api.get(`/eventos/${id}`), api.get(`/eventos/${id}/ingressos`)])
      .then(([evtRes, ingRes]) => {
        setEvento(evtRes.data);
        const tks: Ticket[] = (ingRes.data.data ?? ingRes.data ?? []).map((t: any) => ({ ...t, valor: Number(t.valor) }));
        setTickets(tks);
      })
      .catch((err) => toast.error(getErrorMessage(err, "Erro ao carregar evento.")));
  }, [id]);

  // Configuração de parcelamento (taxas e limite vêm do gateway)
  useEffect(() => {
    api.get("/pagamento/info-parcelas")
      .then((res) => {
        setMaxParcelas(res.data.maxParcelas ?? 12);
        setMaxSemJuros(res.data.maxParcelasSemJuros ?? 0);
        setCardRateBps(res.data.cardRateBps ?? []);
        setCardFixedCfg(res.data.cardFixedCents ?? null);
        setPixRateCfg(res.data.pixRateBps ?? null);
        setPixFixedCfg(res.data.pixFixedCents ?? null);
      })
      .catch(() => {});
  }, []);

  // Criar reserva quando os dados estiverem prontos
  useEffect(() => {
    if (!isAuthResolved || !isAuthenticated || !id || selectedItems.length === 0 || reservationCode || isFree) return;
    api.post("/pagamento/reservar", {
      items: selectedItems,
      codigoCupom: cupomCodigo || undefined,
    })
      .then((res) => {
        setReservationCode(res.data.reservationCode);
        setExpiresAt(new Date(res.data.expiresAt));
      })
      .catch((err) => toast.error(getErrorMessage(err, "Erro ao reservar ingressos.")));
  }, [isAuthResolved, isAuthenticated, id, selectedItems.length, isFree]);

  // Quando o timer zera, consulta o backend antes de redirecionar
  useEffect(() => {
    if (success || !timerExpired || !expiresAt || !reservationCode) return;
    const code = orderCode ?? reservationCode;
    api.get(`/pagamento/status/${code}`)
      .then((res) => {
        const { status, expiresAt: newExpiry } = res.data;
        if (status === "paid") { setSuccess(true); return; }
        if (status === "pending" || status === "reserved") {
          // Backend ainda não expirou (cron atrasado) — atualizar countdown com novo expiresAt
          if (newExpiry) { setExpiresAt(new Date(newExpiry)); return; }
        }
        // Expirado ou cancelado
        toast.error(pixUrl ? "Tempo do PIX expirado." : "Tempo de reserva expirado.");
        router.push(`/eventos/${id}`);
      })
      .catch(() => {
        toast.error("Reserva expirada.");
        router.push(`/eventos/${id}`);
      });
  }, [timerExpired, success]);

  // Polling: verifica se PIX foi pago a cada 3s
  useEffect(() => {
    if (!orderCode || success) return;
    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/pagamento/status/${orderCode}`);
        if (res.data.status === "paid") {
          clearInterval(interval);
          setSuccess(true);
        } else if (res.data.status === "failed") {
          clearInterval(interval);
          toast.error("Tempo de pagamento expirado. Tente novamente.");
          router.push(`/eventos/${id}`);
        }
      } catch {}
    }, 3000);
    return () => clearInterval(interval);
  }, [orderCode, success]);

  useEffect(() => { if (user?.telefone) setForm((f) => ({ ...f, phone: user.telefone ?? "" })); }, [user?.telefone]);
  useEffect(() => { if (user !== null && !user.cpf) setNeedsCpf(true); }, [user]);

  const fetchCep = async (cep: string) => {
    try {
      const res = await axios.get(`https://viacep.com.br/ws/${cep}/json/`);
      if (!res.data.erro) setForm((f) => ({ ...f, state: res.data.uf, city: res.data.localidade, street: res.data.logradouro, neighborhood: res.data.bairro }));
    } catch {}
  };
  useEffect(() => {
    const cep = form.cep.replace(/\D/g, "");
    if (cep.length === 8 && !form.city) fetchCep(cep);
  }, [form.cep]);

  // ── Calculations (continuação) ────────────────────────────
  const precoComDesconto = (valor: number) => cupomDesconto > 0 ? valor * (1 - cupomDesconto / 100) : valor;

  const subtotalBruto = round2(selectedItems.reduce((s, { ticketId, quantity }) => {
    const t = tickets.find((tk) => tk.id === ticketId);
    return s + Number(t?.valor ?? 0) * quantity;
  }, 0));

  const subtotal = round2(selectedItems.reduce((s, { ticketId, quantity }) => {
    const t = tickets.find((tk) => tk.id === ticketId);
    return s + precoComDesconto(Number(t?.valor ?? 0)) * quantity;
  }, 0));

  const valorDesconto = round2(subtotalBruto - subtotal);

  const taxaServico = round2(subtotal * TAXA_SERVICO);
  const taxaProtecao = round2(subtotal * TAXA_PROTECAO);

  const subtotalBase = round2(
    subtotal + taxaServico + (protecaoSelected && !isFree ? taxaProtecao : 0)
  );

  // Taxas de cartão por parcela (vêm do gateway; fallback nos defaults)
  const cardFixedReais = cardFixedCfg !== null ? cardFixedCfg / 100 : GATEWAY_CARD_FIXED;
  const cardRateFor = (n: number) => {
    if (n <= maxSemJuros) return 0;
    if (cardRateBps.length >= n) return cardRateBps[n - 1] / 10000;
    return n <= 1 ? GATEWAY_CARD_1X_RATE : n <= 6 ? GATEWAY_CARD_26_RATE : GATEWAY_CARD_718_RATE;
  };
  const cardFixedFor = (n: number) => (n <= maxSemJuros ? 0 : cardFixedReais);

  const pixRate  = pixRateCfg  !== null ? pixRateCfg / 10000 : GATEWAY_PIX_RATE;
  const pixFixed = pixFixedCfg !== null ? pixFixedCfg / 100  : GATEWAY_PIX_FIXED;

  // Gross-up: só aplica taxa de processamento após escolher a forma de pagamento
  const gatewayPct =
    paymentMethod === "card" ? cardRateFor(parcelas) :
    paymentMethod === "pix"  ? pixRate : 0;
  const gatewayFixed =
    paymentMethod === "card" ? cardFixedFor(parcelas) :
    paymentMethod === "pix"  ? pixFixed : 0;

  const total = isFree ? 0 : round2((subtotalBase + gatewayFixed) / (1 - gatewayPct));
  const taxaProcessamento = isFree ? 0 : round2(total - subtotalBase);

  const taxaProcessamentoLabel = "Taxa de processamento";

  const installmentTotal = (n: number) => round2((subtotalBase + cardFixedFor(n)) / (1 - cardRateFor(n)));
  const installmentValue = (n: number) => installmentTotal(n) / n;
  const totalParcela = installmentValue(maxParcelas).toFixed(2).replace(".", ",");

  // ── Handlers ─────────────────────────────────────────────
  function handleCtaClick() {
    if (!isAuthResolved) return;
    if (!isAuthenticated) { setShowLoginModal(true); return; }
    if (isFree) { handleFreeCheckout(); return; }
    handlePixCheckout();
  }

  function handleSelectPayment(method: "pix" | "card") {
    if (!isAuthResolved) return;
    if (!isAuthenticated) { setShowLoginModal(true); return; }
    setPaymentMethod((prev) => prev === method ? null : method);
    setShowCardForm(false);
    setPixUrl(null);
  }

  async function handleFreeCheckout() {
    setProcessing(true);
    try {
      await api.post("/pagamento/checkout", {
        type: "pix",
        items: selectedItems,
        codigoCupom: cupomCodigo || undefined,
        termsVersion: "v1",
        termsAcceptedAt: new Date().toISOString(),
      });
      setSuccess(true);
    } catch (err) {
      toast.error(getErrorMessage(err, "Erro ao confirmar ingressos."));
    } finally { setProcessing(false); }
  }

  async function handlePixCheckout() {
    if (pixUrl || !reservationCode) return;
    setProcessing(true);
    try {
      const res = await api.post("/pagamento/checkout", {
        type: "pix",
        reservationCode,
        items: selectedItems,
        codigoCupom: cupomCodigo || undefined,
        termsVersion: "v1",
        termsAcceptedAt: new Date().toISOString(),
        protecao: protecaoSelected,
      });
      if (res.data.pixUrl) setPixUrl(res.data.pixUrl);
      if (res.data.orderCode) setOrderCode(res.data.orderCode);
      if (res.data.expiresAt) setExpiresAt(new Date(res.data.expiresAt));
    } catch (err) {
      toast.error(getErrorMessage(err, "Erro ao gerar PIX."));
    } finally { setProcessing(false); }
  }

  async function handleCardCheckout(e: FormEvent) {
    e.preventDefault();
    if (!reservationCode) { toast.error("Reserva não encontrada. Recarregue a página."); return; }
    setProcessing(true);
    try {
      const [month, year] = form.expiryDate.split("/");
      const res = await api.post("/pagamento/checkout", {
        type: "card",
        reservationCode,
        items: selectedItems,
        codigoCupom: cupomCodigo || undefined,
        termsVersion: "v1",
        termsAcceptedAt: new Date().toISOString(),
        parcelas,
        protecao: protecaoSelected,
        address: { cep: form.cep, state: form.state, city: form.city, number: form.number, neighborhood: form.neighborhood, street: form.street },
        card: { holderName: form.cardName, number: form.cardNumber.replace(/\s+/g, ""), ccv: form.cvv, expiryMonth: month, expiryYear: year },
      });
      // Ingresso só é liberado quando a Pagar.me confirmar (webhook).
      // Acompanhamos o status até "paid".
      if (res.data.orderCode) {
        setOrderCode(res.data.orderCode);
        if (res.data.expiresAt) setExpiresAt(new Date(res.data.expiresAt));
        setConfirming(true);
      } else if (res.data.paid) {
        setSuccess(true);
      }
    } catch (err) {
      toast.error(getErrorMessage(err, "Erro ao processar pagamento. Verifique os dados do cartão."));
    } finally { setProcessing(false); }
  }

  const fld = (f: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((p) => ({ ...p, [f]: e.target.value }));
  const formatCard = (v: string) => (v.replace(/\D/g, "").match(/.{1,4}/g) ?? []).join(" ").slice(0, 19);
  const formatExpiry = (v: string) => { const c = v.replace(/\D/g, ""); return c.length >= 3 ? `${c.slice(0, 2)}/${c.slice(2, 4)}` : c; };
  const formatPhone = (v: string) => { const c = v.replace(/\D/g, ""); if (c.length <= 2) return `(${c}`; if (c.length <= 6) return `(${c.slice(0, 2)}) ${c.slice(2)}`; if (c.length <= 10) return `(${c.slice(0, 2)}) ${c.slice(2, 6)}-${c.slice(6)}`; return `(${c.slice(0, 2)}) ${c.slice(2, 7)}-${c.slice(7, 11)}`; };

  // ── Guards ────────────────────────────────────────────────
  if (!evento) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 size={28} className="animate-spin text-[#9944CC]" />
      </div>
    );
  }

  if (needsCpf) {
    return (
      <CpfGate onComplete={(cpf, dataNascimento) => {
        setNeedsCpf(false);
        if (user) { (user as any).cpf = cpf; (user as any).dataNascimento = dataNascimento; }
      }} />
    );
  }

  if (success) {
    return (
      <SuccessScreen
        evento={evento} tickets={tickets} quantidades={quantidades} total={total}
        onMyTickets={() => router.push("/meus-ingressos")}
        onExplore={() => router.push("/eventos")}
      />
    );
  }

  const ev = evento as any;
return (
    <>
      <div className="min-h-screen bg-[#F5F5F7] pb-28">

        {/* Content */}
        <div className="max-w-2xl mx-auto px-4 pt-5 pb-6 space-y-4">

          {/* Title + timer */}
          <div className="flex items-center justify-between">
            <h1 className="font-bold text-[17px] text-[#0F172A]">Finalizar pedido</h1>
            <span className={cn(
              "text-[12px] font-semibold px-2.5 py-1 rounded-full",
              timerExpired ? "bg-red-100 text-red-600" : "bg-white text-[#6B21A8] border border-[#9944CC]/20"
            )}>
              {timerExpired ? "Tempo esgotado" : `Tempo restante: ${timerDisplay}`}
            </span>
          </div>

          {/* ── Main card ────────────────────────────────────── */}
          <div>
            <div className="coupon-edge coupon-edge-top" />
            <div className="bg-white px-4 py-[18px]">

              {/* Evento */}
              <p className="font-semibold text-[16px] text-[#111] mb-1.5">{evento.nome}</p>
              <div className="flex flex-wrap gap-3 mb-4">
                {ev.data && (
                  <span className="flex items-center gap-1 text-[12px] text-[#7c3aed]">
                    <CalendarDays size={11} className="shrink-0" />
                    <span className="capitalize">{formatEventDateFull(ev.data)}</span>
                  </span>
                )}
                {ev.horario && (
                  <span className="flex items-center gap-1 text-[12px] text-[#7c3aed]">
                    <Clock size={11} className="shrink-0" />
                    {formatEventTime(ev.horario)}h
                  </span>
                )}
                {ev.endereco && (
                  <span className="flex items-center gap-1 text-[12px] text-[#7c3aed]">
                    <MapPin size={11} className="shrink-0" />
                    {ev.endereco?.localidade}/{ev.endereco?.uf}
                  </span>
                )}
              </div>

              {showDetails ? (
                <>
                  {/* Itens expandidos */}
                  {selectedItems.length > 0 && (
                    <>
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2.5">Itens</p>
                      {selectedItems.map(({ ticketId, quantity }) => {
                        const t = tickets.find((tk) => tk.id === ticketId);
                        if (!t) return null;
                        const precoOriginal = t.valor;
                        const precoFinal = precoComDesconto(precoOriginal);
                        const temDesconto = valorDesconto > 0 && precoOriginal !== precoFinal;
                        return (
                          <div key={ticketId} className="mb-3">
                            <div className="flex justify-between text-[14px] font-semibold text-[#111]">
                              <span>{quantity} {t.nome} · {t.lote}º Lote</span>
                              <span>{isGratis(precoFinal) ? "Grátis" : formatCurrency(round2(precoFinal * quantity))}</span>
                            </div>
                            {temDesconto && (
                              <>
                                <p className="text-[12px] text-gray-400 mt-0.5">
                                  <s>De {formatCurrency(round2(precoOriginal * quantity))}</s>{" "}
                                  <span className="text-[#7c3aed]">por {formatCurrency(round2(precoFinal * quantity))}</span>
                                </p>
                                <p className="text-[12px] text-[#111] flex items-center gap-1 mt-0.5">
                                  ✦ Cupom {cupomCodigo} aplicado: - {formatCurrency(round2((precoOriginal - precoFinal) * quantity))}
                                </p>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </>
                  )}

                  <hr className="border-t border-gray-100 my-3.5" style={{ borderWidth: '0.5px' }} />

                  {/* Resumo expandido */}
                  {!isFree && (
                    <>
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2.5">Resumo</p>
                      <div className="space-y-2 mb-1">
                        <div className="flex justify-between text-[13px] text-gray-500">
                          <span>Total em itens</span>
                          <span>{formatCurrency(subtotal)}</span>
                        </div>
                        {protecaoSelected && taxaProtecao > 0 && (
                          <div className="flex justify-between text-[13px] text-gray-500">
                            <span>Proteção de compra</span>
                            <span>{formatCurrency(taxaProtecao)}</span>
                          </div>
                        )}
                        {taxaServico > 0 && (
                          <div className="flex justify-between text-[13px] text-gray-500">
                            <span>Taxa de serviço</span>
                            <span>{formatCurrency(taxaServico)}</span>
                          </div>
                        )}
                        {taxaProcessamento > 0 && (
                          <div className="flex justify-between text-[13px] text-gray-500">
                            <span>{taxaProcessamentoLabel}</span>
                            <span>{formatCurrency(taxaProcessamento)}</span>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* Total expandido */}
                  <div className="flex items-end justify-between mt-3">
                    <div>
                      <p className="text-[13px] text-gray-500">Total a pagar</p>
                      <p className={cn("font-bold text-[22px]", isFree ? "text-emerald-600" : "text-[#111]")}>
                        {isFree ? "Grátis" : formatCurrency(total)}
                      </p>
                      {!isFree && <p className="text-[11px] text-gray-400">ou até {maxParcelas}x R$ {totalParcela}</p>}
                    </div>
                    {!isFree && (
                      <button
                        onClick={() => setShowDetails(false)}
                        className="flex items-center gap-1 text-[12px] text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <span>Ocultar detalhes</span>
                        <span className="text-[10px]">▲</span>
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* Resumo colapsado */}
                  <hr className="border-t border-gray-100 my-3.5" style={{ borderWidth: '0.5px' }} />
                  <p className="text-[13px] text-gray-400 mb-3">
                    {selectedItems.reduce((s, { quantity }) => s + quantity, 0)} {selectedItems.reduce((s, { quantity }) => s + quantity, 0) === 1 ? "item" : "itens"}
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-[14px] text-[#111]">
                      Total a pagar: {isFree ? "Grátis" : formatCurrency(total)}
                    </p>
                    {!isFree && (
                      <button
                        onClick={() => setShowDetails(true)}
                        className="flex items-center gap-1 text-[12px] text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <span>Ver detalhes</span>
                        <span className="text-[10px]">▼</span>
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
            <div className="coupon-edge coupon-edge-bottom" />
          </div>

          {/* ── Proteção de compra ───────────────────────────── */}
          {!isFree && taxaProtecao > 0 && (
            <div>
              <p className="font-bold text-[15px] text-[#0F172A] mb-3">Proteja-se de imprevistos!</p>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

                {/* Com proteção */}
                <div className="p-2 cursor-pointer" onClick={() => setProtecaoSelected(true)}>
                  <div className={cn(
                    "flex items-start gap-3 p-3 rounded-xl relative transition-all",
                    protecaoSelected
                      ? "bg-[#F5F0FF] border-2 border-[#9944CC]"
                      : "border-2 border-transparent hover:bg-gray-50"
                  )}>
                    <div className={cn(
                      "flex h-5 w-5 shrink-0 rounded-full border-2 mt-0.5 items-center justify-center",
                      protecaoSelected ? "border-[#9944CC] bg-[#9944CC]" : "border-gray-300"
                    )}>
                      {protecaoSelected && <div className="h-2 w-2 rounded-full bg-white" />}
                    </div>
                    <div className="flex-1 min-w-0 pr-20">
                      <p className="font-bold text-[13px] text-[#0F172A]">
                        Compra protegida por {formatCurrency(taxaProtecao)}!
                      </p>
                      <p className="text-[12px] text-gray-500 mt-0.5">Quero meu dinheiro de volta nos casos previstos:</p>
                      {showCoverages && (
                        <ul className="mt-2 space-y-1">
                          {[
                            "Infecção por COVID-19 e isolamento",
                            "Acidente, doença ou lesão",
                            "Emergência doméstica",
                            "Roubo de documentos",
                            "Falha no transporte público",
                            "Condição médica preexistente",
                            "Intimação judicial",
                            "Falha de veículo privado",
                            "Chamada de serviços de emergência",
                            "E muitos outros...",
                          ].map((item) => (
                            <li key={item} className="flex items-start gap-1.5 text-[12px] text-gray-600">
                              <span className="text-[#9944CC] font-bold mt-0.5">✓</span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      )}
                      <button
                        className="text-[12px] text-[#9944CC] font-medium mt-1.5 hover:underline"
                        onClick={(e) => { e.stopPropagation(); setShowCoverages((v) => !v); }}
                      >
                        {showCoverages ? "Esconder coberturas" : "Ver as coberturas"}
                      </button>
                    </div>
                    <span className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wide bg-[#1e293b] text-white px-2 py-0.5 rounded-full">
                      Recomendado
                    </span>
                  </div>
                </div>

                {/* Sem proteção */}
                <div
                  onClick={() => setProtecaoSelected(false)}
                  className={cn(
                    "flex items-start gap-3 px-4 py-3.5 cursor-pointer border-t border-gray-100 transition-all",
                    !protecaoSelected ? "bg-[#F5F0FF]" : "hover:bg-gray-50"
                  )}
                >
                  <div className={cn(
                    "flex h-5 w-5 shrink-0 rounded-full border-2 mt-0.5 items-center justify-center",
                    !protecaoSelected ? "border-[#9944CC] bg-[#9944CC]" : "border-gray-300"
                  )}>
                    {!protecaoSelected && <div className="h-2 w-2 rounded-full bg-white" />}
                  </div>
                  <div>
                    <p className="font-bold text-[13px] text-[#0F172A]">Seguir sem proteção adicional</p>
                    <p className="text-[12px] text-gray-500 mt-0.5">Tenho certeza que vou ao evento, imprevistos acontecem.</p>
                  </div>
                </div>

                {/* Termos */}
                <p className="text-[11px] text-gray-400 px-4 pt-2 pb-3.5 leading-relaxed">
                  Ao aderir à proteção de compra, você declara estar de acordo com os{" "}
                  <span className="text-[#9944CC] underline cursor-pointer">Termos e condições</span>.
                </p>
              </div>
            </div>
          )}

          {/* ── Termos de aceite ────────────────────────────── */}
          <label className="flex items-start gap-2 text-sm text-gray-600 mt-4">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
            />
            <span>
              Li e aceito os{" "}
              <a href="/termos" target="_blank" className="text-violet-600 underline">Termos de Uso</a>,{" "}
              <a href="/privacidade" target="_blank" className="text-violet-600 underline">Política de Privacidade</a>{" "}
              e regras do evento. Estou ciente de que, após o check-in, o serviço será considerado utilizado.
            </span>
          </label>

          {/* ── Pagamento ────────────────────────────────────── */}
          {isFree ? (
            <button
              onClick={handleCtaClick}
              disabled={processing || timerExpired || selectedItems.length === 0 || !termsAccepted}
              className="w-full py-4 rounded-2xl font-bold text-[16px] text-white bg-gradient-to-r from-[#9944CC] to-[#3399FF] shadow-lg shadow-violet-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              {processing ? <Loader2 size={18} className="animate-spin" /> : "Confirmar ingressos gratuitos"}
            </button>
          ) : (
            <div>
              <p className="font-bold text-[15px] text-[#0F172A] mb-3">Escolha como pagar</p>
              <div className="space-y-2">

                {/* PIX */}
                {paymentMethod !== "card" && (
                  <div>
                    <button
                      onClick={() => handleSelectPayment("pix")}
                      className={cn(
                        "w-full flex items-center justify-between px-4 py-4 rounded-2xl border transition-all text-left",
                        paymentMethod === "pix"
                          ? "bg-[#F5F0FF] border-[#9944CC]"
                          : "bg-white border-gray-100 shadow-sm hover:border-gray-300"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 flex items-center justify-center">
                          <Image src="/icons/pix.svg" alt="PIX" width={20} height={20} unoptimized />
                        </div>
                        <span className={cn("font-semibold text-[13px]", paymentMethod === "pix" ? "text-[#9944CC]" : "text-[#0F172A]")}>PIX</span>
                      </div>
                      <ChevronRight size={15} className={cn(paymentMethod === "pix" ? "text-[#9944CC]" : "text-gray-300")} />
                    </button>

                    {paymentMethod === "pix" && (
                      <div className="mt-2 space-y-2">
                        {pixUrl ? (
                          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col items-center gap-4">
                            <p className="font-semibold text-[14px] text-[#0F172A]">Escaneie o QR Code com seu banco</p>
                            <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                              <QRCode value={pixUrl} size={170} />
                            </div>
                            <p className="text-[12px] text-gray-400 text-center">Após o pagamento, a confirmação é imediata.</p>
                            <button
                              onClick={() => { navigator.clipboard.writeText(pixUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                              className="flex items-center gap-2 w-full justify-center py-3 rounded-xl border-2 border-dashed border-[#9944CC]/40 text-[13px] font-semibold text-[#9944CC] hover:bg-[#F5F0FF] transition"
                            >
                              <Copy size={14} />
                              {copied ? "Copiado!" : "Copiar código PIX"}
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={handleCtaClick}
                            disabled={processing || timerExpired || !termsAccepted}
                            className={cn(
                              "w-full py-4 rounded-2xl font-bold text-[16px] text-white transition-all flex items-center justify-center gap-2",
                              processing || timerExpired || !termsAccepted
                                ? "bg-gray-300 cursor-not-allowed"
                                : "bg-gradient-to-r from-[#9944CC] to-[#3399FF] shadow-lg shadow-violet-200 active:scale-[0.98]"
                            )}
                          >
                            {processing ? <Loader2 size={18} className="animate-spin" /> : `Finalizar pedido · ${formatCurrency(total)}`}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Cartão */}
                {paymentMethod !== "pix" && (
                  <div>
                    <button
                      onClick={() => handleSelectPayment("card")}
                      className={cn(
                        "w-full flex items-center justify-between px-4 py-4 rounded-2xl border transition-all text-left",
                        paymentMethod === "card"
                          ? "bg-[#F5F0FF] border-[#9944CC]"
                          : "bg-white border-gray-100 shadow-sm hover:border-gray-300"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 flex items-center justify-center">
                          <Image src="/icons/credit-card.svg" alt="Cartão" width={20} height={20} unoptimized />
                        </div>
                        <span className={cn("font-semibold text-[13px]", paymentMethod === "card" ? "text-[#9944CC]" : "text-[#0F172A]")}>Cartão de crédito</span>
                      </div>
                      <ChevronRight size={15} className={cn(paymentMethod === "card" ? "text-[#9944CC]" : "text-gray-300")} />
                    </button>

                    {paymentMethod === "card" && (
                      <form onSubmit={handleCardCheckout} className="mt-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
                        <p className="font-semibold text-[14px] text-[#0F172A] mb-1">Dados do cartão</p>
                        <Input placeholder="Número do cartão" value={form.cardNumber} onChange={(e) => setForm((p) => ({ ...p, cardNumber: formatCard(e.target.value) }))} maxLength={19} className="h-11 text-[16px] sm:text-[14px]" />
                        <Input placeholder="Nome impresso no cartão" value={form.cardName} onChange={fld("cardName")} className="h-11 text-[14px] uppercase" />
                        <div className="grid grid-cols-2 gap-3">
                          <Input placeholder="MM/AA" value={form.expiryDate} onChange={(e) => setForm((p) => ({ ...p, expiryDate: formatExpiry(e.target.value) }))} maxLength={5} className="h-11 text-[16px] sm:text-[14px]" />
                          <Input placeholder="CVV" value={form.cvv} onChange={fld("cvv")} maxLength={4} className="h-11 text-[16px] sm:text-[14px]" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[13px] font-medium text-gray-600">Parcelamento</label>
                          <select
                            value={parcelas}
                            onChange={(e) => setParcelas(parseInt(e.target.value, 10))}
                            className="w-full h-11 rounded-md border border-gray-200 px-3 text-[14px] bg-white focus:outline-none focus:ring-2 focus:ring-[#9944CC]/40"
                          >
                            {Array.from({ length: maxParcelas }, (_, i) => i + 1).map((n) => (
                              <option key={n} value={n}>
                                {n}x de {formatCurrency(installmentValue(n))}{n <= maxSemJuros ? " sem juros" : ""}
                              </option>
                            ))}
                          </select>
                        </div>

                        <p className="text-[13px] font-medium text-gray-600 pt-1">Endereço de cobrança</p>
                        <div className="grid grid-cols-3 gap-3">
                          <Input placeholder="CEP" value={form.cep} onChange={fld("cep")} maxLength={9} className="h-11 text-[16px] sm:text-[14px]" />
                          <Input placeholder="Nº" value={form.number} onChange={fld("number")} className="h-11 text-[16px] sm:text-[14px]" />
                          <Input placeholder="UF" value={form.state} onChange={fld("state")} maxLength={2} className="h-11 text-[14px] uppercase" />
                        </div>
                        <Input placeholder="Cidade" value={form.city} onChange={fld("city")} className="h-11 text-[16px] sm:text-[14px]" />

                        <Button type="submit" disabled={processing || confirming || !termsAccepted} className="w-full h-12 font-bold text-[15px] bg-gradient-to-r from-[#9944CC] to-[#3399FF] text-white mt-1">
                          {processing || confirming ? <Loader2 size={18} className="animate-spin" /> : `Pagar ${formatCurrency(total)}`}
                        </Button>
                        {confirming && (
                          <p className="text-[12px] text-center text-gray-500 mt-1">
                            Confirmando o pagamento com o banco. Não feche esta tela…
                          </p>
                        )}
                      </form>
                    )}
                  </div>
                )}

              </div>
            </div>
          )}

          {/* Timer expired notice */}
          {timerExpired && (
            <div className="flex items-center gap-2.5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              <AlertCircle size={16} className="shrink-0" />
              <span>Tempo expirado.{" "}
                <button onClick={() => router.back()} className="underline font-semibold">Voltar e tentar novamente</button>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Login modal ───────────────────────────────────────── */}
      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          onSuccess={() => setShowLoginModal(false)}
        />
      )}
    </>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 size={28} className="animate-spin text-[#9944CC]" />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
