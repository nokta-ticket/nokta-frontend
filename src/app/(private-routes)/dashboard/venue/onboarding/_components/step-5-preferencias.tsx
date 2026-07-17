"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OperacaoTab } from "../../../configuracoes/_components/operacao-tab";

export function Step5Preferencias({ orgId, onNext, onBack }: { orgId: number; onNext: () => void; onBack: () => void }) {
  return (
    <div className="space-y-4">
      <OperacaoTab orgId={orgId} canManage />

      <Card>
        <CardHeader>
          <CardTitle>Horários de funcionamento</CardTitle>
          <CardDescription>Ajude o Insights a calcular ocupação corretamente.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" asChild>
            <Link href="/dashboard/configuracoes?tab=horarios">Definir horários</Link>
          </Button>
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
