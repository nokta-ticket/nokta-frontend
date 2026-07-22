"use client";

import { useEffect, useState } from "react";
import { UserPlus, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import api, { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
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
  const [removeLoading, setRemoveLoading] = useState(false);

  async function fetchOperators() {
    setLoading(true);
    try {
      const { data } = await api.get(`/produtor/eventos/${event.id}/equipe`);
      setOperators(data.data);
    } catch (err) {
      toast.error(getErrorMessage(err, "Erro ao carregar equipe."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchOperators();
  }, [event.id]);

  async function handleAdd() {
    if (!email.trim()) return;
    setAddLoading(true);
    try {
      await api.post(`/produtor/eventos/${event.id}/equipe`, { email: email.trim() });
      toast.success("Membro adicionado à equipe!");
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
    setRemoveLoading(true);
    try {
      await api.delete(`/produtor/eventos/${event.id}/equipe/${removeTarget.id}`);
      toast.success("Membro removido da equipe.");
      setRemoveTarget(null);
      void fetchOperators();
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível remover."));
    } finally {
      setRemoveLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Equipe do Evento</h2>
          <p className="text-sm text-muted-foreground">
            Membros da equipe podem validar ingressos (ler QR codes) no dia do evento.
          </p>
        </div>
        <Button
          onClick={() => { setEmail(""); setAddOpen(true); }}
          className="bg-violet-600 text-white hover:bg-violet-700"
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Adicionar membro
        </Button>
      </div>

      <div className="rounded-xl border bg-white shadow-sm">
        {loading ? (
          <p className="py-12 text-center text-muted-foreground">Carregando...</p>
        ) : operators.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12">
            <Users className="h-10 w-10 text-gray-300" />
            <p className="text-sm text-muted-foreground">
              Nenhum membro na equipe ainda. Adicione pessoas para ajudar na validação de ingressos.
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {operators.map((op) => (
              <div key={op.id} className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="font-medium text-sm">{op.nome}</p>
                  <p className="text-xs text-muted-foreground">{op.email}</p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setRemoveTarget(op)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dialog adicionar */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar membro à equipe</DialogTitle>
            <DialogDescription>
              Informe o e-mail da pessoa. Ela precisa ter uma conta ativa na Nokta.
            </DialogDescription>
          </DialogHeader>
          <Input
            type="email"
            placeholder="email@exemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancelar</Button>
            <Button
              onClick={handleAdd}
              disabled={addLoading || !email.trim()}
              className="bg-violet-600 text-white hover:bg-violet-700"
            >
              {addLoading ? "Adicionando..." : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog remover */}
      <Dialog open={!!removeTarget} onOpenChange={(v) => !v && setRemoveTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover membro</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover <strong>{removeTarget?.nome}</strong> da equipe?
              Esta pessoa não poderá mais validar ingressos deste evento.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveTarget(null)}>Cancelar</Button>
            <Button
              onClick={handleRemove}
              disabled={removeLoading}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {removeLoading ? "Removendo..." : "Remover"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
