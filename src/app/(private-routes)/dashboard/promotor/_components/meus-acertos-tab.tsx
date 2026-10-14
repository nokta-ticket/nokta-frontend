"use client";

import { SETTLEMENT_STATUS_LABEL, formatCents } from "@/services/promoters";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/badge";
import { Stepper } from "@/components/ui/stepper";
import { SETTLEMENT_TONE, fmtDay } from "../../promotores/_components/promoter-meta";
import { settlementSteps } from "../../promotores/_components/settlements-tab";
import { useMyPromoterSettlements } from "../_hooks/use-my-promoter";

export function MeusAcertosTab() {
  const { data: settlements, isLoading } = useMyPromoterSettlements(true);

  if (isLoading) {
    return (
      <div className="grid gap-3 lg:grid-cols-2">
        {[0, 1].map((i) => (
          <Skeleton key={i} className="h-40 rounded-card" />
        ))}
      </div>
    );
  }
  if (!settlements || settlements.length === 0) {
    return <EmptyState icon="hand-dollar" title="Nenhum acerto ainda" description="Quando uma organização criar um acerto com sua comissão disponível, ele aparece aqui — você nunca cria, confirma ou marca um acerto como pago." />;
  }

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {settlements.map((s, i) => (
        <Card key={s.id} className="fade-up" style={{ ["--i" as string]: i } as never}>
          <CardHeader>
            <div>
              <CardTitle className="tnum">{formatCents(s.totalCommissionCents)}</CardTitle>
              <CardDescription>
                {fmtDay(s.periodStart)} — {fmtDay(s.periodEnd)}
                {s._count?.entries ? ` · ${s._count.entries} ${s._count.entries === 1 ? "comissão" : "comissões"}` : ""}
              </CardDescription>
            </div>
            <StatusBadge tone={SETTLEMENT_TONE[s.status]}>{SETTLEMENT_STATUS_LABEL[s.status]}</StatusBadge>
          </CardHeader>
          <CardContent className="pt-4">
            <Stepper steps={settlementSteps(s.status, s)} orientation="horizontal" />
            {s.notes ? <p className="mt-2 text-caption text-muted-foreground">{s.notes}</p> : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
