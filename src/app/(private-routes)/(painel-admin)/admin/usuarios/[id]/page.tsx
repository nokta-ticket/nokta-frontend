"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Cookies from "js-cookie";
import Image from "next/image";
import { toast } from "@/lib/toast";
import { AlertTriangle, Trash2, CreditCard, Mail, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/layout/confirm-dialog";
import { formatarCPF } from "@/lib/formatarCPF";
import api from "@/lib/axios";
import { AxiosError } from "axios";

type Usuario = {
  id: string;
  nome: string;
  sobrenome: string;
  email: string;
  cpf: string;
  ativo: boolean;
  dataNascimento: string;
};

const API = process.env.NEXT_PUBLIC_API_URL!;

export default function UsuarioDetalhesPage() {
  const { id } = useParams();
  const router = useRouter();
  const [usuario, setUsuario] = useState<Usuario>();
  const [loading, setLoading] = useState(true);

  async function getUser(id: string) {
    try {
      const res = await api.get<Usuario>(`/admin/usuarios/${id}`);
      setUsuario(res.data);
    } catch (error) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data.message);
      }
      toast.error("Não foi possível carregar usuário");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (id && typeof id === "string") {
      getUser(id);
    }
  }, [id]);

  const toggleStatus = async () => {
    if (!usuario) return;

    try {
      const res = await api.patch<Usuario>(
        `/admin/usuarios/${usuario.id}/status`,
        { ativo: !usuario.ativo }
      );

      const atualizado: Usuario = res.data;
      setUsuario(atualizado);
      toast.success(
        atualizado.ativo
          ? "Usuário reativado com sucesso"
          : "Usuário desativado com sucesso"
      );
    } catch (err: any) {
      toast.error(err.message || "Falha de rede");
    }
  };

  const excluirUsuario = async () => {
    if (!usuario) return;
    try {
      await api.delete(`/admin/usuarios/${usuario.id}`);

      toast.success("Usuário excluído com sucesso");
      router.push("/admin/usuarios");
    } catch (err: any) {
      toast.error(err.message || "Falha de rede");
    }
  };

  if (loading)
    return (
      <p className="py-20 text-center text-muted-foreground">Carregando…</p>
    );

  if (!usuario)
    return (
      <p className="py-20 text-center text-muted-foreground">
        Usuário não encontrado.
      </p>
    );

  const fullName = `${usuario.nome} ${usuario.sobrenome}`;

  return (
    <div className="mx-auto px-4">
      <h1 className="mb-6 text-2xl font-bold">Dados do Usuário</h1>

      <div className="mb-8 flex flex-col items-center rounded-2xl bg-white p-6 shadow-md">
        <div className="mb-4 h-24 w-24 overflow-hidden rounded-full border-4 border-violet-500">
          <Image src="/user_default.png" alt="Avatar" width={96} height={96} />
        </div>
        <p className="text-lg font-semibold">{fullName}</p>
        <p className="text-sm text-muted-foreground">{usuario.email}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Campo label="Nome" icon={User} value={usuario.nome} />
        <Campo label="Sobrenome" icon={User} value={usuario.sobrenome} />
        <Campo label="Email" icon={Mail} value={usuario.email} />
        <Campo label="CPF" icon={CreditCard} value={formatarCPF(usuario.cpf)} />
        <Campo
          label="Status"
          value={usuario.ativo ? "Ativo" : "Desativado"}
          textClass={usuario.ativo ? "text-emerald-700" : "text-gray-500"}
        />
      </div>

      <div className="mt-10 flex flex-col gap-4 sm:flex-row">
        <ConfirmDialog
          title={usuario.ativo ? "Desativar Usuário" : "Reativar Usuário"}
          description={
            usuario.ativo
              ? "Tem certeza que deseja desativar este usuário? Ele não poderá mais acessar a plataforma."
              : "Deseja reativar o acesso deste usuário?"
          }
          onConfirm={toggleStatus}
          trigger={
            <Button
              variant="outline"
              className={
                usuario.ativo
                  ? "border-yellow-600 text-yellow-600 hover:bg-yellow-50"
                  : "border-emerald-600 text-emerald-600 hover:bg-emerald-50"
              }
            >
              <AlertTriangle className="mr-2 h-4 w-4" />
              {usuario.ativo ? "Desativar Usuário" : "Reativar Usuário"}
            </Button>
          }
        />

        <ConfirmDialog
          title="Excluir Usuário"
          description="Esta ação é irreversível. Deseja realmente excluir este usuário?"
          onConfirm={excluirUsuario}
          trigger={
            <Button variant="destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir Usuário
            </Button>
          }
        />
      </div>
    </div>
  );
}

function Campo({
  label,
  icon: Icon,
  value,
  textClass = "",
}: {
  label: string;
  icon?: any;
  value: string;
  textClass?: string;
}) {
  return (
    <div className="rounded-lg bg-gray-50 p-4 shadow-sm">
      <p className="mb-1 flex items-center text-xs text-muted-foreground">
        {Icon && <Icon className="mr-2 h-4 w-4" />} {label}
      </p>
      <Input value={value} disabled className={`bg-white ${textClass}`} />
    </div>
  );
}
