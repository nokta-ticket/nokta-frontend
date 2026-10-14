"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";

export function SegurancaTab() {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle className="flex items-center gap-2">
            <Icon name="shield" size={16} className="text-brand" />
            Segurança e acesso
          </CardTitle>
          <CardDescription>Membros, papéis, permissões granulares e convites são gerenciados na página Equipe.</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <Button variant="outline" asChild>
          <Link href="/dashboard/equipe">
            <Icon name="users" size={14} />
            Ir para Equipe
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
