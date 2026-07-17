"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VENUE_ROLE_LABEL, type VenueRoleKey } from "@/services/venue-team";

const INVITE_ROLES: VenueRoleKey[] = ["MANAGER", "RECEPTION", "WAITER", "CASHIER", "KITCHEN_BAR", "STOCK"];

export function Step4Equipe({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Convide sua equipe</CardTitle>
          <CardDescription>
            Recomendado, mas não obrigatório — você pode operar sozinho como proprietário e convidar depois.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {INVITE_ROLES.map((role) => (
              <Button key={role} variant="outline" size="sm" asChild>
                <Link href="/dashboard/equipe">Convidar {VENUE_ROLE_LABEL[role]}</Link>
              </Button>
            ))}
          </div>
          <p className="text-xs text-black/40">
            Os convites e a definição de permissões acontecem na página Equipe.
          </p>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack}>
          Voltar
        </Button>
        <Button onClick={onNext}>Continuar</Button>
      </div>
    </div>
  );
}
