"use client";

import { useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { toast } from "@/lib/toast";
import { getErrorMessage } from "@/lib/axios";
import { venueMenuApi } from "@/services/venue-menu";
import type { VenueSetupStatus } from "@/services/venue-setup";
import { ReadyRow, StepNav } from "./step-nav";

export function Step3Cardapio({ orgId, status, onNext, onBack }: { orgId: number; status: VenueSetupStatus; onNext: () => void; onBack: () => void }) {
  const qc = useQueryClient();
  const [menuNome, setMenuNome] = useState("Cardápio principal");
  const [categoriaNome, setCategoriaNome] = useState("Bebidas");
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState(false);

  const publishedMenu = status.requiredItems.find((i) => i.key === "published_menu")?.done ?? false;
  const activeProduct = status.requiredItems.find((i) => i.key === "active_product")?.done ?? false;

  const handleQuickCreate = async () => {
    if (!menuNome.trim() || !categoriaNome.trim()) {
      toast.error("Informe o nome do cardápio e da categoria.");
      return;
    }
    setCreating(true);
    try {
      const menu = await venueMenuApi.createMenu(orgId, { nome: menuNome.trim(), isMain: true });
      await venueMenuApi.createCategory(orgId, menu.id, { nome: categoriaNome.trim() });
      await venueMenuApi.publishMenu(orgId, menu.id);
      setCreated(true);
      qc.invalidateQueries({ queryKey: ["settings", orgId, "setup-status"] });
      toast.success("Cardápio e categoria criados. Agora cadastre os produtos.");
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível criar o cardápio."));
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Cardápio</CardTitle>
            <CardDescription>O cardápio publicado alimenta a operação e a página pública do estabelecimento.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <ul>
            <ReadyRow done={publishedMenu || created} label="Cardápio publicado" />
            <ReadyRow done={activeProduct} label="Produto ativo com variação válida" hint="Cadastre ao menos um produto com preço no Cardápio." />
          </ul>
        </CardContent>
      </Card>

      {!publishedMenu && !created ? (
        <Card accent>
          <CardHeader>
            <div>
              <CardTitle>Criar cardápio rapidamente</CardTitle>
              <CardDescription>Cria o cardápio principal, já publicado, com a primeira categoria.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <FieldGroup columns={2}>
              <Field label="Nome do cardápio" htmlFor="setup-menu">
                <Input id="setup-menu" value={menuNome} onChange={(e) => setMenuNome(e.target.value)} />
              </Field>
              <Field label="Primeira categoria" htmlFor="setup-categoria">
                <Input id="setup-categoria" value={categoriaNome} onChange={(e) => setCategoriaNome(e.target.value)} placeholder="Bebidas, Drinks, Porções…" />
              </Field>
            </FieldGroup>
            <Button leftIcon="magic" onClick={handleQuickCreate} loading={creating}>
              Criar cardápio e categoria
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Produtos</CardTitle>
            <CardDescription>Produtos, variações (tamanho, dose) e preços são cadastrados na tela de Cardápio.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Button variant="outline" asChild>
            <Link href="/dashboard/cardapio">Ir para o Cardápio</Link>
          </Button>
        </CardContent>
      </Card>

      <StepNav onBack={onBack} onNext={onNext} />
    </div>
  );
}
