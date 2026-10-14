"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Callout } from "@/components/ui/callout";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { BooleanValue, DetailGrid, DetailItem } from "@/components/ui/detail-list";
import { ErrorState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/cn";
import api, { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { useStaffRole } from "../../../_lib/staff-role";

interface SecurityData {
  emailVerificado: boolean;
  telefoneVerificado: boolean;
  bloqueado: boolean;
  bloqueadoMotivo: string | null;
  totpEnabled: boolean;
  ultimoIp: string | null;
  falhasRecentes: number;
}

export default function TabSeguranca({ userId }: { userId: number }) {
  const { isSupport } = useStaffRole();
  const [data, setData] = useState<SecurityData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sessionOpen, setSessionOpen] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await api.get<SecurityData>(`/admin/usuarios/${userId}/seguranca`);
      setData(res.data);
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível carregar os dados de segurança."));
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleInvalidateSessions() {
    try {
      await api.post(`/admin/usuarios/${userId}/invalidar-sessoes`);
      toast.success("Sessões invalidadas");
      void load();
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível invalidar as sessões."));
    }
  }

  if (error) return <ErrorState title="Não deu pra carregar a segurança" description={error} onRetry={() => void load()} />;
  if (!data) return <Skeleton className="h-64 rounded-card" />;

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Verificações e acesso</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <DetailGrid columns={3}>
            <DetailItem label="E-mail verificado" icon="mail">
              <BooleanValue value={data.emailVerificado} />
            </DetailItem>
            <DetailItem label="Telefone verificado" icon="phone">
              <BooleanValue value={data.telefoneVerificado} />
            </DetailItem>
            <DetailItem label="2FA ativo" icon="shield">
              <BooleanValue value={data.totpEnabled} />
            </DetailItem>
            <DetailItem label="Conta bloqueada" icon="lock">
              <BooleanValue value={data.bloqueado} invert />
            </DetailItem>
            <DetailItem label="Último IP" icon="globe" mono value={data.ultimoIp} />
            <DetailItem label="Falhas recentes de login" icon="warning">
              <span className={cn("tnum", data.falhasRecentes > 0 ? "text-danger" : "text-success")}>{data.falhasRecentes}</span>
            </DetailItem>
          </DetailGrid>
          {data.bloqueado && data.bloqueadoMotivo ? (
            <Callout tone="danger" title="Motivo do bloqueio" className="mt-4">
              {data.bloqueadoMotivo}
            </Callout>
          ) : null}
        </CardContent>
      </Card>

      {!isSupport ? (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Sessões</CardTitle>
              <CardDescription>Encerra todos os logins ativos deste usuário.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <Button variant="outline" leftIcon="logout" onClick={() => setSessionOpen(true)}>
              Invalidar todas as sessões
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <ConfirmDialog open={sessionOpen} onOpenChange={setSessionOpen} title="Invalidar todas as sessões" description="Todas as sessões ativas deste usuário são encerradas agora. Ele precisa entrar de novo." confirmLabel="Invalidar" icon="logout" onConfirm={handleInvalidateSessions} />
    </div>
  );
}
