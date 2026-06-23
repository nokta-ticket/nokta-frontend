"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Ticket, AlertCircle } from "lucide-react";
import api, { getErrorMessage } from "@/lib/axios";
import { resolveMediaUrl } from "@/lib/media";
import { resolveThumbnailUrl } from "@/lib/media";
import { ResaleCardSkeleton } from "@/components/ui/skeleton";
import SearchOverlay from "@/components/layout/search-overlay";
import { EventoAPI } from "@/interfaces/events";

interface ResaleItem {
  id: number;
  buyerPrice: number;
  sellerAmount: number;
  originalPrice: number;
  status: number;
  expiresAt: string;
  evento: {
    id: number;
    nome: string;
    data: string;
    horario: string;
    endereco: { localidade: string; uf: string } | null;
    thumbnail: string | null;
  } | null;
  ingresso: { nome: string; tipo: number; lote: number } | null;
}

interface ResaleListResponse {
  data: ResaleItem[];
  meta?: { total: number; page: number; limit: number; totalPages: number };
  paginate?: { total: number; perPage?: number; currentPage?: number; lastPage?: number };
}

function ResaleCard({ r }: { r: ResaleItem }) {
  const [hover, setHover] = useState(false);
  const thumb = resolveMediaUrl(r.evento?.thumbnail ?? null, null);
  const dataFmt = r.evento?.data
    ? new Date(r.evento.data).toLocaleDateString("pt-BR", {
        weekday: "short", day: "2-digit", month: "short",
      })
    : null;
  const horario = r.evento?.horario?.slice(0, 5);
  const preco = (r.buyerPrice ?? r.originalPrice) as number;

  return (
    <Link href={`/revenda/${r.id}`} style={{ textDecoration: "none", flex: "1 1 calc(50% - 8px)", minWidth: 280 }}>
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: "#fff",
        borderRadius: 10,
        overflow: "hidden",
        cursor: "pointer",
        boxShadow: hover
          ? "0 8px 30px rgba(0,0,0,0.10)"
          : "0 1px 4px rgba(0,0,0,0.06)",
        transition: "box-shadow 0.25s ease, transform 0.25s ease",
        transform: hover ? "translateY(-3px)" : "none",
      }}
    >
      {/* Imagem */}
      <div style={{ position: "relative", height: 148, overflow: "hidden", background: "#ede9f7" }}>
        {thumb ? (
          <img
            src={thumb}
            alt={r.evento?.nome ?? ""}
            style={{
              width: "100%", height: "100%", objectFit: "cover",
              transition: "transform 0.4s ease",
              transform: hover ? "scale(1.04)" : "scale(1)",
            }}
          />
        ) : (
          <div style={{
            width: "100%", height: "100%",
            background: "linear-gradient(135deg, #c084fc 0%, #818cf8 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Ticket size={36} color="rgba(255,255,255,0.4)" />
          </div>
        )}

        {/* Badge revenda */}
        <div style={{
          position: "absolute", top: 10, left: 10,
          padding: "4px 10px", borderRadius: 6,
          background: "rgba(153,68,204,0.88)",
          backdropFilter: "blur(4px)",
          color: "#fff", fontSize: 11, fontWeight: 600,
          fontFamily: "'DM Sans', sans-serif",
          letterSpacing: "0.02em",
        }}>
          REVENDA
        </div>

        {/* Setor do ingresso */}
        {r.ingresso?.nome && (
          <div style={{
            position: "absolute", top: 10, right: 10,
            padding: "4px 10px", borderRadius: 6,
            background: "rgba(0,0,0,0.50)", color: "#fff",
            fontSize: 11, fontWeight: 500,
            fontFamily: "'DM Sans', sans-serif",
            backdropFilter: "blur(4px)",
          }}>
            {r.ingresso.nome}
          </div>
        )}
      </div>

      {/* Conteúdo */}
      <div style={{ padding: "14px 16px 16px" }}>
        <h3 style={{
          fontFamily: "'Sora', sans-serif",
          fontSize: 15, fontWeight: 600, color: "#1A1A1A",
          margin: 0, lineHeight: 1.3,
          display: "-webkit-box", WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>
          {r.evento?.nome ?? "Evento"}
        </h3>

        {dataFmt && (
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 12, color: "#777",
            margin: "6px 0 0", lineHeight: 1.4,
          }}>
            {dataFmt}{horario && ` · ${horario}`}
          </p>
        )}
        {r.evento?.endereco && (
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 12, color: "#999",
            margin: "2px 0 0",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {r.evento.endereco.localidade}, {r.evento.endereco.uf}
          </p>
        )}

        {/* Rodapé do card */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginTop: 14, paddingTop: 12, borderTop: "1px solid #F0F0F0",
        }}>
          <div>
            <span style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 11, color: "#999",
            }}>
              preço único
            </span>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 1 }}>
              <span style={{
                fontFamily: "'Sora', sans-serif",
                fontSize: 20, fontWeight: 700, color: "#9944CC",
              }}>
                R$ {preco.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
              {r.originalPrice && r.originalPrice !== preco && (
                <span style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 13, color: "#BBB",
                  textDecoration: "line-through",
                }}>
                  R$ {r.originalPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              )}
            </div>
          </div>

          <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: hover ? "#9944CC" : "#F5F5F5",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.2s ease",
            }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6 3.5L10.5 8L6 12.5" stroke={hover ? "#fff" : "#999"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
        </div>
      </div>
    </div>
    </Link>
  );
}

const VENDER_ITEMS = [
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" stroke="#9944CC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <line x1="7" y1="7" x2="7.01" y2="7" stroke="#9944CC" strokeWidth="2.5" strokeLinecap="round"/>
      </svg>
    ),
    title: "Você define o preço",
    desc: "Até o limite do valor pago pelo seu ingresso.",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="#9944CC" strokeWidth="2"/>
        <path d="M12 6v6l4 2" stroke="#9944CC" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    title: "Sem lucro",
    desc: "A revenda não permite lucro. Você recebe o mesmo valor que pagou.",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="18" height="18" rx="2" stroke="#9944CC" strokeWidth="2"/>
        <path d="M9 9h6M9 12h6M9 15h4" stroke="#9944CC" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    title: "QR Code suspenso",
    desc: "Enquanto o ingresso estiver à venda, ele não pode ser usado.",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M7 16l-4-4 4-4M17 8l4 4-4 4" stroke="#9944CC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: "Venda = transferência",
    desc: "Se vender, o ingresso é transferido automaticamente e o pagamento cai para você.",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M3 12a9 9 0 1018 0 9 9 0 00-18 0zM12 8v4l3 3" stroke="#9944CC" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    title: "Não vendeu? Tudo certo",
    desc: "Se não vender até 4h antes do evento, o ingresso volta para a sua carteira.",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="#9944CC" strokeWidth="2"/>
        <path d="M12 8v4M12 16h.01" stroke="#9944CC" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    title: "Prazo da revenda",
    desc: "Disponível até 4 horas antes do início do evento.",
  },
];

const COMPRAR_ITEMS = [
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M9 12l2 2 4-4" stroke="#3399FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="12" cy="12" r="10" stroke="#3399FF" strokeWidth="2"/>
      </svg>
    ),
    title: "Compra segura",
    desc: "Todos os ingressos são verificados pela Nokta.",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#3399FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: "Transferência automática",
    desc: "Após a confirmação do pagamento, o ingresso é transferido para você na hora.",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="8" height="8" rx="1" stroke="#3399FF" strokeWidth="2"/>
        <rect x="13" y="3" width="8" height="8" rx="1" stroke="#3399FF" strokeWidth="2"/>
        <rect x="3" y="13" width="8" height="8" rx="1" stroke="#3399FF" strokeWidth="2"/>
        <path d="M13 17h2m4 0h-2m0 0v-2m0 2v2" stroke="#3399FF" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    title: "QR Code liberado",
    desc: "O código fica ativo somente para o comprador.",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="#3399FF" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="9" cy="7" r="4" stroke="#3399FF" strokeWidth="2"/>
        <path d="M23 21v-2a4 4 0 00-3-3.87" stroke="#3399FF" strokeWidth="2" strokeLinecap="round"/>
        <path d="M16 3.13a4 4 0 010 7.75" stroke="#3399FF" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    title: "Sem contato com o vendedor",
    desc: "Toda a negociação é feita dentro da plataforma.",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" stroke="#3399FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: "Mesmo valor, sem abuso",
    desc: "Os preços seguem o valor original do ingresso, sem taxas abusivas.",
  },
];

function InfoCard() {
  const [tab, setTab] = useState<"vender" | "comprar">("vender");
  const items = tab === "vender" ? VENDER_ITEMS : COMPRAR_ITEMS;
  const accent = tab === "vender" ? "#9944CC" : "#3399FF";
  const accentLight = tab === "vender" ? "#F3EAFF" : "#EAF3FF";

  return (
    <div style={{
      marginTop: 28,
      background: "#fff",
      borderRadius: 10,
      boxShadow: "0 1px 8px rgba(0,0,0,0.07)",
      overflow: "hidden",
    }}>
      {/* Tabs */}
      <div style={{ display: "flex", padding: "14px 14px 0", gap: 8, background: "#FAFAFA", borderBottom: "1px solid #EFEFEF" }}>
        {(["vender", "comprar"] as const).map((t, i) => {
          const active = tab === t;
          const color = t === "vender" ? "#9944CC" : "#3399FF";
          const bgActive = t === "vender" ? "#F3EAFF" : "#EAF3FF";
          const label = t === "vender" ? "Quero revender" : "Quero comprar";
          const icon = t === "vender" ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" stroke={active ? color : "#bbb"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="7" y1="7" x2="7.01" y2="7" stroke={active ? color : "#bbb"} strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <circle cx="9" cy="21" r="1" stroke={active ? color : "#bbb"} strokeWidth="2"/>
              <circle cx="20" cy="21" r="1" stroke={active ? color : "#bbb"} strokeWidth="2"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 001.97-1.67L23 6H6" stroke={active ? color : "#bbb"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          );
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1, padding: "10px 12px 12px",
                background: active ? bgActive : "transparent",
                border: "none", cursor: "pointer",
                borderRadius: "8px 8px 0 0",
                borderBottom: active ? `2px solid ${color}` : "2px solid transparent",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                transition: "all 0.2s ease",
                position: "relative",
              }}
            >
              {icon}
              <span style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13, fontWeight: active ? 700 : 500,
                color: active ? color : "#aaa",
                whiteSpace: "nowrap",
              }}>
                {label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Itens */}
      <div style={{ padding: "4px 0 8px" }}>
        {items.map((item, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "flex-start", gap: 14,
            padding: "12px 18px",
            borderBottom: i < items.length - 1 ? "1px solid #F7F7F7" : "none",
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: "50%",
              background: accentLight,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              marginTop: 1,
            }}>
              {item.icon}
            </div>
            <div>
              <p style={{
                fontFamily: "'Sora', sans-serif",
                fontSize: 13, fontWeight: 700, color: "#1A1A1A",
                margin: "0 0 2px",
              }}>
                {item.title}
              </p>
              <p style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 12, color: "#888",
                margin: 0, lineHeight: 1.5,
              }}>
                {item.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function RevendaPage() {
  const [resales, setResales] = useState<ResaleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(8);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [destaques, setDestaques] = useState<EventoAPI[]>([]);
  const [eventosHoje, setEventosHoje] = useState(0);

  useEffect(() => {
    async function fetchResales() {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get<ResaleListResponse>("/revenda", { params: { page: 1, limit: 100 } });
        const data = res.data.data ?? [];
        setResales(data);

        // monta destaques apenas dos eventos que têm ingressos em revenda
        const eventoMap = new Map<number, { ev: ResaleItem["evento"]; count: number; firstResaleId: number }>();
        for (const r of data) {
          if (!r.evento) continue;
          const entry = eventoMap.get(r.evento.id);
          if (entry) entry.count++;
          else eventoMap.set(r.evento.id, { ev: r.evento, count: 1, firstResaleId: r.id });
        }
        setDestaques(
          Array.from(eventoMap.values())
            .slice(0, 6)
            .map((e) => ({ ...e.ev, _ticketCount: e.count, _firstResaleId: e.firstResaleId } as any))
        );

        const hoje = new Date().toDateString();
        setEventosHoje(
          Array.from(eventoMap.values()).filter(
            (e) => e.ev && new Date(e.ev.data).toDateString() === hoje
          ).length
        );
      } catch (err) {
        setError(getErrorMessage(err, "Não foi possível carregar os ingressos disponíveis."));
        setResales([]);
      } finally {
        setLoading(false);
      }
    }
    fetchResales();
  }, []);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const displayed = resales.slice(0, visibleCount);
  const hasMore = visibleCount < resales.length;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&family=DM+Sans:wght@400;500;600&display=swap');
        input::placeholder { color: #BCBCBC; }
      `}</style>

      {/* Scroll to top */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Voltar ao topo"
        style={{
          position: "fixed", right: 20, bottom: 24, zIndex: 40,
          width: 42, height: 42, borderRadius: "50%",
          background: "linear-gradient(135deg, #9944CC, #3399FF)",
          border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 14px rgba(153,68,204,0.4)",
          transition: "opacity 0.3s ease, transform 0.3s ease",
          opacity: showScrollTop ? 1 : 0,
          transform: showScrollTop ? "translateY(0)" : "translateY(16px)",
          pointerEvents: showScrollTop ? "auto" : "none",
        }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 12.5V3.5M3.5 8L8 3.5L12.5 8" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <div style={{
        minHeight: "100vh",
        background: "#F8F7FC",
        fontFamily: "'DM Sans', sans-serif",
      }}>
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "24px 16px 80px" }}>

          {/* ── Busca padrão Nokta ── */}
          <button
            type="button"
            onClick={() => setOverlayOpen(true)}
            className="w-full flex items-center gap-2.5 border border-gray-200 rounded-2xl px-3.5 py-2.5 bg-gray-50"
            style={{ marginBottom: 16 }}
          >
            <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" width="17" height="17" className="text-gray-500 shrink-0">
              <path d="m14 14-2.9-2.9M7.333 4a3.333 3.333 0 0 1 3.334 3.333m2 0A5.333 5.333 0 1 1 2 7.333a5.333 5.333 0 0 1 10.667 0Z" stroke="currentColor" strokeWidth="1.333" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="font-sans text-[14px] text-gray-400">Buscar eventos</span>
          </button>
          <SearchOverlay open={overlayOpen} onClose={() => setOverlayOpen(false)} />

          {/* ── Banner ── */}
          <div style={{
            borderRadius: 10,
            marginBottom: 20,
            overflow: "hidden",
            position: "relative",
            height: 142,
          }}>
            <img
              src="/banner-revenda.png"
              alt="Nokta Tickets — Revenda oficial. Compra segura."
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          </div>

          {/* ── Eventos em destaque ── */}
          <div style={{ marginBottom: 28 }}>
              {/* Header */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                marginBottom: 14,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M22 10V6a2 2 0 00-2-2H4a2 2 0 00-2 2v4a2 2 0 010 4v4a2 2 0 002 2h16a2 2 0 002-2v-4a2 2 0 010-4z" fill="#9944CC"/>
                    <path d="M10 4v2m0 12v2m0-10v4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  <span style={{
                    fontFamily: "'Sora', sans-serif",
                    fontSize: 16, fontWeight: 700, color: "#1A1A1A",
                  }}>
                    Eventos em destaque
                  </span>
                </div>
                <Link href="/eventos" style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 13, fontWeight: 600, color: "#9944CC",
                  textDecoration: "none",
                }}>
                  Ver tudo
                </Link>
              </div>

              {/* Cards horizontais */}
              <div style={{
                display: "flex", gap: 12,
                overflowX: "auto", paddingBottom: 6,
                scrollbarWidth: "none",
                WebkitOverflowScrolling: "touch" as any,
              }}>
                {destaques.map((ev) => {
                  const raw = (ev as any).thumbnail ?? ev.thumbnails?.[0] ?? null;
                  const src = raw ? resolveMediaUrl(raw, null) : null;
                  const dataFmt = new Date(ev.data).toLocaleDateString("pt-BR", { day: "2-digit", month: "long" });
                  return (
                    <Link
                      key={ev.id}
                      href={`/revenda/${(ev as any)._firstResaleId}`}
                      style={{ textDecoration: "none", flexShrink: 0 }}
                    >
                      <div style={{
                        minWidth: 210, width: 210,
                        borderRadius: 10, overflow: "hidden",
                        background: "#fff",
                        boxShadow: "0 1px 8px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.04)",
                        cursor: "pointer",
                      }}>
                        {/* Imagem */}
                        <div style={{ position: "relative", width: "100%", height: 140, overflow: "hidden" }}>
                          {src ? (
                            <img src={src} alt={ev.nome} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                          ) : (
                            <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #c084fc, #818cf8)" }} />
                          )}
                          {(ev as any)._ticketCount && (
                            <div style={{
                              position: "absolute", top: 8, right: 8,
                              background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)",
                              borderRadius: 20, padding: "3px 9px",
                              display: "flex", alignItems: "center", gap: 4,
                            }}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                                <path d="M2 9V7a2 2 0 012-2h16a2 2 0 012 2v2a2 2 0 000 6v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2a2 2 0 000-6z" stroke="#fff" strokeWidth="2" strokeLinejoin="round"/>
                                <line x1="9" y1="5" x2="9" y2="19" stroke="#fff" strokeWidth="1.5" strokeDasharray="2 2"/>
                              </svg>
                              <span style={{ color: "#fff", fontSize: 11, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>
                                {(ev as any)._ticketCount}
                              </span>
                            </div>
                          )}
                        </div>
                        {/* Info */}
                        <div style={{ padding: "10px 14px 14px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 6 }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                              <rect x="3" y="4" width="18" height="18" rx="2" stroke="#9944CC" strokeWidth="2"/>
                              <line x1="3" y1="10" x2="21" y2="10" stroke="#9944CC" strokeWidth="2"/>
                              <line x1="8" y1="2" x2="8" y2="6" stroke="#9944CC" strokeWidth="2" strokeLinecap="round"/>
                              <line x1="16" y1="2" x2="16" y2="6" stroke="#9944CC" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#9944CC", fontWeight: 500 }}>
                              {dataFmt}
                            </span>
                          </div>
                          <p style={{
                            fontFamily: "'Sora', sans-serif",
                            fontSize: 14, fontWeight: 600, color: "#1A1A1A",
                            margin: "0 0 4px", lineHeight: 1.35,
                            overflow: "hidden", textOverflow: "ellipsis",
                            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as any,
                          }}>
                            {ev.nome}
                          </p>
                          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#aaa", margin: 0 }}>
                            {ev.endereco?.localidade ?? ""}{ev.endereco?.uf ? ` — ${ev.endereco.uf}` : ""}
                          </p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* Cards de ação */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>

                {/* Eventos hoje */}
                <div style={{
                  background: "#fff", borderRadius: 10, padding: "14px 16px",
                  display: "flex", alignItems: "center", gap: 14,
                  boxShadow: "0 1px 6px rgba(0,0,0,0.05)", cursor: "pointer",
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: "50%",
                    background: "#F3EAFF",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="11" fill="#9944CC"/>
                      <text x="12" y="17" textAnchor="middle" fill="#fff" fontSize="15" fontWeight="bold" fontFamily="Georgia, serif" fontStyle="italic">i</text>
                    </svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontFamily: "'Sora', sans-serif", fontSize: 15, fontWeight: 700, color: "#1A1A1A", margin: "0 0 2px" }}>
                      Eventos hoje
                    </p>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#999", margin: 0 }}>
                      {eventosHoje > 0 ? `${eventosHoje} evento${eventosHoje > 1 ? "s" : ""} acontecendo hoje` : "Programas de última hora"}
                    </p>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M6 3.5L10.5 8L6 12.5" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>

                {/* Neste fim de semana */}
                <Link href="/eventos?periodo=fds" style={{ textDecoration: "none" }}>
                  <div style={{
                    background: "#fff", borderRadius: 10, padding: "14px 16px",
                    display: "flex", alignItems: "center", gap: 14,
                    boxShadow: "0 1px 6px rgba(0,0,0,0.05)", cursor: "pointer",
                  }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: "50%",
                      background: "#EAF3FF",
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                        <rect x="3" y="4" width="18" height="18" rx="2.5" fill="#3399FF"/>
                        <line x1="3" y1="10" x2="21" y2="10" stroke="#fff" strokeWidth="1.8"/>
                        <line x1="8" y1="2" x2="8" y2="6" stroke="#3399FF" strokeWidth="2" strokeLinecap="round"/>
                        <line x1="16" y1="2" x2="16" y2="6" stroke="#3399FF" strokeWidth="2" strokeLinecap="round"/>
                        <circle cx="8" cy="15" r="1.5" fill="#fff"/>
                        <circle cx="12" cy="15" r="1.5" fill="#fff"/>
                        <circle cx="16" cy="15" r="1.5" fill="#fff"/>
                      </svg>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontFamily: "'Sora', sans-serif", fontSize: 15, fontWeight: 700, color: "#1A1A1A", margin: "0 0 2px" }}>
                        Neste fim de semana
                      </p>
                      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#999", margin: 0 }}>
                        Veja os próximos eventos
                      </p>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M6 3.5L10.5 8L6 12.5" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </Link>

                {/* Faça sua busca */}
                <div
                  onClick={() => setOverlayOpen(true)}
                  style={{
                    background: "#fff", borderRadius: 10, padding: "14px 16px",
                    display: "flex", alignItems: "center", gap: 14,
                    boxShadow: "0 1px 6px rgba(0,0,0,0.05)", cursor: "pointer",
                  }}
                >
                  <div style={{
                    width: 44, height: 44, borderRadius: "50%",
                    background: "#F3EAFF",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <circle cx="11" cy="11" r="7" stroke="#9944CC" strokeWidth="2"/>
                      <path d="M16.5 16.5L21 21" stroke="#9944CC" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontFamily: "'Sora', sans-serif", fontSize: 15, fontWeight: 700, color: "#1A1A1A", margin: "0 0 2px" }}>
                      Faça sua busca
                    </p>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#999", margin: 0 }}>
                      Defina data e categoria
                    </p>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M6 3.5L10.5 8L6 12.5" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>

              </div>
            </div>


          {/* ── Card educativo ── */}
          <InfoCard />

        </div>
      </div>
    </>
  );
}
