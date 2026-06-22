"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { AxiosError } from "axios";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import api from "@/lib/axios";
import { toast } from "@/lib/toast";

import TabDadosGerais from "./_components/tab-dados-gerais";
import TabIngressos from "./_components/tab-ingressos";
import TabCompras from "./_components/tab-compras";
import TabAuditoria from "./_components/tab-auditoria";
import TabSeguranca from "./_components/tab-seguranca";

function getInitials(nome?: string, sobrenome?: string): string {
  const first = nome?.charAt(0)?.toUpperCase() ?? "";
  const last = sobrenome?.charAt(0)?.toUpperCase() ?? "";
  return first + last || "?";
}

export default function UsuarioDetalhesPage() {
  const { id } = useParams();
  const [usuario, setUsuario] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/admin/usuarios/${id}`);
      setUsuario(res.data);
    } catch (err) {
      if (err instanceof AxiosError) {
        setError(
          err.response?.data?.message ?? "Não foi possível carregar o usuário."
        );
      } else {
        setError("Não foi possível carregar o usuário.");
      }
      toast.error("Erro ao carregar dados do usuário");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchUser();
  }, [fetchUser]);

  const userId = typeof id === "string" ? Number(id) : 0;

  /* ---------- Loading state ---------- */
  if (loading) {
    return (
      <div className="space-y-6">
        {/* Back link skeleton */}
        <Skeleton className="h-5 w-40" />

        {/* Header skeleton */}
        <div className="flex items-center gap-4 rounded-xl border bg-white p-6 shadow-sm">
          <Skeleton className="h-14 w-14 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-36" />
          </div>
        </div>

        {/* Tabs skeleton */}
        <Skeleton className="h-10 w-full max-w-lg" />

        {/* Content skeleton */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  /* ---------- Error state ---------- */
  if (error || !usuario) {
    return (
      <div className="flex flex-col items-center gap-4 py-20">
        <AlertCircle className="h-10 w-10 text-red-500" />
        <p className="text-lg font-semibold text-gray-700">
          {error ?? "Usuário não encontrado."}
        </p>
        <Button variant="outline" onClick={() => void fetchUser()}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  const fullName =
    `${usuario.nome ?? ""} ${usuario.sobrenome ?? ""}`.trim() || "Sem nome";
  const initials = getInitials(usuario.nome, usuario.sobrenome);

  return (
    <div className="space-y-6">
      {/* Voltar */}
      <Link
        href="/admin/usuarios"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-violet-600 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para Usuários
      </Link>

      {/* Header do usuário */}
      <div className="flex flex-col gap-4 rounded-xl border bg-white p-6 shadow-sm sm:flex-row sm:items-center">
        {/* Avatar com iniciais */}
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-violet-100 text-lg font-bold text-violet-700">
          {initials}
        </div>

        <div className="flex-1 space-y-1">
          <h1 className="text-xl font-bold text-gray-900">{fullName}</h1>
          <p className="text-sm text-muted-foreground">{usuario.email}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge
            className={`rounded-full px-3 py-1 text-xs ${
              usuario.ativo
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {usuario.ativo ? "Ativo" : "Inativo"}
          </Badge>
          {usuario.bloqueado && (
            <Badge className="rounded-full bg-red-100 px-3 py-1 text-xs text-red-700">
              Bloqueado
            </Badge>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="dados-gerais">
        <TabsList className="w-full overflow-x-auto">
          <TabsTrigger value="dados-gerais">Dados Gerais</TabsTrigger>
          <TabsTrigger value="ingressos">Ingressos</TabsTrigger>
          <TabsTrigger value="compras">Compras</TabsTrigger>
          <TabsTrigger value="auditoria">Auditoria</TabsTrigger>
          <TabsTrigger value="seguranca">Segurança</TabsTrigger>
        </TabsList>

        <TabsContent value="dados-gerais" className="mt-4">
          <TabDadosGerais user={usuario} onRefresh={fetchUser} />
        </TabsContent>

        <TabsContent value="ingressos" className="mt-4">
          <TabIngressos userId={userId} />
        </TabsContent>

        <TabsContent value="compras" className="mt-4">
          <TabCompras userId={userId} />
        </TabsContent>

        <TabsContent value="auditoria" className="mt-4">
          <TabAuditoria userId={userId} />
        </TabsContent>

        <TabsContent value="seguranca" className="mt-4">
          <TabSeguranca userId={userId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
