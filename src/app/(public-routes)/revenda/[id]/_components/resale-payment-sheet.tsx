"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import axios from "axios";
import { Loader2, X, Copy, QrCode as QrIcon, CreditCard } from "lucide-react";
import QRCode from "react-qr-code";
import api, { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { useAuth } from "@/context/AuthContext";
import { THREEDS_ENABLED, tokenizeCard, loadTdsScript } from "@/lib/pagarme";

// Fallbacks das taxas do gateway (o real vem de /pagamento/info-parcelas)
const GATEWAY_PIX_RATE = 0.0109, GATEWAY_PIX_FIXED = 0.55;
const GATEWAY_CARD_1X = 0.0319, GATEWAY_CARD_26 = 0.0449, GATEWAY_CARD_718 = 0.0499, GATEWAY_CARD_FIXED = 0.99;

const brl = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

type Props = {
  resaleId: number;
  buyerPrice: number;
  eventoNome: string;
  onClose: () => void;
  onSuccess: () => void;
};

export function ResalePaymentSheet({ resaleId, buyerPrice, eventoNome, onClose, onSuccess }: Props) {
  const { user } = useAuth();
  const [method, setMethod] = useState<"pix" | "card" | null>(null);
  const [processing, setProcessing] = useState(false);
  const [pixUrl, setPixUrl] = useState<string | null>(null);
  const [orderCode, setOrderCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Config de parcelas/taxas
  const [maxParcelas, setMaxParcelas] = useState(12);
  const [maxSemJuros, setMaxSemJuros] = useState(0);
  const [cardRateBps, setCardRateBps] = useState<number[]>([]);
  const [cardFixedCfg, setCardFixedCfg] = useState<number | null>(null);
  const [pixRateCfg, setPixRateCfg] = useState<number | null>(null);
  const [pixFixedCfg, setPixFixedCfg] = useState<number | null>(null);
  const [parcelas, setParcelas] = useState(1);

  const [form, setForm] = useState({
    cardNumber: "", cardName: "", expiryDate: "", cvv: "",
    cep: "", city: "", state: "", number: "", street: "", neighborhood: "", complemento: "",
  });

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

  // Polling do PIX (só UX — a transferência é feita pelo webhook)
  useEffect(() => {
    if (!orderCode) return;
    const t = setInterval(async () => {
      try {
        const res = await api.get(`/revenda/pagamento/status/${orderCode}`);
        if (res.data.status === "sold") { clearInterval(t); onSuccess(); }
        else if (res.data.status === "expired") { clearInterval(t); toast.error("Tempo do PIX expirado. Tente novamente."); onClose(); }
      } catch {}
    }, 3000);
    return () => clearInterval(t);
  }, [orderCode]);

  // ── Cálculo com gross-up (comprador paga a taxa) ──
  const cardFixedReais = cardFixedCfg !== null ? cardFixedCfg / 100 : GATEWAY_CARD_FIXED;
  const cardRateFor = (n: number) => {
    if (n <= maxSemJuros) return 0;
    if (cardRateBps.length >= n) return cardRateBps[n - 1] / 10000;
    return n <= 1 ? GATEWAY_CARD_1X : n <= 6 ? GATEWAY_CARD_26 : GATEWAY_CARD_718;
  };
  const cardFixedFor = (n: number) => (n <= maxSemJuros ? 0 : cardFixedReais);
  const pixRate = pixRateCfg !== null ? pixRateCfg / 10000 : GATEWAY_PIX_RATE;
  const pixFixed = pixFixedCfg !== null ? pixFixedCfg / 100 : GATEWAY_PIX_FIXED;

  const gwPct = method === "card" ? cardRateFor(parcelas) : method === "pix" ? pixRate : 0;
  const gwFixed = method === "card" ? cardFixedFor(parcelas) : method === "pix" ? pixFixed : 0;
  const total = Math.round(((buyerPrice + gwFixed) / (1 - gwPct)) * 100) / 100;
  const taxaProcessamento = Math.round((total - buyerPrice) * 100) / 100;
  const parcelaValor = method === "card" ? total / parcelas : total;

  const fld = (f: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((p) => ({ ...p, [f]: e.target.value }));
  const fmtCard = (v: string) => (v.replace(/\D/g, "").match(/.{1,4}/g) ?? []).join(" ").slice(0, 19);
  const fmtExp = (v: string) => { const c = v.replace(/\D/g, ""); return c.length >= 3 ? `${c.slice(0, 2)}/${c.slice(2, 4)}` : c; };
  const fmtCep = (v: string) => { const c = v.replace(/\D/g, "").slice(0, 8); return c.length > 5 ? `${c.slice(0, 5)}-${c.slice(5)}` : c; };

  const lastCepRef = useRef("");
  useEffect(() => {
    const cep = form.cep.replace(/\D/g, "");
    if (cep.length === 8 && cep !== lastCepRef.current) {
      lastCepRef.current = cep;
      axios.get(`https://viacep.com.br/ws/${cep}/json/`).then((r) => {
        if (!r.data.erro) setForm((f) => ({ ...f, state: r.data.uf ?? f.state, city: r.data.localidade ?? f.city, street: r.data.logradouro ?? f.street, neighborhood: r.data.bairro ?? f.neighborhood }));
      }).catch(() => {});
    }
  }, [form.cep]);

  async function handlePix() {
    setProcessing(true);
    try {
      const res = await api.post(`/revenda/${resaleId}/comprar`, { type: "pix" });
      if (res.data.pixUrl) setPixUrl(res.data.pixUrl);
      if (res.data.orderCode) setOrderCode(res.data.orderCode);
    } catch (err) {
      toast.error(getErrorMessage(err, "Erro ao gerar PIX."));
    } finally { setProcessing(false); }
  }

  async function handleCard(e: FormEvent) {
    e.preventDefault();
    if (!form.cep.trim() || !form.number.trim() || !form.city.trim() || !form.state.trim()) {
      toast.error("Preencha o endereço de cobrança (CEP, número, cidade e UF).");
      return;
    }
    setProcessing(true);
    try {
      const [month, year] = form.expiryDate.split("/");
      const expYear = year?.length === 2 ? 2000 + Number(year) : Number(year);
      const cardNumber = form.cardNumber.replace(/\s+/g, "");
      const billingAddress = {
        country: "BR", state: form.state, city: form.city,
        zip_code: form.cep.replace(/\D/g, ""),
        line_1: `${form.number}, ${form.street}, ${form.neighborhood}`,
        line_2: form.complemento.trim() || "Sem complemento",
      };

      let tdsTransactionId: string | undefined;
      let tdsTransStatus: string | undefined;

      if (THREEDS_ENABLED) {
        await loadTdsScript();
        const { data: tokenRes } = await api.get("/pagamento/tds-token");
        const phoneDigits = ((user as any)?.telefone ?? "").replace(/\D/g, "");
        const localPhone = phoneDigits.startsWith("55") && phoneDigits.length > 11 ? phoneDigits.slice(2) : phoneDigits;
        const orderData = {
          payments: [{ payment_method: "credit_card", credit_card: { card: { number: cardNumber, holder_name: form.cardName, exp_month: Number(month), exp_year: expYear, billing_address: billingAddress } }, amount: Math.round(total * 100) }],
          customer: {
            name: user?.nome ?? form.cardName, email: user?.email ?? "", document: (user?.cpf ?? "").replace(/\D/g, ""),
            code: String((user as any)?.userId ?? (user as any)?.id ?? ""),
            phones: { mobile_phone: { country_code: "55", area_code: localPhone.slice(0, 2) || "11", number: localPhone.slice(2) || "999999999" } },
          },
          items: [{ description: "Revenda", code: String(resaleId) }],
          shipping: { recipient_name: user?.nome ?? form.cardName, address: billingAddress },
          requestor_url: window.location.origin,
        };
        const tdsResp = await (window as any).TDS.init({
          token: tokenRes.tdsToken,
          tds_method_container_element: document.getElementById("tdsMethodContainer"),
          challenge_container_element: document.getElementById("challengeContainer"),
          use_default_challenge_iframe_style: true,
          challenge_window_size: "03",
        }, orderData);
        const tds = Array.isArray(tdsResp) ? tdsResp[0] : tdsResp;
        if (!tds?.tds_server_trans_id || tds?.challenge_canceled) throw new Error("Autenticação 3DS não concluída.");
        const status = String(tds.trans_status ?? "").toUpperCase();
        if (status !== "Y" && status !== "A") throw new Error(`Não foi possível autenticar o cartão (3DS status: ${status || "vazio"}).`);
        tdsTransactionId = tds.tds_server_trans_id;
        tdsTransStatus = tds.trans_status;
      }

      const cardToken = await tokenizeCard({ number: cardNumber, holder_name: form.cardName, exp_month: Number(month), exp_year: expYear, cvv: form.cvv });

      const res = await api.post(`/revenda/${resaleId}/comprar`, {
        type: "card", cardToken, parcelas, tdsTransactionId, tdsTransStatus,
        tdsVersion: tdsTransactionId ? "2.2.0" : undefined,
        address: { cep: form.cep, state: form.state, city: form.city, number: form.number, neighborhood: form.neighborhood, street: form.street, complemento: form.complemento },
      });
      if (res.data.paid) onSuccess();
      else if (res.data.orderCode) { setOrderCode(res.data.orderCode); } // aguarda webhook
    } catch (err) {
      toast.error(getErrorMessage(err, "Erro ao processar pagamento. Verifique os dados do cartão."));
    } finally { setProcessing(false); }
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)" }} onClick={onClose} />
      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 430, background: "#fff", borderRadius: "20px 20px 0 0", padding: "18px 18px 28px", maxHeight: "92vh", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: "#1a1a1a", margin: 0 }}>Pagamento da revenda</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#999" }}><X size={20} /></button>
        </div>

        {/* PIX gerado */}
        {pixUrl ? (
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 14, color: "#555", marginBottom: 14 }}>Escaneie o QR ou copie o código. O ingresso é liberado após a confirmação.</p>
            <div style={{ background: "#fff", padding: 12, display: "inline-block", border: "1px solid #eee", borderRadius: 12 }}>
              <QRCode value={pixUrl} size={190} />
            </div>
            <button onClick={() => { navigator.clipboard.writeText(pixUrl); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
              style={{ marginTop: 16, width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "#F3EAFF", color: "#9944CC", border: "none", borderRadius: 12, padding: "12px 0", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
              <Copy size={15} /> {copied ? "Copiado!" : "Copiar código PIX"}
            </button>
            <div style={{ marginTop: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: "#9944CC", fontSize: 13 }}>
              <Loader2 size={14} className="animate-spin" /> Aguardando pagamento…
            </div>
          </div>
        ) : (
          <>
            {/* Seleção de método */}
            <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
              <button onClick={() => setMethod("pix")} style={mBtn(method === "pix")}>
                <QrIcon size={18} /> PIX
              </button>
              <button onClick={() => setMethod("card")} style={mBtn(method === "card")}>
                <CreditCard size={18} /> Cartão
              </button>
            </div>

            {/* Resumo (trava 6 — total transparente) */}
            {method && (
              <div style={{ background: "#F8F8FA", borderRadius: 12, padding: 14, marginBottom: 16, fontSize: 13.5 }}>
                <Row label="Valor do ingresso" value={brl(buyerPrice)} />
                <Row label="Taxa de processamento" value={brl(taxaProcessamento)} />
                <div style={{ borderTop: "1px solid #eaeaea", margin: "8px 0" }} />
                <Row label={<strong>Total</strong>} value={<strong style={{ color: "#9944CC" }}>{brl(total)}</strong>} />
                {method === "card" && parcelas > 1 && (
                  <p style={{ fontSize: 12, color: "#888", margin: "6px 0 0", textAlign: "right" }}>{parcelas}x de {brl(parcelaValor)}</p>
                )}
              </div>
            )}

            {method === "pix" && (
              <button onClick={handlePix} disabled={processing} style={payBtn(processing)}>
                {processing ? <Loader2 size={16} className="animate-spin" /> : `Gerar PIX · ${brl(total)}`}
              </button>
            )}

            {method === "card" && (
              <form onSubmit={handleCard} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <Inp placeholder="Número do cartão" value={form.cardNumber} onChange={(e) => setForm((p) => ({ ...p, cardNumber: fmtCard(e.target.value) }))} inputMode="numeric" />
                <Inp placeholder="Nome impresso no cartão" value={form.cardName} onChange={fld("cardName")} />
                <div style={{ display: "flex", gap: 10 }}>
                  <Inp placeholder="Validade (MM/AA)" value={form.expiryDate} onChange={(e) => setForm((p) => ({ ...p, expiryDate: fmtExp(e.target.value) }))} inputMode="numeric" />
                  <Inp placeholder="CVV" value={form.cvv} onChange={(e) => setForm((p) => ({ ...p, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) }))} inputMode="numeric" />
                </div>
                {maxParcelas > 1 && (
                  <select value={parcelas} onChange={(e) => setParcelas(Number(e.target.value))} style={{ padding: "12px 12px", border: "1.5px solid #EBEBEB", borderRadius: 12, fontSize: 14, fontFamily: "inherit", background: "#fff" }}>
                    {Array.from({ length: maxParcelas }, (_, i) => i + 1).map((n) => {
                      const tot = Math.round(((buyerPrice + cardFixedFor(n)) / (1 - cardRateFor(n))) * 100) / 100;
                      return <option key={n} value={n}>{n}x de {brl(tot / n)}{n <= maxSemJuros ? " sem juros" : ""}</option>;
                    })}
                  </select>
                )}
                <p style={{ fontSize: 12, fontWeight: 600, color: "#666", margin: "6px 0 0" }}>Endereço de cobrança</p>
                <div style={{ display: "flex", gap: 10 }}>
                  <Inp placeholder="CEP" value={form.cep} onChange={(e) => setForm((p) => ({ ...p, cep: fmtCep(e.target.value) }))} inputMode="numeric" />
                  <Inp placeholder="Número" value={form.number} onChange={fld("number")} />
                </div>
                <Inp placeholder="Rua" value={form.street} onChange={fld("street")} />
                <div style={{ display: "flex", gap: 10 }}>
                  <Inp placeholder="Bairro" value={form.neighborhood} onChange={fld("neighborhood")} />
                  <Inp placeholder="Complemento (opcional)" value={form.complemento} onChange={fld("complemento")} />
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <Inp placeholder="Cidade" value={form.city} onChange={fld("city")} />
                  <Inp placeholder="UF" value={form.state} onChange={(e) => setForm((p) => ({ ...p, state: e.target.value.toUpperCase().slice(0, 2) }))} />
                </div>
                <button type="submit" disabled={processing} style={payBtn(processing)}>
                  {processing ? <Loader2 size={16} className="animate-spin" /> : `Pagar ${brl(total)}`}
                </button>
              </form>
            )}
          </>
        )}

        {/* Containers do 3DS */}
        <div id="tdsMethodContainer" style={{ display: "none" }} />
        <div id="challengeContainer" style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }} />
      </div>
    </div>
  );
}

function Row({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "3px 0", color: "#555" }}><span>{label}</span><span>{value}</span></div>;
}
function Inp(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} style={{ flex: 1, width: "100%", padding: "12px 12px", border: "1.5px solid #EBEBEB", borderRadius: 12, fontSize: 16, fontFamily: "inherit", outline: "none" }} />;
}
function mBtn(active: boolean): React.CSSProperties {
  return { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "13px 0", borderRadius: 12, border: active ? "1.5px solid #9944CC" : "1.5px solid #EBEBEB", background: active ? "#F3EAFF" : "#fff", color: active ? "#9944CC" : "#555", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" };
}
function payBtn(disabled: boolean): React.CSSProperties {
  return { width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "#9944CC", color: "#fff", border: "none", borderRadius: 14, padding: "14px 0", fontSize: 15, fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.6 : 1, fontFamily: "inherit", marginTop: 4 };
}
