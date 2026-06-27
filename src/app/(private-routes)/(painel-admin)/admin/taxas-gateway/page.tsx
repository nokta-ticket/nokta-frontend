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
        setCardRates(c.cardRateBps.map((bps) => bpsToPercent(bps)));
        setCardFixed(centsToReais(c.cardFixedCents));
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
          <h2 className="text-lg font-medium">Cartão de Crédito — Taxa por parcela (%)</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {cardRates.map((rate, i) => (
              <div key={i} className="space-y-1">
                <label className="text-sm font-medium text-gray-700">{i + 1}x</label>
                <Input
                  type="number"
                  step="0.01"
                  value={rate}
                  onChange={(e) => setCardRate(i, e.target.value)}
                  placeholder="0.00"
                />
              </div>
            ))}
          </div>
          <div className="pt-2 border-t">
            <Field label="Taxa fixa por transação (R$)" value={cardFixed} onChange={setCardFixed} placeholder="0.99" hint="Gateway + Antifraude" />
          </div>
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
