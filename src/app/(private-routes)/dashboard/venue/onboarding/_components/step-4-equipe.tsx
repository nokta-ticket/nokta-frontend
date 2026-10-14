"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon, type IconName } from "@/components/ui/icon";
import { VENUE_ROLE_LABEL, type VenueRoleKey } from "@/services/venue-team";
import { StepNav } from "./step-nav";

const INVITE_ROLES: { role: VenueRoleKey; icon: IconName; hint: string }[] = [
  { role: "MANAGER", icon: "user-shield", hint: "Vê tudo e configura a casa" },
  { role: "RECEPTION", icon: "calendar-check", hint: "Reservas e fila de espera" },
  { role: "WAITER", icon: "clipboard-list", hint: "Mesas, comandas e pedidos" },
  { role: "CASHIER", icon: "wallet", hint: "Caixa e pagamentos" },
  { role: "KITCHEN_BAR", icon: "fire", hint: "Fila de preparo" },
  { role: "STOCK", icon: "box", hint: "Estoque e compras" },
];

export function Step4Equipe({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Convide sua equipe</CardTitle>
            <CardDescription>Recomendado, não obrigatório — dá pra operar sozinho como proprietário e convidar depois. Convites e permissões ficam na página Equipe.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {INVITE_ROLES.map(({ role, icon, hint }) => (
              <Link key={role} href="/dashboard/equipe" className="press card-hover flex items-center gap-3 rounded-xl border border-border bg-surface-2/50 p-3.5">
                <Icon name={icon} size={16} className="shrink-0 text-brand" />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-foreground">{VENUE_ROLE_LABEL[role]}</span>
                  <span className="block truncate text-caption text-muted-foreground">{hint}</span>
                </span>
                <Icon name="chevron-right" size={11} className="ml-auto shrink-0 text-subtle-foreground" />
              </Link>
            ))}
          </div>
          <Button variant="link" asChild className="mt-4">
            <Link href="/dashboard/equipe">Abrir a página Equipe</Link>
          </Button>
        </CardContent>
      </Card>

      <StepNav onBack={onBack} onNext={onNext} />
    </div>
  );
}
