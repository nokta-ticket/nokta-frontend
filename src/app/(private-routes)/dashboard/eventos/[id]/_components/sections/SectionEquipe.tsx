"use client";

import { useCallback, useEffect, useState } from "react";
import api, { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { initials } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { RowsSkeleton } from "@/components/ui/skeleton";
import { SectionCard } from "../section-ui";
import type { SectionProps } from "../types";

interface Operator {
  id: number;
  userId: number;
  nome: string;
  email: string;
  adicionadoEm: string;
}

export default function SectionEquipe({ event }: SectionProps) {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<Operator | null>(null);

  const fetchOperators = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/produtor/eventos/${event.id}/equipe`);
      setOperators(data.data);
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível carregar a equipe."));
    } finally {
      setLoading(false);
    }
  }, [event.id]);

  useEffect(() => {
    void fetchOperators();
  }, [fetchOperators]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setAddLoading(true);
    try {
      await api.post(`/produtor/eventos/${event.id}/equipe`, { email: email.trim() });
      toast.success("Membro adicionado à equipe");
      setAddOpen(false);
      setEmail("");
      void fetchOperators();
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível adicionar."));
    } finally {
      setAddLoading(false);
    }
  }

  async function handleRemove() {
    if (!removeTarget) return;
    try {
      await api.delete(`/produtor/eventos/${event.id}/equipe/${removeTarget.id}`);
      toast.success("Membro removido da equipe");
      void fetchOperators();
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível remover."));
      throw err;
    }
  }

  return (
    <div className="max-w-3xl">
      <SectionCard
        title="Equipe do evento"
        description="Quem valida ingressos (lê QR code) na portaria no dia."
        action={
          <Button leftIcon="user-plus" size="sm" onClick={() => { setEmail(""); setAddOpen(true); }}>
            Adicionar
          </Button>
        }
        contentClassName="py-3"
      >
        {loading ? (
          <RowsSkeleton rows={3} />
        ) : operators.length === 0 ? (
          <EmptyState compact icon="users" title="Ninguém na equipe ainda" description="Adicione pessoas pra ajudar na validação de ingressos." action={<Button leftIcon="user-plus" onClick={() => setAddOpen(true)}>Adicionar membro</Button>} />
        ) : (
          <ul className="divide-y divide-border">
            {operators.map((op, i) => (
              <li key={op.id} className="row-in flex items-center gap-3 py-3" style={{ ["--i" as string]: i } as never}>
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-soft text-caption font-semibold text-brand">{initials(op.nome.split(" ")[0], op.nome.split(" ").slice(1).join(" "))}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{op.nome}</p>
                  <p className="truncate text-caption text-muted-foreground">{op.email}</p>
                </div>
                <Button variant="subtle" size="icon-sm" aria-label={`Remover ${op.nome}`} title="Remover da equipe" className="hover:bg-danger-bg hover:text-danger" onClick={() => setRemoveTarget(op)}>
                  <Icon name="trash" size={13} />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent size="sm">
          <form onSubmit={handleAdd} className="contents">
            <DialogHeader>
              <DialogTitle>Adicionar à equipe</DialogTitle>
              <DialogDescription>A pessoa precisa ter uma conta ativa na Nokta com esse e-mail.</DialogDescription>
            </DialogHeader>
            <DialogBody>
              <Field label="E-mail" htmlFor="equipe-email">
                <Input id="equipe-email" type="email" leftIcon="mail" placeholder="nome@exemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus required />
              </Field>
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setAddOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" loading={addLoading} disabled={!email.trim()}>
                Adicionar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={removeTarget !== null} onOpenChange={(o) => (!o ? setRemoveTarget(null) : null)} danger icon="user" title={`Remover ${removeTarget?.nome}?`} description="Essa pessoa não vai mais conseguir validar ingressos deste evento." confirmLabel="Remover" onConfirm={handleRemove} />
    </div>
  );
}
