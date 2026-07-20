"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Circle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/lib/toast";
import { getErrorMessage } from "@/lib/axios";
import { venueMenuApi } from "@/services/venue-menu";
import type { VenueSetupStatus } from "@/services/venue-setup";

function ReadyRow({ done, label }: { done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {done ? <CheckCircle2 size={16} className="text-emerald-600" /> : <Circle size={16} className="text-black/25" />}
      <span className={done ? "text-black/50 line-through" : "text-black/85"}>{label}</span>
    </div>
  );
}

export function Step3Cardapio({
  orgId,
  status,
  onNext,
  onBack,
}: {
  orgId: number;
  status: VenueSetupStatus;
  onNext: () => void;
  onBack: () => void;
}) {
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
          <CardTitle>Status atual</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5">
          <ReadyRow done={publishedMenu} label="Cardápio publicado" />
          <ReadyRow done={activeProduct} label="Produto ativo com variação válida" />
        </CardContent>
      </Card>

      {!publishedMenu && !created ? (
        <Card>
          <CardHeader>
            <CardTitle>Criar cardápio rapidamente</CardTitle>
            <CardDescription>Cria o cardápio principal, já publicado, com uma primeira categoria.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Nome do cardápio</Label>
                <Input value={menuNome} onChange={(e) => setMenuNome(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Primeira categoria</Label>
                <Input value={categoriaNome} onChange={(e) => setCategoriaNome(e.target.value)} />
              </div>
            </div>
            <Button variant="outline" onClick={handleQuickCreate} disabled={creating}>
              {creating ? "Criando…" : "Criar cardápio e categoria"}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Produtos</CardTitle>
          <CardDescription>Cadastre produtos, variações e preços no Cardápio.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" asChild>
            <Link href="/dashboard/cardapio">Ir para o Cardápio</Link>
          </Button>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack}>
          Voltar
        </Button>
        <Button onClick={onNext}>Continuar</Button>
      </div>
    </div>
  );
}
