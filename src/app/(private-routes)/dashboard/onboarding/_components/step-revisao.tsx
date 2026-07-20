"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Compass } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { useBusinessProfile, useCapabilities, useSaveBusinessProfile } from "../../_hooks/use-platform";
import { BlockSkeleton } from "../../_components/states/loading-state";

export function StepRevisao({ orgId, onBack }: { orgId: number; onBack: () => void }) {
  const { data: capabilities, isLoading } = useCapabilities(orgId);
  const { data: profile } = useBusinessProfile(orgId);
  const saveProfile = useSaveBusinessProfile(orgId);
  const router = useRouter();

  const active = (capabilities ?? []).filter((c) => c.status === "ACTIVE" && c.group !== "CORE");
  const hasTickets = active.some((c) => c.technicalModule === "tickets");
  const hasVenue = active.some((c) => c.technicalModule === "venue");

  const handleFinish = () => {
    saveProfile.mutate(
      { markCompleted: true },
      {
        onSuccess: () => {
          toast.success("Perfil concluído.");
          router.push("/dashboard/explorar");
        },
        onError: (err) => toast.error(getErrorMessage(err, "Não foi possível concluir.")),
      },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revisão</CardTitle>
        <CardDescription>
          {profile?.profileCompletedAt ? "Seu perfil já estava concluído — você pode revisar quando quiser em Configurações." : "Confira o que está ativo e para onde ir a seguir."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {isLoading ? (
          <BlockSkeleton className="h-32" />
        ) : active.length === 0 ? (
          <p className="text-sm text-black/50">Nenhuma funcionalidade ativa ainda — dá para ativar quando quiser em Explore a Nokta.</p>
        ) : (
          <div>
            <p className="mb-2 text-sm font-medium text-black/70">Ativas agora</p>
            <div className="flex flex-wrap gap-2">
              {active.map((c) => (
                <Badge key={c.key} variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                  <CheckCircle2 size={12} /> {c.label}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <p className="text-sm font-medium text-black/70">Próximos passos</p>
          <div className="flex flex-wrap gap-2">
            {hasTickets ? (
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/eventos">Criar primeiro evento</Link>
              </Button>
            ) : null}
            {hasVenue ? (
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/venue/onboarding">Configuração guiada do Venue</Link>
              </Button>
            ) : null}
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/explorar">
                <Compass size={14} /> Explore a Nokta
              </Link>
            </Button>
          </div>
        </div>

        <div className="flex justify-between pt-2">
          <Button variant="outline" onClick={onBack}>
            Voltar
          </Button>
          <Button onClick={handleFinish} disabled={saveProfile.isPending}>
            {saveProfile.isPending ? "Concluindo…" : "Concluir"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
