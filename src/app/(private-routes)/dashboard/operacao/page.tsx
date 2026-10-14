"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateTabDialog } from "./_components/create-tab-dialog";
import { LocationGate, type LocationGateContext } from "./_components/location-gate";
import { LocationSelect } from "./_components/location-select";
import { OperacaoView } from "./_components/operacao-view";
import { TabDetailSheet } from "./_components/tab-detail-sheet";

const TITLE = "Mesas e comandas";

/**
 * Operação é uma tela única (mesas + comandas + balcão, abertas e encerradas
 * hoje). Pedidos, Caixa e Terminais têm páginas próprias no menu lateral.
 */
export default function VenueOperacaoPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <PageHeader title={TITLE} />
          <Skeleton className="h-96 rounded-card" />
        </div>
      }
    >
      <LocationGate title={TITLE}>{(ctx) => <OperacaoPageContent {...ctx} />}</LocationGate>
    </Suspense>
  );
}

function OperacaoPageContent({ orgId, locationId, locations, setLocationId }: LocationGateContext) {
  const searchParams = useSearchParams();
  const [detailTabId, setDetailTabId] = useState<number | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());

  // Relógio dos "há N min" das mesas — avança sozinho, sem depender do polling.
  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  // Deep link vindo de Reservas/Fila ("dar entrada" abre direto a comanda criada).
  useEffect(() => {
    const paramTabId = Number(searchParams.get("tabId"));
    if (paramTabId) setDetailTabId(paramTabId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title={TITLE}
        actions={
          <>
            <LocationSelect locations={locations} value={locationId} onChange={setLocationId} className="w-44" />
            <Button leftIcon="plus" onClick={() => setCreateOpen(true)}>
              Nova comanda
            </Button>
          </>
        }
      />

      <OperacaoView orgId={orgId} locationId={locationId} onOpenTabDetail={setDetailTabId} nowMs={nowMs} />

      <CreateTabDialog orgId={orgId} locationId={locationId} open={createOpen} onOpenChange={setCreateOpen} onCreated={(tab) => setDetailTabId(tab.id)} />

      {detailTabId !== null ? <TabDetailSheet orgId={orgId} locationId={locationId} tabId={detailTabId} open onOpenChange={(v) => !v && setDetailTabId(null)} /> : null}
    </div>
  );
}
