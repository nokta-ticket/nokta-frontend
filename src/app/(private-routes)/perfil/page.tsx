"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, XCircle, Pencil, Lock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import api from "@/lib/axios";
import { toast } from "@/lib/toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333/api";

interface UserMe {
  nome: string;
  sobrenome: string;
  email: string;
  telefone?: string | null;
  telefoneVerificado?: boolean | null;
  createdAt: string;
  fotoPerfil?: string | null;
}

function formatPhone(raw: string): string {
  const d = raw.replace(/\D/g, "");
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7, 11)}`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function getInitials(nome: string, sobrenome: string): string {
  const a = nome?.[0] ?? "";
  const b = sobrenome?.[0] ?? "";
  return (a + b).toUpperCase();
}

function InfoRow({
  label,
  value,
  extra,
}: {
  label: string;
  value?: string | null;
  extra?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0">
      <div className="space-y-0.5">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</p>
        <p className="text-sm font-medium text-gray-800">
          {value || <span className="text-gray-300 italic">Não informado</span>}
        </p>
      </div>
      {extra}
    </div>
  );
}

export default function PerfilPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserMe | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/auth/me")
      .then((res) => setUser(res.data))
      .catch((err: any) => toast.error(err?.message ?? "Erro ao carregar perfil"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    );
  }

  if (!user) return null;

  const initials = getInitials(user.nome, user.sobrenome);
  const nomeCompleto = [user.nome, user.sobrenome].filter(Boolean).join(" ");
  const fotoSrc = user.fotoPerfil ? `${API_URL.replace("/api", "")}/uploads/${user.fotoPerfil}` : null;

  return (
    <div className="max-w-lg mx-auto px-4 py-10 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Meu Perfil</h1>

      {/* Avatar + nome */}
      <div className="flex flex-col items-center gap-3 py-6">
        <Avatar className="h-24 w-24 text-2xl">
          {fotoSrc && <AvatarImage src={fotoSrc} alt={nomeCompleto} className="object-cover" />}
          <AvatarFallback className="bg-violet-100 text-violet-700 font-semibold text-2xl">
            {initials}
          </AvatarFallback>
        </Avatar>
        <p className="text-lg font-semibold text-gray-900">{nomeCompleto}</p>
      </div>

      {/* Info card */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <InfoRow label="E-mail" value={user.email} />
        <InfoRow
          label="Telefone"
          value={user.telefone ? formatPhone(user.telefone) : null}
          extra={
            user.telefone ? (
              user.telefoneVerificado ? (
                <span className="flex items-center gap-1 text-xs font-medium text-green-600">
                  <CheckCircle2 size={14} /> Verificado
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs font-medium text-orange-500">
                  <XCircle size={14} /> Não verificado
                </span>
              )
            ) : undefined
          }
        />
        <InfoRow label="Membro desde" value={formatDate(user.createdAt)} />
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <Button
          className="w-full h-12 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-medium"
          onClick={() => router.push("/perfil/editar")}
        >
          <Pencil size={16} className="mr-2" />
          Editar perfil
        </Button>

        <Button
          variant="outline"
          className="w-full h-12 rounded-xl border-gray-200 text-gray-700 font-medium hover:bg-gray-50"
          onClick={() => router.push("/alterar-senha")}
        >
          <Lock size={16} className="mr-2" />
          Alterar senha
        </Button>

        <Button
          variant="ghost"
          className="w-full h-12 rounded-xl text-red-500 font-medium hover:bg-red-50 hover:text-red-600"
          onClick={() => router.push("/excluir-conta")}
        >
          <Trash2 size={16} className="mr-2" />
          Excluir conta
        </Button>
      </div>
    </div>
  );
}
