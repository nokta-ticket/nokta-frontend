"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { formatPhone } from "@/lib/br-data";
import type { VenueWaitlistEntry } from "@/services/venue-reservations";
import { useVenueWaitlist, useVenueWaitlistMutations } from "../_hooks/use-venue-waitlist";
import { WaitlistStatusBadge } from "./reservation-status-badge";
import { WaitlistSeatDialog } from "./waitlist-seat-dialog";
import { CancelWithReasonDialog } from "./cancel-with-reason-dialog";
import { EmptyState } from "../../../_components/states/empty-state";
import { TableSkeleton } from "../../../_components/states/loading-state";
import { ErrorState } from "../../../_components/states/error-state";

function minutesSince(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
}

export function FilaTab({ orgId, locationId }: { orgId: number; locationId: number }) {
  const { data, isLoading, isError, refetch } = useVenueWaitlist(orgId, locationId, { status: undefined });
  const { notify, markLeft, cancel } = useVenueWaitlistMutations(orgId, locationId);
  const [seatEntry, setSeatEntry] = useState<VenueWaitlistEntry | null>(null);
  const [cancelEntry, setCancelEntry] = useState<VenueWaitlistEntry | null>(null);

  if (isError) return <ErrorState description="Não foi possível carregar a fila." onRetry={() => refetch()} />;
  if (isLoading) return <TableSkeleton />;

  const entries = data?.data ?? [];
  const active = entries.filter((e) => e.status === "WAITING" || e.status === "NOTIFIED");
  const rest = entries.filter((e) => e.status !== "WAITING" && e.status !== "NOTIFIED");

  if (entries.length === 0) {
    return <EmptyState title="Fila vazia" description="Clientes sem reserva aparecem aqui enquanto aguardam mesa." />;
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {active.map((entry, idx) => (
          <div key={entry.id} className="rounded-xl border border-black/10 bg-white p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-black/40">#{idx + 1}</span>
                  <span className="font-semibold text-gray-900">{entry.publicCode}</span>
                  <WaitlistStatusBadge status={entry.status} />
                </div>
                <p className="mt-1 text-sm text-gray-900">{entry.customerName} · {entry.partySize} pessoa(s)</p>
                <p className="text-xs text-black/50">
                  <a href={`tel:${entry.customerPhone}`} className="text-violet-600 underline">
                    {formatPhone(entry.customerPhone)}
                  </a>
                  {entry.preferredArea ? ` · ${entry.preferredArea.nome}` : ""}
                  {entry.estimatedWaitMinutes ? ` · previsão ${entry.estimatedWaitMinutes} min` : ""}
                </p>
                <p className="text-xs text-black/40">Aguardando há {minutesSince(entry.createdAt)} min</p>
                {entry.notes ? <p className="mt-1 text-xs italic text-black/40">{entry.notes}</p> : null}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {entry.status === "WAITING" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={notify.isPending}
                    onClick={() =>
                      notify.mutate(entry.id, {
                        onSuccess: () => toast.success("Cliente avisado."),
                        onError: (err) => toast.error(getErrorMessage(err, "Não foi possível avisar.")),
                      })
                    }
                  >
                    Avisar cliente
                  </Button>
                ) : null}
                <Button size="sm" onClick={() => setSeatEntry(entry)}>
                  Sentar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={markLeft.isPending}
                  onClick={() =>
                    markLeft.mutate(entry.id, {
                      onSuccess: () => toast.success("Registrado como desistência."),
                      onError: (err) => toast.error(getErrorMessage(err, "Não foi possível registrar.")),
                    })
                  }
                >
                  Cliente desistiu
                </Button>
                <Button size="sm" variant="ghost" className="text-red-600" onClick={() => setCancelEntry(entry)}>
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {rest.length > 0 ? (
        <details className="text-sm text-black/50">
          <summary className="cursor-pointer">Histórico da fila ({rest.length})</summary>
          <div className="mt-2 space-y-1.5">
            {rest.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between rounded-lg border border-black/5 px-3 py-1.5">
                <span>{entry.publicCode} · {entry.customerName}</span>
                <WaitlistStatusBadge status={entry.status} />
              </div>
            ))}
          </div>
        </details>
      ) : null}

      <WaitlistSeatDialog
        orgId={orgId}
        locationId={locationId}
        entry={seatEntry}
        open={seatEntry !== null}
        onOpenChange={(v) => !v && setSeatEntry(null)}
      />
      <CancelWithReasonDialog
        open={cancelEntry !== null}
        onOpenChange={(v) => !v && setCancelEntry(null)}
        title="Cancelar entrada na fila"
        loading={cancel.isPending}
        onConfirm={(reason) =>
          cancelEntry &&
          cancel.mutate(
            { entryId: cancelEntry.id, payload: { reason } },
            {
              onSuccess: () => {
                toast.success("Entrada cancelada.");
                setCancelEntry(null);
              },
              onError: (err) => toast.error(getErrorMessage(err, "Não foi possível cancelar.")),
            },
          )
        }
      />
    </div>
  );
}
