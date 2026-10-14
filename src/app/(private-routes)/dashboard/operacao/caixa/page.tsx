"use client";

import { Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { CaixaTab } from "../_components/caixa-tab";
import { LocationGate, type LocationGateContext } from "../_components/location-gate";
import { LocationSelect } from "../_components/location-select";

const TITLE = "Caixa";

/** Página própria (antes era uma aba dentro de Operação) — item dedicado no menu lateral. */
export default function OperacaoCaixaPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <PageHeader title={TITLE} />
          <Skeleton className="h-96 rounded-card" />
        </div>
      }
    >
      <LocationGate title={TITLE}>{(ctx) => <CaixaPageContent {...ctx} />}</LocationGate>
    </Suspense>
  );
}

function CaixaPageContent({ orgId, locationId, locations, setLocationId }: LocationGateContext) {
  const [formOpen, setFormOpen] = useState(false);
  return (
    <div className="space-y-6">
      <PageHeader
        title={TITLE}
        actions={
          <>
            <LocationSelect locations={locations} value={locationId} onChange={setLocationId} className="w-44" />
            <Button variant="outline" leftIcon="plus" onClick={() => setFormOpen(true)}>
              Novo caixa
            </Button>
          </>
        }
      />
      <CaixaTab orgId={orgId} locationId={locationId} formOpen={formOpen} onFormOpenChange={setFormOpen} />
    </div>
  );
}
