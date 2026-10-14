"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { ErrorState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import api, { getErrorMessage } from "@/lib/axios";
import { USER_ROLE_META, accountStatusMeta, metaOf } from "../../_lib/status-meta";
import { formatDate, fullName } from "../../_lib/format";
import type { AdminUser } from "./_components/types";
import TabDadosGerais from "./_components/tab-dados-gerais";
import TabIngressos from "./_components/tab-ingressos";
import TabCompras from "./_components/tab-compras";
import TabAuditoria from "./_components/tab-auditoria";
import TabSeguranca from "./_components/tab-seguranca";

export default function UsuarioDetalhesPage() {
  const { id } = useParams<{ id: string }>();
  const [usuario, setUsuario] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<AdminUser>(`/admin/usuarios/${id}`);
      setUsuario(res.data);
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível carregar o usuário."));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchUser();
  }, [fetchUser]);

  const userId = Number(id) || 0;

  if (loading && !usuario) {
    return (
      <div className="space-y-6">
        <div className="flex items-start gap-3">
          <Skeleton className="size-9 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-4 w-72" />
          </div>
        </div>
        <Skeleton className="h-10 w-full max-w-lg" />
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <Skeleton className="h-72 rounded-card" />
          <Skeleton className="h-56 rounded-card" />
        </div>
      </div>
    );
  }

  if (error || !usuario) {
    return (
      <div className="space-y-6">
        <PageHeader back="/admin/usuarios" title="Usuário" />
        <ErrorState title="Não deu pra carregar o usuário" description={error ?? "Usuário não encontrado."} onRetry={() => void fetchUser()} />
      </div>
    );
  }

  const role = metaOf(USER_ROLE_META, usuario.role);
  const status = accountStatusMeta(usuario.ativo, usuario.bloqueado);

  return (
    <div className="space-y-6">
      <PageHeader
        back="/admin/usuarios"
        title={fullName(usuario.nome, usuario.sobrenome)}
        badge={
          <>
            <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
            <StatusBadge tone={role.tone} dot={false}>
              {role.label}
              {usuario.nivelProdutor != null ? ` · N${usuario.nivelProdutor}` : ""}
            </StatusBadge>
          </>
        }
        meta={
          <>
            <span className="inline-flex items-center gap-1.5 break-all">
              <Icon name="mail" size={11} />
              {usuario.email}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Icon name="hashtag" size={11} />
              {usuario.id}
            </span>
            {usuario.createdAt ? (
              <span className="inline-flex items-center gap-1.5">
                <Icon name="calendar" size={11} />
                Cadastro em {formatDate(usuario.createdAt)}
              </span>
            ) : null}
          </>
        }
      />

      <Tabs defaultValue="dados-gerais">
        <TabsList variant="line">
          <TabsTrigger value="dados-gerais">Dados gerais</TabsTrigger>
          <TabsTrigger value="ingressos">Ingressos</TabsTrigger>
          <TabsTrigger value="compras">Compras</TabsTrigger>
          <TabsTrigger value="auditoria">Auditoria</TabsTrigger>
          <TabsTrigger value="seguranca">Segurança</TabsTrigger>
        </TabsList>

        <TabsContent value="dados-gerais">
          <TabDadosGerais user={usuario} onRefresh={fetchUser} />
        </TabsContent>
        <TabsContent value="ingressos">
          <TabIngressos userId={userId} />
        </TabsContent>
        <TabsContent value="compras">
          <TabCompras userId={userId} />
        </TabsContent>
        <TabsContent value="auditoria">
          <TabAuditoria userId={userId} />
        </TabsContent>
        <TabsContent value="seguranca">
          <TabSeguranca userId={userId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
