"use client";

import { useState } from "react";
import { Archive, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import type { VenueFinancialCategoryType } from "@/services/venue-finance";
import { useVenueFinanceCategories, useVenueFinanceCategoryMutations } from "../_hooks/use-venue-finance-categories";
import { ArchivedBadge } from "../../../estoque/_components/stock-status-badge";

function CategoryList({ orgId, type }: { orgId: number; type: VenueFinancialCategoryType }) {
  const { data: categories } = useVenueFinanceCategories(orgId, type);
  const { create, archive } = useVenueFinanceCategoryMutations(orgId);
  const [nome, setNome] = useState("");

  const list = categories ?? [];

  const handleCreate = () => {
    if (!nome.trim()) return;
    create
      .mutateAsync({ nome: nome.trim(), type })
      .then(() => {
        toast.success("Categoria criada.");
        setNome("");
      })
      .catch((err) => toast.error(getErrorMessage(err, "Não foi possível criar a categoria.")));
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder={type === "EXPENSE" ? "Ex.: Aluguel, Energia, Marketing" : "Ex.: Aluguel de espaço, Patrocínio"} />
        <Button size="sm" disabled={create.isPending || !nome.trim()} onClick={handleCreate}>
          <Plus size={16} />
        </Button>
      </div>
      <div className="divide-y divide-black/5 rounded-lg border border-black/10">
        {list.map((c) => (
          <div key={c.id} className="flex items-center gap-2 px-3 py-2 text-sm">
            <span className="min-w-0 flex-1 truncate">{c.nome}</span>
            <ArchivedBadge archived={!!c.archivedAt} />
            {!c.archivedAt ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  archive.mutate(c.id, { onError: (err) => toast.error(getErrorMessage(err, "Não foi possível arquivar.")) })
                }
              >
                <Archive size={14} />
              </Button>
            ) : null}
          </div>
        ))}
        {list.length === 0 ? <p className="px-3 py-4 text-center text-sm text-black/50">Nenhuma categoria ainda.</p> : null}
      </div>
    </div>
  );
}

export function FinancialCategoriesManagerDialog({ orgId, open, onOpenChange }: { orgId: number; open: boolean; onOpenChange: (v: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Categorias financeiras</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="EXPENSE">
          <TabsList className="w-full">
            <TabsTrigger value="EXPENSE" className="flex-1">Despesas</TabsTrigger>
            <TabsTrigger value="OTHER_INCOME" className="flex-1">Outras receitas</TabsTrigger>
          </TabsList>
          <TabsContent value="EXPENSE"><CategoryList orgId={orgId} type="EXPENSE" /></TabsContent>
          <TabsContent value="OTHER_INCOME"><CategoryList orgId={orgId} type="OTHER_INCOME" /></TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
