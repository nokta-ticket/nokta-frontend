"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OperacaoTab } from "../../../configuracoes/_components/operacao-tab";
import { StepNav } from "./step-nav";

export function Step5Preferencias({ orgId, onNext, onBack }: { orgId: number; onNext: () => void; onBack: () => void }) {
  return (
    <div className="space-y-4">
      <OperacaoTab orgId={orgId} canManage />

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Horários de funcionamento</CardTitle>
            <CardDescription>Aparecem na página pública ("aberto agora") e ajudam o Insights a calcular ocupação.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Button variant="outline" asChild>
            <Link href="/dashboard/configuracoes?tab=horarios">Definir horários</Link>
          </Button>
        </CardContent>
      </Card>

      <StepNav onBack={onBack} onNext={onNext} />
    </div>
  );
}
