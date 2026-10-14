"use client";

import { Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { LocationGate, type LocationGateContext } from "../_components/location-gate";
import { LocationSelect } from "../_components/location-select";
import { TerminaisTab } from "../_components/terminais-tab";

const TITLE = "Terminais";

/** Pareamento do app Nokta POS (maquininhas e tablets) — página própria no menu lateral. */
export default function OperacaoTerminaisPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <PageHeader title={TITLE} />
          <Skeleton className="h-96 rounded-card" />
        </div>
      }
    >
      <LocationGate title={TITLE}>{(ctx) => <TerminaisPageContent {...ctx} />}</LocationGate>
    </Suspense>
  );
}

function TerminaisPageContent({ orgId, locationId, locations, setLocationId }: LocationGateContext) {
  const [formOpen, setFormOpen] = useState(false);
  return (
    <div className="space-y-6">
      <PageHeader
        title={TITLE}
        description="Maquininhas e tablets com o app Nokta POS pareados nesta unidade."
        actions={
          <>
            <LocationSelect locations={locations} value={locationId} onChange={setLocationId} className="w-44" />
            <Button leftIcon="plus" onClick={() => setFormOpen(true)}>
              Novo terminal
            </Button>
          </>
        }
      />
      <TerminaisTab orgId={orgId} locationId={locationId} formOpen={formOpen} onFormOpenChange={setFormOpen} />
    </div>
  );
}
