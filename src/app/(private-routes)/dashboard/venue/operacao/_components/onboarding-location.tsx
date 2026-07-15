"use client";

import { useState } from "react";
import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { useVenueLocationMutations } from "../_hooks/use-venue-locations";

/** Onboarding: organização sem nenhuma unidade ainda. */
export function OnboardingLocation({ orgId }: { orgId: number }) {
  const { create } = useVenueLocationMutations(orgId);
  const [nome, setNome] = useState("Unidade Principal");

  const handleCreate = () => {
    if (!nome.trim()) {
      toast.error("Informe o nome da unidade.");
      return;
    }
    create.mutate(
      { nome: nome.trim() },
      {
        onSuccess: () => toast.success("Unidade criada! Agora cadastre áreas, mesas e caixa."),
        onError: (err) => toast.error(getErrorMessage(err, "Não foi possível criar a unidade.")),
      },
    );
  };

  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border px-6 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-violet-100">
        <Building2 className="h-8 w-8 text-violet-600" />
      </div>
      <div className="space-y-1">
        <p className="text-lg font-semibold">Crie sua primeira unidade</p>
        <p className="max-w-md text-sm text-muted-foreground">
          Uma unidade representa o estabelecimento físico (loja, filial). Depois dela você cadastra
          áreas, mesas e caixas.
        </p>
      </div>
      <div className="flex w-full max-w-xs flex-col gap-3 pt-2">
        <div className="space-y-2 text-left">
          <Label htmlFor="onboarding-nome">Nome da unidade</Label>
          <Input id="onboarding-nome" value={nome} onChange={(e) => setNome(e.target.value)} />
        </div>
        <Button disabled={create.isPending} onClick={handleCreate}>
          {create.isPending ? "Criando…" : "Criar unidade"}
        </Button>
      </div>
    </div>
  );
}
