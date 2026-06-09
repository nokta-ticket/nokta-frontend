"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, AlertCircle, ShieldCheck } from "lucide-react";
import { toast } from "@/lib/toast";
import api, { getErrorMessage } from "@/lib/axios";
import { resolveMediaUrl } from "@/lib/media";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

interface ResaleDetail {
  id: number;
  buyerPrice: number;
  sellerAmount: number;
  originalPrice: number;
  status: number;
  expiresAt: string;
  ingresso: { id: number; nome: string; tipo: number; lote: number } | null;
  evento: {
    id: number;
    nome: string;
    slug?: string;
    data: string;
    horario: string;
    descricao?: string;
    endereco: { logradouro?: string; localidade: string; uf: string } | null;
    thumbnail: string | null;
  } | null;
}

interface Lote {
  id: number;
  nome: string;
  tipo: number;
  preco: number;
  quantidade: number;
  vendidos?: number;
}

export default function ComprarRevendaPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [resale, setResale] = useState<ResaleDetail | null>(null);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [resalesDoEvento, setResalesDoEvento] = useState<ResaleDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [buying, setBuying] = useState(false);
  const [done, setDone] = useState(false);
  const [selectedTipo, setSelectedTipo] = useState<string>("");
  const [selectedCategoria, setSelectedCategoria] = useState<string>("");
  const [openTipo, setOpenTipo] = useState(false);
  const [openCategoria, setOpenCategoria] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await api.get<ResaleDetail>(`/revenda/${id}`);
        const data = res.data;
        setResale(data);

        // Busca lotes do evento e todas as revendas do evento
        if (data.evento?.id) {
          const [lotesRes, revendasRes] = await Promise.all([
            api.get(`/eventos/${data.evento.id}/ingressos`).catch(() => ({ data: { data: [] } })),
            api.get(`/revenda`, { params: { eventId: data.evento.id, page: 1, limit: 100 } }).catch(() => ({ data: { data: [] } })),
          ]);
          setLotes(lotesRes.data.data ?? []);
          setResalesDoEvento(revendasRes.data.data ?? []);
        }
      } catch (err) {
        setError(getErrorMessage(err, "Ingresso não encontrado ou não está mais disponível."));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function handleBuy() {
    if (!user) {
      toast.error("Você precisa estar logado para comprar.");
      router.push("/login");
      return;
    }
    try {
      setBuying(true);
      await api.post(`/revenda/${id}/comprar`);
      setDone(true);
      toast.success("Ingresso comprado com sucesso!");
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? getErrorMessage(err, "Erro ao comprar ingresso."));
    } finally {
      setBuying(false);
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 size={32} className="animate-spin" color="#9944CC" />
      </div>
    );
  }

  if (error || !resale) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: "0 24px", textAlign: "center" }}>
        <AlertCircle size={44} color="#e53e3e" opacity={0.7} />
        <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 15, color: "#777" }}>{error ?? "Ingresso não encontrado."}</p>
        <button onClick={() => router.push("/revenda")} style={{ fontSize: 14, fontWeight: 600, color: "#9944CC", background: "none", border: "1.5px solid #9944CC", borderRadius: 10, padding: "10px 24px", cursor: "pointer" }}>
          ← Voltar à revenda
        </button>
      </div>
    );
  }

  if (done) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20, padding: "0 24px", textAlign: "center", background: "#F6F6F8" }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#F3EAFF", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ShieldCheck size={36} color="#9944CC" />
        </div>
        <div>
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 700, color: "#1a1a1a", margin: "0 0 8px" }}>Compra realizada!</h2>
          <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 14, color: "#777", margin: 0 }}>
            Seu ingresso foi transferido. Acesse <strong>Meus Ingressos</strong> para visualizá-lo.
          </p>
        </div>
        <button onClick={() => router.push("/meus-ingressos")} style={{ fontSize: 15, fontWeight: 700, color: "#fff", background: "#9944CC", border: "none", borderRadius: 14, padding: "14px 36px", cursor: "pointer", width: "100%", maxWidth: 320 }}>
          Ver meus ingressos
        </button>
      </div>
    );
  }

  const thumb = resolveMediaUrl(resale.evento?.thumbnail ?? null, null);
  const preco = resale.buyerPrice ?? resale.originalPrice;
  const precoFmt = `R$ ${preco.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
  const dataFmt = resale.evento?.data
    ? new Date(resale.evento.data).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
    : null;

  // Nomes únicos dos tipos de ingresso disponíveis na revenda deste evento
  const tiposComRevenda = new Set(resalesDoEvento.map((r) => r.ingresso?.nome).filter(Boolean));
  // Todos os lotes do evento para mostrar no select (com ou sem revenda)
  const nomesUnicos = Array.from(new Set([
    ...lotes.map((l) => l.nome),
    ...resalesDoEvento.map((r) => r.ingresso?.nome ?? ""),
  ].filter(Boolean)));

  // Categorias baseadas nas revendas disponíveis filtradas pelo tipo selecionado
  const categoriasDisponiveis = new Set(
    resalesDoEvento
      .filter((r) => !selectedTipo || r.ingresso?.nome === selectedTipo)
      .map((r) => r.ingresso?.lote?.toString())
      .filter(Boolean)
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700&display=swap');
        * { box-sizing: border-box; }
        .revenda-page { max-width: 430px; margin: 0 auto; background: #F6F6F8; min-height: 100vh; font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; padding-bottom: 32px; }

        /* Hero */
        .r-hero { position: relative; width: 100%; height: 240px; overflow: hidden; }
        .r-hero-top { position: absolute; top: 0; left: 0; right: 0; display: flex; justify-content: flex-end; align-items: center; padding: 14px 14px 0; z-index: 2; gap: 8px; }
        .r-hero-btn { width: 36px; height: 36px; border-radius: 50%; background: rgba(255,255,255,0.18); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.25); display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; }
        .r-hero-img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .r-hero-gradient { position: absolute; top: 0; left: 0; right: 0; height: 80px; background: linear-gradient(to bottom, rgba(0,0,0,0.2), transparent); pointer-events: none; }

        /* Content */
        .r-content { padding: 0 16px; margin-top: -20px; position: relative; z-index: 1; }

        /* Event header */
        .r-event-header { background: #fff; border-radius: 20px 20px 0 0; padding: 24px 20px 16px; }
        .r-event-title { font-family: 'Sora', sans-serif; font-size: 22px; font-weight: 700; color: #1a1a1a; margin: 0 0 14px; letter-spacing: -0.3px; }
        .r-meta { display: flex; flex-direction: column; gap: 8px; }
        .r-meta-row { display: flex; align-items: center; gap: 8px; }
        .r-meta-row span { font-size: 14px; color: #666; }

        /* Selects customizados */
        .r-selects { background: #fff; padding: 8px 20px 20px; display: flex; flex-direction: column; gap: 18px; }
        .r-select-label { display: block; font-size: 13px; font-weight: 600; color: #1a1a1a; margin-bottom: 8px; }
        .r-dropdown-btn { width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 13px 14px; border: 1.5px solid #EBEBEB; border-radius: 12px; background: #fff; cursor: pointer; font-family: inherit; transition: border-color 0.15s; }
        .r-dropdown-btn:hover { border-color: #ccc; }
        .r-dropdown-btn.open { border-radius: 12px 12px 0 0; border-bottom: 1px solid #F0F0F0; }
        .r-dropdown-btn.disabled { cursor: default; opacity: 0.6; }
        .r-dropdown-placeholder { font-size: 14px; color: #999; font-weight: 400; }
        .r-dropdown-selected { font-size: 14px; color: #1a1a1a; font-weight: 600; }
        .r-chevron { transition: transform 0.25s ease; }
        .r-chevron.rotated { transform: rotate(180deg); }
        .r-dropdown-list { border: 1.5px solid #EBEBEB; border-top: none; border-radius: 0 0 16px 16px; background: #fff; overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
        .r-dropdown-item { width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border: none; border-bottom: 1px solid #F5F5F5; background: #fff; cursor: pointer; font-family: inherit; transition: background 0.15s ease; text-align: left; }
        .r-dropdown-item:last-child { border-bottom: none; }
        .r-dropdown-item.selected { background: #F3F0FF; }
        .r-dropdown-item:hover:not(.unavailable) { background: #faf8ff; }
        .r-dropdown-item.unavailable { cursor: default; }
        .r-item-nome { font-size: 14px; font-weight: 400; color: #1a1a1a; }
        .r-item-nome.selected { font-weight: 600; }
        .r-item-nome.unavailable { color: #BCBCBC; }
        .r-item-badges { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
        .r-badge-preco { background: #EEEBFF; color: #6C5CE7; font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 20px; white-space: nowrap; }
        .r-badge-qtd { background: #9944CC; color: #fff; font-size: 11px; font-weight: 600; padding: 4px 8px 4px 6px; border-radius: 20px; display: flex; align-items: center; gap: 4px; white-space: nowrap; }
        .r-badge-indisponivel { font-size: 13px; color: #CCCCCC; font-weight: 400; white-space: nowrap; }

        /* Action buttons */
        .r-actions { background: #fff; padding: 12px 20px 20px; display: flex; gap: 12px; border-radius: 0 0 20px 20px; margin-bottom: 16px; }
        .r-btn-buy { flex: 1; display: flex; align-items: center; justify-content: center; background: #9944CC; color: #fff; border: none; border-radius: 14px; padding: 14px 0; font-size: 15px; font-weight: 600; cursor: pointer; font-family: inherit; }
        .r-btn-buy:disabled { opacity: 0.6; cursor: not-allowed; }
        .r-btn-price { padding-right: 12px; border-right: 1.5px solid rgba(255,255,255,0.35); margin-right: 12px; font-weight: 700; }
        .r-btn-sell { flex: 1; background: #F3EAFF; color: #9944CC; border: none; border-radius: 14px; padding: 14px 0; font-size: 15px; font-weight: 600; cursor: pointer; font-family: inherit; }

        /* Section cards */
        .r-card { background: #fff; border-radius: 16px; padding: 20px; margin-bottom: 14px; }
        .r-card-header { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
        .r-card-header h2 { font-size: 16px; font-weight: 700; color: #1a1a1a; margin: 0; }
        .r-card-row { display: flex; align-items: center; justify-content: space-between; cursor: pointer; }
        .r-card-row-left { display: flex; align-items: center; gap: 14px; flex: 1; }
        .r-card-icon { width: 44px; height: 44px; border-radius: 12px; background: #F3EAFF; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .r-card-row-left h3 { font-size: 15px; font-weight: 700; color: #1a1a1a; margin: 0 0 3px; }
        .r-card-row-left p { font-size: 12px; color: #999; margin: 0; line-height: 1.4; }

        /* Detalhes */
        .r-alert { display: flex; align-items: flex-start; gap: 8px; margin-bottom: 18px; }
        .r-alert-dot { width: 8px; height: 8px; border-radius: 50%; background: #22c55e; flex-shrink: 0; margin-top: 5px; }
        .r-alert p { font-size: 13px; color: #666; margin: 0; line-height: 1.45; }
        .r-alert strong { color: #1a1a1a; }
        .r-desc-text { font-size: 13px; color: #555; line-height: 1.6; margin: 0 0 18px; }
        .r-programacao { border-top: 1px solid #f0f0f0; padding-top: 16px; font-size: 13px; color: #555; line-height: 1.6; margin: 0; }
        .r-programacao strong { color: #1a1a1a; }
      `}</style>

      <div className="revenda-page">

        {/* ── Hero ── */}
        <div className="r-hero">
          {thumb ? (
            <img src={thumb} alt={resale.evento?.nome ?? ""} className="r-hero-img" />
          ) : (
            <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #1A1A2E, #9944CC)" }} />
          )}
          <div className="r-hero-gradient" />
          {/* Botões de ação no hero */}
          <div className="r-hero-top">
            <button className="r-hero-btn" aria-label="Favoritar">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </button>
            <button className="r-hero-btn" aria-label="Compartilhar">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
            </button>
          </div>
        </div>

        {/* ── Conteúdo ── */}
        <div className="r-content">

          {/* Título + meta */}
          <div className="r-event-header">
            <h1 className="r-event-title">{resale.evento?.nome ?? "Evento"}</h1>
            <div className="r-meta">
              {resale.evento?.endereco && (
                <div className="r-meta-row">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#9944CC">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/>
                  </svg>
                  <span>{resale.evento.endereco.localidade}, {resale.evento.endereco.uf}</span>
                </div>
              )}
              {dataFmt && (
                <div className="r-meta-row">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="4" width="18" height="18" rx="2" stroke="#9944CC" strokeWidth="1.5"/>
                    <line x1="3" y1="10" x2="21" y2="10" stroke="#9944CC" strokeWidth="1.5"/>
                    <line x1="8" y1="2" x2="8" y2="6" stroke="#9944CC" strokeWidth="1.5" strokeLinecap="round"/>
                    <line x1="16" y1="2" x2="16" y2="6" stroke="#9944CC" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  <span>{dataFmt}{resale.evento?.horario ? ` · ${resale.evento.horario.slice(0, 5)}` : ""}</span>
                </div>
              )}
            </div>
          </div>

          {/* Dropdowns customizados */}
          <div className="r-selects">

            {/* ── Tipo de ingresso ── */}
            <div>
              <label className="r-select-label">Tipo de ingresso</label>
              <div style={{ position: "relative" }}>
                <button
                  className={`r-dropdown-btn${openTipo ? " open" : ""}`}
                  onClick={() => { setOpenTipo(!openTipo); setOpenCategoria(false); }}
                >
                  {selectedTipo
                    ? <span className="r-dropdown-selected">{selectedTipo}</span>
                    : <span className="r-dropdown-placeholder">Selecione o tipo de ingresso</span>
                  }
                  <svg className={`r-chevron${openTipo ? " rotated" : ""}`} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>
                {openTipo && (
                  <div className="r-dropdown-list">
                    {nomesUnicos.map((nome) => {
                      const revendasDoTipo = resalesDoEvento.filter((r) => r.ingresso?.nome === nome);
                      const temRevenda = revendasDoTipo.length > 0;
                      const qtd = revendasDoTipo.length;
                      const menorPreco = temRevenda
                        ? Math.min(...revendasDoTipo.map((r) => r.buyerPrice ?? r.originalPrice))
                        : null;
                      const isSelected = selectedTipo === nome;
                      return (
                        <button
                          key={nome}
                          className={`r-dropdown-item${isSelected ? " selected" : ""}${!temRevenda ? " unavailable" : ""}`}
                          onClick={() => {
                            if (!temRevenda) return;
                            setSelectedTipo(nome);
                            setSelectedCategoria("");
                            setOpenTipo(false);
                            setOpenCategoria(true);
                          }}
                        >
                          <span className={`r-item-nome${isSelected ? " selected" : ""}${!temRevenda ? " unavailable" : ""}`}>
                            {nome}
                          </span>
                          <div className="r-item-badges">
                            {temRevenda ? (
                              <>
                                <span className="r-badge-preco">
                                  R$ {menorPreco!.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                </span>
                                <span className="r-badge-qtd">
                                  <svg width="11" height="11" viewBox="0 0 20 20" fill="#fff">
                                    <path d="M17 3H3a1 1 0 0 0-1 1v3.586a1 1 0 0 0 .293.707A2 2 0 0 1 3 10a2 2 0 0 1-.707 1.707A1 1 0 0 0 2 12.414V16a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3.586a1 1 0 0 0-.293-.707A2 2 0 0 1 17 10a2 2 0 0 1 .707-1.707A1 1 0 0 0 18 7.586V4a1 1 0 0 0-1-1zm-5 11H8v-2h4v2zm0-4H8V8h4v2z"/>
                                  </svg>
                                  {qtd}
                                </span>
                              </>
                            ) : (
                              <span className="r-badge-indisponivel">Indisponível</span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* ── Categoria ── */}
            <div>
              <label className="r-select-label">Categoria</label>
              <div style={{ position: "relative" }}>
                <button
                  className={`r-dropdown-btn${openCategoria ? " open" : ""}${!selectedTipo ? " disabled" : ""}`}
                  onClick={() => { if (selectedTipo) { setOpenCategoria(!openCategoria); setOpenTipo(false); } }}
                >
                  {selectedCategoria
                    ? <span className="r-dropdown-selected">{selectedCategoria}</span>
                    : <span className="r-dropdown-placeholder">Selecione a categoria</span>
                  }
                  <svg className={`r-chevron${openCategoria ? " rotated" : ""}`} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>
                {openCategoria && selectedTipo && (
                  <div className="r-dropdown-list">
                    {resalesDoEvento
                      .filter((r) => r.ingresso?.nome === selectedTipo)
                      .reduce((acc, r) => {
                        const key = `Lote ${r.ingresso?.lote}`;
                        if (!acc.find((a) => a.key === key)) {
                          const grupo = resalesDoEvento.filter(
                            (x) => x.ingresso?.nome === selectedTipo && x.ingresso?.lote === r.ingresso?.lote
                          );
                          acc.push({ key, count: grupo.length, menorPreco: Math.min(...grupo.map((x) => x.buyerPrice ?? x.originalPrice)) });
                        }
                        return acc;
                      }, [] as { key: string; count: number; menorPreco: number }[])
                      .map((opt) => {
                        const isSelected = selectedCategoria === opt.key;
                        return (
                          <button
                            key={opt.key}
                            className={`r-dropdown-item${isSelected ? " selected" : ""}`}
                            onClick={() => { setSelectedCategoria(opt.key); setOpenCategoria(false); }}
                          >
                            <span className={`r-item-nome${isSelected ? " selected" : ""}`}>{opt.key}</span>
                            <div className="r-item-badges">
                              <span className="r-badge-preco">
                                R$ {opt.menorPreco.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                              </span>
                              <span className="r-badge-qtd">
                                <svg width="11" height="11" viewBox="0 0 20 20" fill="#fff">
                                  <path d="M17 3H3a1 1 0 0 0-1 1v3.586a1 1 0 0 0 .293.707A2 2 0 0 1 3 10a2 2 0 0 1-.707 1.707A1 1 0 0 0 2 12.414V16a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3.586a1 1 0 0 0-.293-.707A2 2 0 0 1 17 10a2 2 0 0 1 .707-1.707A1 1 0 0 0 18 7.586V4a1 1 0 0 0-1-1zm-5 11H8v-2h4v2zm0-4H8V8h4v2z"/>
                                </svg>
                                {opt.count}
                              </span>
                            </div>
                          </button>
                        );
                      })
                    }
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Botões */}
          <div className="r-actions">
            <button className="r-btn-buy" onClick={handleBuy} disabled={buying}>
              {buying ? (
                <><Loader2 size={16} className="animate-spin" style={{ marginRight: 8 }} />Processando...</>
              ) : (
                <>
                  <span className="r-btn-price">{precoFmt}</span>
                  <span>Comprar</span>
                </>
              )}
            </button>
            <Link href="/meus-ingressos" style={{ flex: 1 }}>
              <button className="r-btn-sell" style={{ width: "100%" }}>Vender</button>
            </Link>
          </div>

          {/* Guia de transferência */}
          <div className="r-card r-card-row">
            <div className="r-card-row-left">
              <div className="r-card-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M7 16l-4-4 4-4M17 8l4 4-4 4" stroke="#9944CC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <h3>Guia de transferência</h3>
                <p>Veja o passo a passo para enviar ou receber com segurança.</p>
              </div>
            </div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </div>

          {/* Detalhes do evento */}
          <div className="r-card">
            <div className="r-card-header">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" fill="#9944CC"/>
                <text x="12" y="17" textAnchor="middle" fill="#fff" fontSize="14" fontWeight="bold" fontFamily="Georgia,serif" fontStyle="italic">i</text>
              </svg>
              <h2>Detalhes do evento</h2>
            </div>

            <div className="r-alert">
              <span className="r-alert-dot" />
              <p>Este ingresso está em revenda para <strong>{resale.evento?.nome}</strong> — garanta o seu agora.</p>
            </div>

            {resale.evento?.descricao ? (
              <p className="r-desc-text">{resale.evento.descricao}</p>
            ) : (
              <p className="r-desc-text">
                Ingresso em revenda pelo valor original do lote. Após a compra, o QR Code é transferido instantaneamente para a sua conta.
              </p>
            )}

            <p className="r-programacao">
              📋 <strong>Informações</strong> · Setor: {resale.ingresso?.nome ?? "—"} · Lote {resale.ingresso?.lote ?? "—"} · Preço original: R$ {resale.originalPrice?.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </div>

        </div>
      </div>
    </>
  );
}
