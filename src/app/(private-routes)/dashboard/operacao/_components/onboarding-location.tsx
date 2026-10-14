"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { useVenueLocationMutations } from "../_hooks/use-venue-locations";

/** Primeiro acesso: a organização ainda não tem nenhuma unidade. */
export function OnboardingLocation({ orgId }: { orgId: number }) {
  const { create } = useVenueLocationMutations(orgId);
  const [nome, setNome] = useState("Unidade principal");

  const handleCreate = () => {
    if (!nome.trim()) {
      toast.error("Informe o nome da unidade.");
      return;
    }
    create.mutate(
      { nome: nome.trim() },
      {
        onSuccess: () => toast.success("Unidade criada. Agora cadastre áreas, mesas e caixa."),
        onError: (err) => toast.error(getErrorMessage(err, "Não foi possível criar a unidade.")),
      },
    );
  };

  return (
    <Card accent className="mx-auto w-full max-w-lg">
      <CardContent className="flex flex-col items-center gap-5 py-10 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-brand-soft text-brand">
          <Icon name="store" size={22} />
        </div>
        <div className="space-y-1">
          <p className="text-title font-semibold tracking-tight text-foreground">Crie sua primeira unidade</p>
          <p className="max-w-sm text-body text-muted-foreground">A unidade é o estabelecimento físico (loja, filial). Depois dela vêm áreas, mesas e caixas.</p>
        </div>
        <form
          className="flex w-full max-w-xs flex-col gap-3 text-left"
          onSubmit={(e) => {
            e.preventDefault();
            handleCreate();
          }}
        >
          <Field label="Nome da unidade" htmlFor="onboarding-nome">
            <Input id="onboarding-nome" value={nome} onChange={(e) => setNome(e.target.value)} />
          </Field>
          <Button type="submit" size="lg" loading={create.isPending} leftIcon="plus">
            Criar unidade
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
