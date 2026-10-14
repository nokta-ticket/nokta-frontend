"use client";

import { Suspense } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { LocationGate, type LocationGateContext } from "../_components/location-gate";
import { LocationSelect } from "../_components/location-select";
import { PedidosTab } from "../_components/pedidos-tab";

const TITLE = "Pedidos";

/** Fila de preparo — página própria com item dedicado no menu lateral. */
export default function OperacaoPedidosPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <PageHeader title={TITLE} />
          <Skeleton className="h-96 rounded-card" />
        </div>
      }
    >
      <LocationGate title={TITLE}>{(ctx) => <PedidosPageContent {...ctx} />}</LocationGate>
    </Suspense>
  );
}

function PedidosPageContent({ orgId, locationId, locations, setLocationId }: LocationGateContext) {
  return (
    <div className="space-y-6">
      <PageHeader title={TITLE} description="Fila de preparo de mesas, comandas e balcão." actions={<LocationSelect locations={locations} value={locationId} onChange={setLocationId} className="w-44" />} />
      <PedidosTab orgId={orgId} locationId={locationId} />
    </div>
  );
}
