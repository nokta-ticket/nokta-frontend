"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api, { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { useAuth } from "@/context/AuthContext";
import { formatDateBR, initials } from "@/lib/format";
import { resolveMediaUrl } from "@/lib/media";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

interface EnderecoData {
  cep?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  uf?: string | null;
  complemento?: string | null;
}

interface UserMe {
  nome: string;
  sobrenome: string;
  email: string;
  telefone?: string | null;
  telefoneVerificado?: boolean | null;
  createdAt?: string;
  fotoPerfil?: string | null;
  endereco?: EnderecoData | null;
}

function formatPhone(raw: string): string {
  const d = raw.replace(/\D/g, "").replace(/^55(?=\d{10,11}$)/, "");
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7, 11)}`;
}

function formatCep(v: string) {
  const c = v.replace(/\D/g, "").slice(0, 8);
  return c.length > 5 ? `${c.slice(0, 5)}-${c.slice(5)}` : c;
}

function InfoRow({ label, value, extra }: { label: string; value?: string | null; extra?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <div className="min-w-0">
        <p className="text-micro uppercase tracking-wider text-subtle-foreground">{label}</p>
        <p className="truncate text-sm font-medium text-foreground">{value || <span className="font-normal text-subtle-foreground">Não informado</span>}</p>
      </div>
      {extra}
    </div>
  );
}

export default function PerfilPage() {
  const router = useRouter();
  const { signOut } = useAuth();
  const [user, setUser] = useState<UserMe | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Dados editáveis
  const [nome, setNome] = useState("");
  const [sobrenome, setSobrenome] = useState("");
  const [endCep, setEndCep] = useState("");
  const [endRua, setEndRua] = useState("");
  const [endNumero, setEndNumero] = useState("");
  const [endBairro, setEndBairro] = useState("");
  const [endCidade, setEndCidade] = useState("");
  const [endUf, setEndUf] = useState("");
  const [endComplemento, setEndComplemento] = useState("");

  useEffect(() => {
    api
      .get("/auth/me")
      .then((res) => {
        const d = res.data as UserMe;
        setUser(d);
        setNome(d.nome ?? "");
        setSobrenome(d.sobrenome ?? "");
        const e = d.endereco;
        if (e) {
          setEndCep(e.cep ? formatCep(e.cep) : "");
          setEndRua(e.logradouro ?? "");
          setEndNumero(e.numero ?? "");
          setEndBairro(e.bairro ?? "");
          setEndCidade(e.cidade ?? "");
          setEndUf(e.uf ?? "");
          setEndComplemento(e.complemento ?? "");
        }
      })
      .catch((err) => toast.error(getErrorMessage(err, "Erro ao carregar perfil")))
      .finally(() => setLoading(false));
  }, []);

  const buscarCep = async (raw: string) => {
    const cep = raw.replace(/\D/g, "");
    if (cep.length !== 8) return;
    try {
      const r = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const d = await r.json();
      if (!d.erro) {
        setEndRua(d.logradouro ?? "");
        setEndBairro(d.bairro ?? "");
        setEndCidade(d.localidade ?? "");
        setEndUf(d.uf ?? "");
      }
    } catch {}
  };

  const handleSave = async () => {
    if (!nome.trim()) {
      toast.error("O nome é obrigatório.");
      return;
    }
    setSaving(true);
    try {
      await api.put("/auth/me", {
        nome: nome.trim(),
        sobrenome: sobrenome.trim(),
        endereco: {
          cep: endCep.replace(/\D/g, ""),
          logradouro: endRua,
          numero: endNumero,
          bairro: endBairro,
          cidade: endCidade,
          uf: endUf,
          complemento: endComplemento,
        },
      });
      toast.success("Perfil atualizado!");
    } catch (err) {
      toast.error(getErrorMessage(err, "Erro ao salvar."));
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = () => {
    signOut();
    router.push("/");
  };

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-2xl space-y-4 px-4 pb-28 pt-4 lg:px-6 lg:pt-8">
        <Skeleton className="h-9 w-48 rounded-lg" />
        <Skeleton className="h-28 w-full rounded-card" />
        <Skeleton className="h-44 w-full rounded-card" />
        <Skeleton className="h-40 w-full rounded-card" />
      </div>
    );
  }

  if (!user) return null;

  const nomeCompleto = [user.nome, user.sobrenome].filter(Boolean).join(" ");
  const fotoSrc = resolveMediaUrl(user.fotoPerfil, null);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-28 pt-4 lg:px-6 lg:pt-8">
      <h1 className="text-display font-medium tracking-tight text-foreground">Meu perfil</h1>

      <div className="mt-5 space-y-4">
        {/* avatar */}
        <Card accent>
          <CardContent className="flex items-center gap-4">
            <div className="relative shrink-0">
              <span className="flex size-20 items-center justify-center overflow-hidden rounded-full bg-surface-3 text-title font-semibold text-foreground ring-2 ring-brand/40">
                {fotoSrc ? <Image src={fotoSrc} alt="" width={80} height={80} className="size-full object-cover" unoptimized /> : initials(user.nome, user.sobrenome)}
              </span>
              <Link href="/perfil/editar" aria-label="Trocar foto" className="btn-lift absolute -bottom-1 -right-1 flex size-8 items-center justify-center rounded-full bg-brand text-brand-foreground">
                <Icon name="camera" size={13} />
              </Link>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-lg font-semibold text-foreground">{nomeCompleto}</p>
              <p className="truncate text-body text-muted-foreground">{user.email}</p>
              <Button asChild variant="outline" size="sm" shape="pill" leftIcon="camera" className="mt-2.5">
                <Link href="/perfil/editar">Trocar foto</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* conta */}
        <Card>
          <CardHeader>
            <CardTitle>Conta</CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-border pt-1">
            <InfoRow label="E-mail" value={user.email} />
            <InfoRow label="Telefone" value={user.telefone ? formatPhone(user.telefone) : null} extra={user.telefone ? <StatusBadge tone={user.telefoneVerificado ? "success" : "warning"}>{user.telefoneVerificado ? "Verificado" : "Não verificado"}</StatusBadge> : undefined} />
            <InfoRow label="Membro desde" value={user.createdAt ? formatDateBR(user.createdAt) : null} />
          </CardContent>
        </Card>

        {/* dados pessoais */}
        <Card>
          <CardHeader>
            <CardTitle>Dados pessoais</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <FieldGroup columns={2}>
              <Field label="Nome" htmlFor="perfil-nome" required>
                <Input id="perfil-nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome" autoComplete="given-name" />
              </Field>
              <Field label="Sobrenome" htmlFor="perfil-sobrenome">
                <Input id="perfil-sobrenome" value={sobrenome} onChange={(e) => setSobrenome(e.target.value)} placeholder="Sobrenome" autoComplete="family-name" />
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>

        {/* endereço */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Endereço</CardTitle>
              <CardDescription>Digite o CEP e a gente preenche o resto.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="grid grid-cols-[1fr_minmax(0,7rem)] gap-4">
              <Field label="CEP" htmlFor="perfil-cep">
                <Input
                  id="perfil-cep"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  value={endCep}
                  onChange={(e) => {
                    const v = formatCep(e.target.value);
                    setEndCep(v);
                    buscarCep(v);
                  }}
                  maxLength={9}
                  placeholder="00000-000"
                />
              </Field>
              <Field label="Número" htmlFor="perfil-numero">
                <Input id="perfil-numero" value={endNumero} onChange={(e) => setEndNumero(e.target.value)} placeholder="Nº" />
              </Field>
            </div>
            <Field label="Rua" htmlFor="perfil-rua">
              <Input id="perfil-rua" value={endRua} onChange={(e) => setEndRua(e.target.value)} placeholder="Logradouro" autoComplete="address-line1" />
            </Field>
            <Field label="Bairro" htmlFor="perfil-bairro">
              <Input id="perfil-bairro" value={endBairro} onChange={(e) => setEndBairro(e.target.value)} placeholder="Bairro" />
            </Field>
            <div className="grid grid-cols-[1fr_minmax(0,5rem)] gap-4">
              <Field label="Cidade" htmlFor="perfil-cidade">
                <Input id="perfil-cidade" value={endCidade} onChange={(e) => setEndCidade(e.target.value)} placeholder="Cidade" autoComplete="address-level2" />
              </Field>
              <Field label="UF" htmlFor="perfil-uf">
                <Input id="perfil-uf" value={endUf} onChange={(e) => setEndUf(e.target.value.toUpperCase())} maxLength={2} placeholder="UF" className="uppercase" autoComplete="address-level1" />
              </Field>
            </div>
            <Field label="Complemento" htmlFor="perfil-complemento" optional>
              <Input id="perfil-complemento" value={endComplemento} onChange={(e) => setEndComplemento(e.target.value)} placeholder="Apto, bloco…" autoComplete="address-line2" />
            </Field>
          </CardContent>
        </Card>

        <Button size="full" leftIcon={saving ? undefined : "check"} loading={saving} onClick={handleSave}>
          {saving ? "Salvando…" : "Salvar alterações"}
        </Button>

        {/* segurança */}
        <Card>
          <CardHeader>
            <CardTitle>Segurança</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-3">
            <Button variant="secondary" size="full" leftIcon="key" className="justify-start" onClick={() => toast.info("Em construção")}>
              Alterar senha
            </Button>
            <Button variant="secondary" size="full" leftIcon="logout" className="justify-start" onClick={handleSignOut}>
              Sair da conta
            </Button>
            <Button variant="destructive-soft" size="full" leftIcon="trash" className="justify-start" onClick={() => toast.info("Em construção")}>
              Excluir conta
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
