"use client";

import { useEffect, useState } from "react";
import { Loader2, Save, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api, { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";

interface GatewayConfig {
  id: number;
  name: string;
  pixRateBps: number;
  pixFixedCents: number;
  cardRateBps: number[];
  cardFixedCents: number;
  maxInstallments: number;
  accept3dsAttempt: boolean;
  withdrawalFixedCents: number;
  anticipationRateBps: number;
  settlementDays: number;
  updatedAt: string;
}

function bpsToPercent(bps: number): string {
  return (bps / 100).toFixed(2);
}

function percentToBps(pct: string): number {
  return Math.round(parseFloat(pct || "0") * 100);
}

function centsToReais(cents: number): string {
  return (cents / 100).toFixed(2);
}

function reaisToCents(reais: string): number {
  return Math.round(parseFloat(reais || "0") * 100);
}

export default function TaxasGatewayPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<GatewayConfig | null>(null);

  const [pixRate, setPixRate] = useState("");
  const [pixFixed, setPixFixed] = useState("");
  const [cardRates, setCardRates] = useState<string[]>(Array(12).fill(""));
  const [cardFixed, setCardFixed] = useState("");
  const [maxInstallments, setMaxInstallments] = useState(12);
  const [accept3dsAttempt, setAccept3dsAttempt] = useState(false);
  const [withdrawalFixed, setWithdrawalFixed] = useState("");
  const [anticipationRate, setAnticipationRate] = useState("");
  const [settlementDays, setSettlementDays] = useState("");

  useEffect(() => {
    loadConfig();
  }, []);

  function setCardRate(index: number, value: string) {
    setCardRates((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  async function loadConfig() {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/taxas-gateway");
      if (data.config) {
        const c = data.config as GatewayConfig;
        setConfig(c);
        setPixRate(bpsToPercent(c.pixRateBps));
        setPixFixed(centsToReais(c.pixFixedCents));
        setCardRates((c.cardRateBps ?? []).map((bps) => bpsToPercent(bps ?? 0)));
        setCardFixed(centsToReais(c.cardFixedCents));
        setMaxInstallments(c.maxInstallments ?? 12);
        setAccept3dsAttempt(c.accept3dsAttempt ?? false);
        setWithdrawalFixed(centsToReais(c.withdrawalFixedCents));
        setAnticipationRate(bpsToPercent(c.anticipationRateBps));
        setSettlementDays(String(c.settlementDays));
      }
    } catch (err) {
      toast.error(getErrorMessage(err, "Erro ao carregar configurações."));
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = {
        pixRateBps: percentToBps(pixRate),
        pixFixedCents: reaisToCents(pixFixed),
        cardRateBps: cardRates.map((r) => percentToBps(r)),
        cardFixedCents: reaisToCents(cardFixed),
        maxInstallments,
        accept3dsAttempt,
        withdrawalFixedCents: reaisToCents(withdrawalFixed),
        anticipationRateBps: percentToBps(anticipationRate),
        settlementDays: parseInt(settlementDays, 10),
      };

      await api.put("/admin/taxas-gateway", payload);
      toast.success("Taxas atualizadas com sucesso!");
      await loadConfig();
    } catch (err) {
      toast.error(getErrorMessage(err, "Erro ao salvar configurações."));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold">Taxas do Gateway</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure as taxas de processamento da Pagar.me. Alterações afetam novos checkouts imediatamente.
        </p>
      </div>

      {!config && (
        <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 p-4 text-amber-800 text-sm">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>Nenhuma configuração encontrada. Preencha os campos e salve para criar.</span>
        </div>
      )}

      <div className="space-y-6">
        <Section title="PIX">
          <Field label="Taxa (%)" value={pixRate} onChange={setPixRate} placeholder="1.09" />
          <Field label="Taxa fixa (R$)" value={pixFixed} onChange={setPixFixed} placeholder="0.55" />
        </Section>

        <div className="rounded-lg border bg-white p-5 space-y-4">
          <h2 className="text-lg font-medium">Cartão de Crédito</h2>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Máximo de parcelas oferecidas ao cliente</label>
            <select
              value={maxInstallments}
              onChange={(e) => setMaxInstallments(parseInt(e.target.value, 10))}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>{n}x</option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              Parcelas acima desse limite não aparecem no checkout. (Taxas abaixo ficam desativadas.)
            </p>
          </div>

          <div className="pt-2 border-t">
            <p className="text-sm font-medium text-gray-700 mb-3">Taxa por parcela (%)</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {cardRates.map((rate, i) => {
                const disabled = i + 1 > maxInstallments;
                return (
                  <div key={i} className={`space-y-1 ${disabled ? "opacity-40" : ""}`}>
                    <label className="text-sm font-medium text-gray-700">{i + 1}x</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={rate}
                      disabled={disabled}
                      onChange={(e) => setCardRate(i, e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-2 border-t">
            <Field label="Taxa fixa por transação (R$)" value={cardFixed} onChange={setCardFixed} placeholder="0.99" hint="Gateway + Antifraude" />
          </div>
        </div>

        <div className="rounded-lg border bg-white p-5 space-y-4">
          <div>
            <h2 className="text-lg font-medium">Autenticação 3DS (cartão)</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Define quais resultados de autenticação 3DS liberam a compra no cartão. O 3DS é obrigatório — cartão sem autenticação válida é sempre bloqueado.
            </p>
          </div>

          <label className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer ${!accept3dsAttempt ? "border-violet-500 bg-violet-50" : "border-gray-200"}`}>
            <input type="radio" name="threeds-policy" checked={!accept3dsAttempt} onChange={() => setAccept3dsAttempt(false)} className="mt-1 accent-violet-600" />
            <div>
              <p className="text-sm font-medium text-gray-800">Aceitar apenas Y</p>
              <p className="text-xs text-muted-foreground">Mais seguro, menor risco de chargeback. Pode reduzir a aprovação de alguns cartões. (Padrão recomendado.)</p>
            </div>
          </label>

          <label className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer ${accept3dsAttempt ? "border-violet-500 bg-violet-50" : "border-gray-200"}`}>
            <input type="radio" name="threeds-policy" checked={accept3dsAttempt} onChange={() => setAccept3dsAttempt(true)} className="mt-1 accent-violet-600" />
            <div>
              <p className="text-sm font-medium text-gray-800">Aceitar Y e A</p>
              <p className="text-xs text-muted-foreground">Maior conversão: aceita também tentativas de autenticação registradas (A). Pode aumentar o risco em alguns casos.</p>
            </div>
          </label>
        </div>

        <Section title="Outros">
          <Field label="Taxa de saque (R$)" value={withdrawalFixed} onChange={setWithdrawalFixed} placeholder="3.67" />
          <Field label="Antecipação (%)" value={anticipationRate} onChange={setAnticipationRate} placeholder="2.89" />
          <Field label="Prazo de recebimento (dias)" value={settlementDays} onChange={setSettlementDays} placeholder="15" />
        </Section>
      </div>

      <div className="flex justify-end pt-4 border-t">
        <Button onClick={handleSave} disabled={saving} className="bg-violet-600 hover:bg-violet-700">
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Salvar alterações
        </Button>
      </div>

      {config?.updatedAt && (
        <p className="text-xs text-muted-foreground text-right">
          Última atualização: {new Date(config.updatedAt).toLocaleString("pt-BR")}
        </p>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-white p-5 space-y-4">
      <h2 className="text-lg font-medium">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {children}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <Input
        type="number"
        step="0.01"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
