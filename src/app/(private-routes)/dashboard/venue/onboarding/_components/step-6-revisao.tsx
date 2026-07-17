"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import { getErrorMessage } from "@/lib/axios";
import type { VenueSetupStatus } from "@/services/venue-setup";
import { VenueReadinessChecklist } from "../../_components/venue-readiness-checklist";
import { useVenueSetupLifecycle } from "../../../configuracoes/_hooks/use-venue-settings";

export function Step6Revisao({ orgId, status, onBack }: { orgId: number; status: VenueSetupStatus; onBack: () => void }) {
  const router = useRouter();
  const { complete } = useVenueSetupLifecycle(orgId);

  const handleComplete = () => {
    complete.mutate(undefined, {
      onSuccess: () => {
        toast.success("Configuração concluída! Seu Venue está pronto para operar.");
        router.push("/dashboard/venue/inicio");
      },
      onError: (err) => toast.error(getErrorMessage(err, "Ainda há itens obrigatórios pendentes.")),
    });
  };

  return (
    <div className="space-y-4">
      <VenueReadinessChecklist status={status} title="Revisão final" />

      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack}>
          Voltar
        </Button>
        <Button onClick={handleComplete} disabled={!status.readyToOperate || complete.isPending}>
          {complete.isPending ? "Concluindo…" : "Concluir configuração"}
        </Button>
      </div>
      {!status.readyToOperate ? (
        <p className="text-right text-xs text-amber-600">Conclua os itens obrigatórios acima para finalizar.</p>
      ) : null}
    </div>
  );
}
