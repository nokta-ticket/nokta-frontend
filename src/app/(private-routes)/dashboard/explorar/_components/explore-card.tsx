"use client";

import { useState } from "react";
import { Lightbulb, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ExploreCard as ExploreCardData } from "@/services/platform";
import { canActivateCard, canDeactivateCard, capabilityStatusBadge } from "../_lib/capability-display";
import { DeactivateCapabilityDialog } from "./deactivate-capability-dialog";

const BADGE_CLASS: Record<string, string> = {
  active: "border-emerald-200 bg-emerald-50 text-emerald-700",
  available: "border-black/10 bg-black/5 text-black/70",
  locked: "border-black/10 bg-black/5 text-black/40",
};

export function ExploreCard({
  card,
  recommendationReason,
  onActivate,
  onDeactivate,
  activating,
  deactivating,
}: {
  card: ExploreCardData;
  recommendationReason: string | null;
  onActivate: () => void;
  onDeactivate: () => void;
  activating: boolean;
  deactivating: boolean;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const badge = capabilityStatusBadge(card.status);
  const canActivate = canActivateCard(card);
  const canDeactivate = canDeactivateCard(card);
  const missingDeps = card.requirements.filter((r) => !r.active);

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">{card.name}</CardTitle>
          <Badge variant="outline" className={BADGE_CLASS[badge.tone]}>
            {badge.label}
          </Badge>
        </div>
        <CardDescription>{card.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-sm text-black/70">{card.problemSolved}</p>

        {recommendationReason ? (
          <div className="flex items-start gap-2 rounded-lg border border-violet-200 bg-violet-50 p-2.5 text-xs text-violet-800">
            <Lightbulb size={14} className="mt-0.5 shrink-0" />
            <span>{recommendationReason}</span>
          </div>
        ) : null}

        {missingDeps.length > 0 ? (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-800">
            <Lock size={14} className="mt-0.5 shrink-0" />
            <span>Ative primeiro: {missingDeps.map((d) => d.label).join(", ")}.</span>
          </div>
        ) : null}

        <div className="mt-auto flex items-center justify-between pt-1">
          {card.isActive ? (
            <span className="text-xs text-black/50">Já faz parte da sua operação</span>
          ) : (
            <span />
          )}

          {canDeactivate ? (
            <Button variant="outline" size="sm" onClick={() => setConfirmOpen(true)} disabled={deactivating}>
              Desativar
            </Button>
          ) : canActivate ? (
            <Button size="sm" onClick={onActivate} disabled={activating}>
              {activating ? "Ativando…" : "Ativar"}
            </Button>
          ) : card.status === "LOCKED_FUTURE" || card.status === "COMING_SOON" ? (
            <span className="text-xs text-black/40">Ainda não disponível</span>
          ) : null}
        </div>
      </CardContent>

      <DeactivateCapabilityDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        capabilityName={card.name}
        onConfirm={() => {
          setConfirmOpen(false);
          onDeactivate();
        }}
      />
    </Card>
  );
}
