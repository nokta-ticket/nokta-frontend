"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";
import { toast } from "@/lib/toast";
import { getErrorMessage } from "@/lib/axios";
import type { VenueSetupChecklistItem, VenueSetupStatus } from "@/services/venue-setup";
import { useVenueSetupLifecycle } from "../../../configuracoes/_hooks/use-venue-settings";

function ChecklistRow({ item }: { item: VenueSetupChecklistItem }) {
  return (
    <li className="flex items-center justify-between gap-3 py-2.5">
      <span className="flex min-w-0 items-center gap-2.5">
        <Icon name={item.done ? "check-circle" : "circle-outline"} size={15} className={cn("shrink-0", item.done ? "text-success" : "text-subtle-foreground")} />
        <span className={cn("truncate text-sm", item.done ? "text-muted-foreground line-through" : "font-medium text-foreground")}>{item.label}</span>
      </span>
      {!item.done ? (
        <Button variant="outline" size="sm" asChild>
          <Link href={item.route}>Configurar</Link>
        </Button>
      ) : null}
    </li>
  );
}

export function Step6Revisao({ orgId, status, onBack }: { orgId: number; status: VenueSetupStatus; onBack: () => void }) {
  const router = useRouter();
  const { complete } = useVenueSetupLifecycle(orgId);

  const handleComplete = () => {
    complete.mutate(undefined, {
      onSuccess: () => {
        toast.success("Configuração concluída! Seu estabelecimento está pronto pra operar.");
        router.push("/dashboard/inicio");
      },
      onError: (err) => toast.error(getErrorMessage(err, "Ainda há itens obrigatórios pendentes.")),
    });
  };

  return (
    <div className="space-y-4">
      <Card accent={status.readyToOperate}>
        <CardHeader>
          <div>
            <CardTitle className="flex items-center gap-2">
              Revisão final
              <span className="text-sm font-normal text-muted-foreground tnum">{status.progress}%</span>
            </CardTitle>
            <CardDescription>{status.readyToOperate ? "Tudo que é obrigatório está pronto. Os recomendados ajudam a operar melhor." : "Complete os itens obrigatórios pra conseguir vender."}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-valuenow={status.progress} aria-valuemin={0} aria-valuemax={100}>
            <div className="progress-draw h-full rounded-full bg-brand" style={{ width: `${status.progress}%` }} />
          </div>

          <section>
            <h4 className="mb-1 text-caption font-semibold uppercase tracking-[0.08em] text-subtle-foreground">Obrigatórios pra operar</h4>
            <ul className="divide-y divide-border/70">
              {status.requiredItems.map((item) => (
                <ChecklistRow key={item.key} item={item} />
              ))}
            </ul>
          </section>

          {status.recommendedItems.length > 0 ? (
            <section>
              <h4 className="mb-1 text-caption font-semibold uppercase tracking-[0.08em] text-subtle-foreground">Recomendados</h4>
              <ul className="divide-y divide-border/70">
                {status.recommendedItems.map((item) => (
                  <ChecklistRow key={item.key} item={item} />
                ))}
              </ul>
            </section>
          ) : null}
        </CardContent>
      </Card>

      {!status.readyToOperate ? <Callout tone="warning">Conclua os itens obrigatórios acima pra finalizar a configuração.</Callout> : null}

      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" leftIcon="arrow-left" onClick={onBack}>
          Voltar
        </Button>
        <Button size="lg" leftIcon="check-double" onClick={handleComplete} disabled={!status.readyToOperate} loading={complete.isPending}>
          Concluir configuração
        </Button>
      </div>
    </div>
  );
}
