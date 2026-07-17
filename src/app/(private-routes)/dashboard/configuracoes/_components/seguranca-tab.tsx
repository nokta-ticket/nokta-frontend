"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function SegurancaTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Segurança e acesso</CardTitle>
        <CardDescription>
          Membros, papéis, permissões granulares e convites são gerenciados na página Equipe.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="outline" asChild>
          <Link href="/dashboard/equipe">Ir para Equipe</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
