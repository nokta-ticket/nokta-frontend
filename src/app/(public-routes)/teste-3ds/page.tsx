"use client";

/**
 * Página ISOLADA para validar o 3DS (Stone/Pagar.me) no sandbox.
 * Faz só: carrega o SDK de teste → pega o token TDS no backend →
 * chama TDS.init com um cartão de teste → mostra o resultado cru.
 * Sem reserva, gross-up, pedido ou webhook.
 *
 * Requer estar logado (o endpoint /pagamento/tds-token exige JWT).
 */

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { TDS_SCRIPT_URL } from "@/lib/pagarme";

// Página de diagnóstico do 3DS. Os cartões de teste abaixo só funcionam em
// SANDBOX (NEXT_PUBLIC_PAGARME_ENV != "production").

// Cartões de teste 3DS (doc Pagar.me — Manual de Integração 3DS)
const TEST_CARDS = [
  { number: "3000100811112072", label: "Challenge manual (mostra a tela)" },
  { number: "4000100511112003", label: "Frictionless (sem tela — esperado)" },
  { number: "7000100911112070", label: "Auto challenge — sucesso" },
  { number: "3000101011112071", label: "Auto challenge — falha" },
];

let scriptPromise: Promise<void> | null = null;
function loadTdsScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if ((window as any).TDS) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = TDS_SCRIPT_URL;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Falha ao carregar o SDK 3DS."));
    document.body.appendChild(s);
  });
  return scriptPromise;
}

export default function Teste3dsPage() {
  const [cardNumber, setCardNumber] = useState(TEST_CARDS[0].number);
  const [log, setLog] = useState<string[]>([]);
  const [result, setResult] = useState<any>(null);
  const [running, setRunning] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);

  const append = (msg: string) =>
    setLog((l) => [...l, `${new Date().toLocaleTimeString()} — ${msg}`]);

  useEffect(() => {
    loadTdsScript()
      .then(() => { setSdkReady(true); append("SDK 3DS (sandbox) carregado."); })
      .catch((e) => append(`ERRO ao carregar SDK: ${e.message}`));
  }, []);

  async function runTest() {
    setRunning(true);
    setResult(null);
    setLog([]);
    try {
      append("Carregando SDK…");
      await loadTdsScript();

      append("Pedindo token TDS ao backend (/pagamento/tds-token)…");
      const { data: tokenRes } = await api.get("/pagamento/tds-token");
      if (!tokenRes?.tdsToken) throw new Error("Backend não retornou tdsToken.");
      append("Token TDS recebido.");

      // Dados de teste fixos (não é cobrança — só autenticação)
      const billingAddress = {
        country: "BR",
        state: "SP",
        city: "São Paulo",
        zip_code: "01310100",
        line_1: "1000, Avenida Paulista, Bela Vista",
        line_2: "Sem complemento",
      };

      const orderData = {
        payments: [{
          payment_method: "credit_card",
          credit_card: {
            card: {
              number: cardNumber,
              holder_name: "CLIENTE TESTE",
              exp_month: 12,
              exp_year: new Date().getFullYear() + 2,
              billing_address: billingAddress,
            },
          },
          amount: 10000, // R$ 100,00 (só p/ o desafio; não cobra nada)
        }],
        customer: {
          name: "Cliente Teste",
          email: "teste@nokta.com",
          document: "12345678909",
          code: "teste-3ds",
          phones: {
            mobile_phone: { country_code: "55", area_code: "11", number: "999999999" },
          },
        },
        items: [{ description: "Ingresso Teste", code: "1" }],
        shipping: { recipient_name: "Cliente Teste", address: billingAddress },
        requestor_url: window.location.origin,
      };

      append(`Chamando TDS.init com cartão ${cardNumber}…`);
      const tdsResp = await (window as any).TDS.init({
        token: tokenRes.tdsToken,
        tds_method_container_element: document.getElementById("tdsMethodContainer"),
        challenge_container_element: document.getElementById("challengeContainer"),
        use_default_challenge_iframe_style: true,
        challenge_window_size: "03",
      }, orderData);

      const tds = Array.isArray(tdsResp) ? tdsResp[0] : tdsResp;
      append("TDS.init retornou.");
      setResult(tds);

      const status = tds?.trans_status;
      const map: Record<string, string> = {
        Y: "Y — autenticado (liability shift completo) ✅",
        A: "A — tentativa de autenticação",
        N: "N — NÃO autenticado / falhou ❌",
        C: "C — challenge requerido",
        U: "U — autenticação indisponível",
        R: "R — rejeitado ❌",
        I: "I — apenas informativo",
      };
      append(`trans_status = ${map[status] ?? status ?? "(vazio)"}`);
      if (tds?.challenge_canceled) append("challenge_canceled = true (usuário cancelou)");
    } catch (e: any) {
      const detail = e?.response?.data
        ? JSON.stringify(e.response.data)
        : e?.message ?? "erro desconhecido";
      append(`ERRO: ${detail}`);
    } finally {
      setRunning(false);
    }
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight">Teste isolado — 3DS sandbox</h1>
      <p className="mt-1 text-sm text-slate-500">
        Valida só a autenticação 3DS (challenge), sem checkout. Precisa estar logado.
      </p>

      <div className="mt-5 space-y-3">
        <label className="block text-sm font-medium text-slate-700">Cartão de teste</label>
        <select
          value={cardNumber}
          onChange={(e) => setCardNumber(e.target.value)}
          className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
        >
          {TEST_CARDS.map((c) => (
            <option key={c.number} value={c.number}>{c.number} — {c.label}</option>
          ))}
        </select>

        <button
          onClick={runTest}
          disabled={running || !sdkReady}
          className="w-full rounded-xl bg-gradient-to-r from-[#9944CC] to-[#3399FF] py-3 text-sm font-bold text-white disabled:opacity-60"
        >
          {running ? "Executando…" : sdkReady ? "Iniciar autenticação 3DS" : "Carregando SDK…"}
        </button>
      </div>

      {log.length > 0 && (
        <pre className="mt-5 max-h-64 overflow-auto rounded-xl bg-slate-900 p-4 text-xs leading-relaxed text-green-300 whitespace-pre-wrap">
          {log.join("\n")}
        </pre>
      )}

      {result && (
        <pre className="mt-3 overflow-auto rounded-xl bg-slate-100 p-4 text-xs text-slate-800 whitespace-pre-wrap">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}

      {/* Containers do 3DS */}
      <div id="tdsMethodContainer" style={{ display: "none" }} />
      <div
        id="challengeContainer"
        className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none [&:not(:empty)]:pointer-events-auto [&:not(:empty)]:bg-black/50"
      />
    </main>
  );
}
