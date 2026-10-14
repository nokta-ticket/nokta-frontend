"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/cn";
import api, { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { formatDateTime } from "../_lib/format";

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

const bpsToPercent = (bps: number) => (bps / 100).toFixed(2);
const percentToBps = (pct: string) => Math.round(parseFloat(pct || "0") * 100);
const centsToReais = (cents: number) => (cents / 100).toFixed(2);
const reaisToCents = (reais: string) => Math.round(parseFloat(reais || "0") * 100);

export default function TaxasGatewayPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<GatewayConfig | null>(null);

  const [pixRate, setPixRate] = useState("");
  const [cardRates, setCardRates] = useState<string[]>(Array(12).fill(""));
  const [cardFixed, setCardFixed] = useState("");
  const [maxInstallments, setMaxInstallments] = useState(12);
  const [accept3dsAttempt, setAccept3dsAttempt] = useState(false);
  const [withdrawalFixed, setWithdrawalFixed] = useState("");
  const [anticipationRate, setAnticipationRate] = useState("");
  const [settlementDays, setSettlementDays] = useState("");

  const loadConfig = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<{ config: GatewayConfig | null }>("/admin/taxas-gateway");
      if (data.config) {
        const c = data.config;
        setConfig(c);
        setPixRate(bpsToPercent(c.pixRateBps));
        setCardRates(Array.from({ length: 12 }, (_, i) => bpsToPercent(c.cardRateBps?.[i] ?? 0)));
        setCardFixed(centsToReais(c.cardFixedCents));
        setMaxInstallments(c.maxInstallments ?? 12);
        setAccept3dsAttempt(c.accept3dsAttempt ?? false);
        setWithdrawalFixed(centsToReais(c.withdrawalFixedCents));
        setAnticipationRate(bpsToPercent(c.anticipationRateBps));
        setSettlementDays(String(c.settlementDays));
      }
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível carregar as taxas."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadConfig();
  }, [loadConfig]);

  function setCardRate(index: number, value: string) {
    setCardRates((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      await api.put("/admin/taxas-gateway", {
        pixRateBps: percentToBps(pixRate),
        cardRateBps: cardRates.map((r) => percentToBps(r)),
        cardFixedCents: reaisToCents(cardFixed),
        maxInstallments,
        accept3dsAttempt,
        withdrawalFixedCents: reaisToCents(withdrawalFixed),
        anticipationRateBps: percentToBps(anticipationRate),
        settlementDays: parseInt(settlementDays, 10),
      });
      toast.success("Taxas salvas");
      await loadConfig();
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível salvar as taxas."));
    } finally {
      setSaving(false);
    }
  }

  if (loading && !config) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-6">
            <Skeleton className="h-40 rounded-card" />
            <Skeleton className="h-72 rounded-card" />
          </div>
          <Skeleton className="h-56 rounded-card" />
        </div>
      </div>
    );
  }

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        void handleSave();
      }}
    >
      <PageHeader
        title="Taxas do gateway"
        description="Taxas de processamento da Pagar.me. Alterações valem pra novos checkouts imediatamente."
        meta={config?.updatedAt ? <span>Última alteração em {formatDateTime(config.updatedAt)}</span> : undefined}
        actions={
          <Button type="submit" loading={saving} leftIcon="save">
            Salvar alterações
          </Button>
        }
      />

      {!config ? <Callout tone="warning" title="Nenhuma configuração encontrada">Preencha os campos e salve pra criar a primeira.</Callout> : null}

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Pix</CardTitle>
                <CardDescription>Sem taxa fixa: a Pagar.me cobra só o percentual sobre o total do Pix.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <Field label="Taxa" htmlFor="pix-rate" className="max-w-xs">
                <Input id="pix-rate" type="number" step="0.01" min="0" suffix="%" value={pixRate} onChange={(e) => setPixRate(e.target.value)} placeholder="1.09" />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Cartão de crédito</CardTitle>
                <CardDescription>Parcelas acima do máximo não aparecem no checkout.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
              <FieldGroup columns={2}>
                <Field label="Máximo de parcelas oferecidas" htmlFor="max-installments">
                  <NativeSelect id="max-installments" value={maxInstallments} onChange={(e) => setMaxInstallments(parseInt(e.target.value, 10))}>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>
                        {n}x
                      </option>
                    ))}
                  </NativeSelect>
                </Field>
                <Field label="Taxa fixa por transação" htmlFor="card-fixed" hint="Gateway + antifraude.">
                  <Input id="card-fixed" type="number" step="0.01" min="0" prefix="R$" value={cardFixed} onChange={(e) => setCardFixed(e.target.value)} placeholder="0.99" />
                </Field>
              </FieldGroup>

              <div>
                <p className="text-sm font-medium text-foreground">Taxa por parcela (%)</p>
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {cardRates.map((rate, i) => {
                    const disabled = i + 1 > maxInstallments;
                    return (
                      <Field key={i} label={`${i + 1}x`} htmlFor={`card-rate-${i}`} className={cn(disabled && "opacity-40")}>
                        <Input id={`card-rate-${i}`} type="number" step="0.01" min="0" suffix="%" value={rate} disabled={disabled} onChange={(e) => setCardRate(i, e.target.value)} placeholder="0.00" />
                      </Field>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Autenticação 3DS (cartão)</CardTitle>
                <CardDescription>Define quais resultados de autenticação 3DS liberam a compra no cartão. O 3DS é obrigatório — cartão sem autenticação válida é sempre bloqueado.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="grid gap-3 pt-4 sm:grid-cols-2">
              {[
                { value: false, title: "Aceitar apenas Y", detail: "Mais seguro, menor risco de chargeback. Pode reduzir a aprovação de alguns cartões. Padrão recomendado." },
                { value: true, title: "Aceitar Y e A", detail: "Maior conversão: aceita também tentativas de autenticação registradas (A). Pode aumentar o risco em alguns casos." },
              ].map((opt) => {
                const checked = accept3dsAttempt === opt.value;
                return (
                  <label key={String(opt.value)} className={cn("flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors", checked ? "border-brand bg-brand-soft/60 ring-1 ring-brand-ring" : "border-border hover:border-border-strong")}>
                    <input type="radio" name="threeds-policy" className="mt-1 size-4 accent-brand" checked={checked} onChange={() => setAccept3dsAttempt(opt.value)} />
                    <span>
                      <span className="block text-sm font-semibold text-foreground">{opt.title}</span>
                      <span className="mt-0.5 block text-caption text-muted-foreground">{opt.detail}</span>
                    </span>
                  </label>
                );
              })}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Saque e antecipação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <Field label="Taxa de saque" htmlFor="withdrawal-fixed">
                <Input id="withdrawal-fixed" type="number" step="0.01" min="0" prefix="R$" value={withdrawalFixed} onChange={(e) => setWithdrawalFixed(e.target.value)} placeholder="3.67" />
              </Field>
              <Field label="Antecipação" htmlFor="anticipation-rate">
                <Input id="anticipation-rate" type="number" step="0.01" min="0" suffix="%" value={anticipationRate} onChange={(e) => setAnticipationRate(e.target.value)} placeholder="2.89" />
              </Field>
              <Field label="Prazo de recebimento" htmlFor="settlement-days">
                <Input id="settlement-days" type="number" step="1" min="0" suffix="dias" value={settlementDays} onChange={(e) => setSettlementDays(e.target.value)} placeholder="15" />
              </Field>
            </CardContent>
          </Card>

          <Callout tone="info" title="Quem paga o quê">
            A taxa da Nokta é por workspace (veja em cada um). As taxas daqui são do processamento e valem pra todos os workspaces, pagas pelo comprador.
          </Callout>
        </div>
      </div>
    </form>
  );
}
