"use client";

import { useEffect, useState, type ReactNode } from "react";
import api, { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/cn";
import { formatBRL } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icon";
import { TIPO_LABELS, type TicketDetail } from "../../_lib/tickets";

interface ResalePreview {
  activated: boolean;
  reason: "TOO_EARLY" | "PERCENT_NOT_REACHED" | null;
  canAdd: boolean;
  sellerAmount: number;
  buyerPrice: number;
}

function Faq({ items }: { items: { title: string; content: ReactNode }[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="divide-y divide-border overflow-hidden rounded-xl border border-border">
      {items.map((item, i) => (
        <Collapsible key={item.title} open={open === i} onOpenChange={(v) => setOpen(v ? i : null)}>
          <CollapsibleTrigger className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-semibold text-foreground transition-colors hover:bg-surface-2">
            {item.title}
            <Icon name="chevron-down" size={12} className={cn("shrink-0 text-muted-foreground transition-transform", open === i && "rotate-180")} />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="space-y-2 px-4 pb-4 text-body text-muted-foreground">{item.content}</div>
          </CollapsibleContent>
        </Collapsible>
      ))}
    </div>
  );
}

/**
 * "Não poderei comparecer": anuncia o ingresso na revenda oficial. Ao abrir
 * consulta `GET /revenda/preview/:userTicketId` (liberada? limite? valores)
 * e, após revisão, `POST /revenda`. Preço é calculado pelo backend — a
 * pessoa recebe no máximo o que pagou.
 */
export function ResaleDialog({ open, onOpenChange, item, onDone }: { open: boolean; onOpenChange: (open: boolean) => void; item: TicketDetail; onDone: () => void }) {
  const [step, setStep] = useState<"form" | "confirm">("form");
  const [preview, setPreview] = useState<ResalePreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const tk = item.ticket;

  useEffect(() => {
    if (!open) return;
    let active = true;
    setStep("form");
    setPreview(null);
    setLoadingPreview(true);
    api
      .get<ResalePreview>(`/revenda/preview/${item.id}`)
      .then((res) => active && setPreview(res.data))
      .catch((err) => {
        if (!active) return;
        toast.error(getErrorMessage(err, "Não foi possível verificar a revenda."));
        onOpenChange(false);
      })
      .finally(() => active && setLoadingPreview(false));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, item.id]);

  const submit = async () => {
    try {
      setSubmitting(true);
      await api.post("/revenda", { userTicketId: item.id });
      toast.success("Ingresso colocado para revenda!");
      onOpenChange(false);
      onDone();
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível colocar para revenda."));
    } finally {
      setSubmitting(false);
    }
  };

  const available = Boolean(preview && preview.activated && preview.canAdd);

  const faq = [
    {
      title: "O que acontece com meu ingresso?",
      content: (
        <>
          <p>Enquanto estiver na revenda, o QR Code fica suspenso e não pode ser usado na entrada.</p>
          <p>Se você remover da revenda antes de vender, o QR volta a valer normalmente.</p>
          <p>Se vender, o ingresso vai automaticamente pro comprador e sai da sua carteira.</p>
        </>
      ),
    },
    {
      title: "Quanto eu recebo?",
      content: (
        <>
          <p>No máximo o valor que você pagou — a revenda não permite lucro pro vendedor.</p>
          <p>
            Você comprou por {formatBRL(tk.valor)}, então pode revender por até {formatBRL(tk.valor)}.
          </p>
          <p>Taxas e diferenças cobradas do comprador seguem as regras da plataforma.</p>
        </>
      ),
    },
    {
      title: "Até quando posso revender?",
      content: (
        <>
          <p>Até 2 horas antes do início do evento.</p>
          <p>Depois disso o ingresso não pode mais ser anunciado.</p>
        </>
      ),
    },
    {
      title: "Posso cancelar a revenda?",
      content: (
        <>
          <p>Sim. Enquanto não vender, você pode remover o anúncio.</p>
          <p>Ao remover, o QR Code volta a ficar ativo.</p>
        </>
      ),
    },
    {
      title: "Importante",
      content: (
        <>
          <p>Não venda seu ingresso por fora.</p>
          <p>A revenda oficial evita golpe, duplicidade e problema na entrada.</p>
          <p>Depois que vender, a venda não pode ser desfeita.</p>
        </>
      ),
    },
  ];

  return (
    <Dialog open={open} onOpenChange={(v) => !submitting && onOpenChange(v)}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>{step === "form" ? "Colocar para revenda" : "Confirmar revenda?"}</DialogTitle>
          <DialogDescription>{step === "form" ? "Venda seu ingresso com segurança pela Nokta." : "Revise antes de anunciar."}</DialogDescription>
        </DialogHeader>

        <DialogBody>
          {step === "form" ? (
            <>
              {loadingPreview ? (
                <div className="space-y-3">
                  <div className="skeleton-shimmer h-20 w-full rounded-card" />
                  <div className="skeleton-shimmer h-24 w-full rounded-card" />
                </div>
              ) : preview && !preview.activated ? (
                <Callout tone="neutral" title="Revenda ainda não liberada">
                  {preview.reason === "TOO_EARLY" ? "Ela abre automaticamente quando faltarem 15 dias pro evento ou quando 60% dos ingressos forem vendidos." : "Ela abre quando 60% dos ingressos forem vendidos — ou automaticamente 15 dias antes do evento."}
                </Callout>
              ) : preview && !preview.canAdd ? (
                <Callout tone="warning" title="Limite atingido">
                  Você atingiu o limite de alterações de revenda para este ingresso.
                </Callout>
              ) : preview ? (
                <>
                  <Callout tone="info" title="Revenda oficial da Nokta">
                    Seu ingresso é anunciado pra outros compradores dentro da plataforma. Enquanto estiver anunciado, o QR Code fica suspenso pra evitar uso duplicado.
                  </Callout>
                  <div className="divide-y divide-border overflow-hidden rounded-xl border border-border">
                    <div className="flex items-center justify-between px-4 py-3.5">
                      <span className="text-sm text-muted-foreground">Você recebe</span>
                      <span className="tnum text-base font-semibold text-money-in">{formatBRL(preview.sellerAmount)}</span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3.5">
                      <span className="text-sm text-muted-foreground">Preço final pro comprador</span>
                      <span className="tnum text-base font-semibold text-foreground">{formatBRL(preview.buyerPrice)}</span>
                    </div>
                    <p className="bg-surface-2 px-4 py-2.5 text-caption text-muted-foreground">Você recebe exatamente o valor pago originalmente. Todas as taxas são do novo comprador.</p>
                  </div>
                </>
              ) : null}

              <Faq items={faq} />
            </>
          ) : (
            <>
              <p className="text-body text-muted-foreground">Você está colocando este ingresso na revenda oficial:</p>
              <div className="surface-inset rounded-xl p-4">
                <p className="text-[15px] font-semibold text-foreground">{item.event?.nome ?? "Evento"}</p>
                <p className="text-caption text-muted-foreground">
                  {tk.nome} · {TIPO_LABELS[tk.tipo] ?? "Ingresso"} · Lote {tk.lote}
                </p>
                <dl className="mt-3 space-y-2 border-t border-border pt-3">
                  <div className="flex items-center justify-between">
                    <dt className="text-caption text-muted-foreground">Você recebe</dt>
                    <dd className="tnum text-base font-semibold text-money-in">{preview ? formatBRL(preview.sellerAmount) : "—"}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-caption text-muted-foreground">Preço pro comprador</dt>
                    <dd className="tnum text-sm font-semibold text-foreground">{preview ? formatBRL(preview.buyerPrice) : "—"}</dd>
                  </div>
                </dl>
              </div>
              <Callout tone="warning" title="Ao confirmar">
                <ul className="list-disc space-y-1 pl-4">
                  <li>Seu QR Code fica suspenso enquanto o ingresso estiver anunciado.</li>
                  <li>Você não pode usar o ingresso enquanto ele estiver na revenda.</li>
                  <li>Se vendido, ele vai automaticamente pro comprador.</li>
                  <li>Você recebe conforme as regras da plataforma.</li>
                  <li>Enquanto não vender, você pode remover da revenda.</li>
                </ul>
              </Callout>
            </>
          )}
        </DialogBody>

        <DialogFooter>
          {step === "form" ? (
            <>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button disabled={loadingPreview || !available} onClick={() => setStep("confirm")} rightIcon="arrow-right">
                Continuar
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => setStep("form")} disabled={submitting}>
                Voltar
              </Button>
              <Button onClick={submit} loading={submitting} leftIcon={submitting ? undefined : "repeat"}>
                {submitting ? "Anunciando…" : "Confirmar revenda"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
