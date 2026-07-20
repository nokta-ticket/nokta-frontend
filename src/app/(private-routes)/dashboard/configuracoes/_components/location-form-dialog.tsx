"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/lib/toast";
import { getErrorMessage } from "@/lib/axios";
import type { VenueLocation, CreateVenueLocationPayload } from "@/services/venue-operation";
import { useVenueLocationMutations } from "../../operacao/_hooks/use-venue-locations";

interface Props {
  orgId: number;
  location: VenueLocation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EMPTY: CreateVenueLocationPayload = {
  nome: "",
  descricao: "",
  endereco: "",
  telefone: "",
  timezone: "America/Sao_Paulo",
  defaultReservationDurationMinutes: 120,
  reservationMinAdvanceMinutes: 0,
  reservationLateToleranceMinutes: undefined,
};

/** Sempre reseta o form ao abrir (nunca mantém dados do registro anterior) e fecha ao salvar com sucesso. */
export function LocationFormDialog({ orgId, location, open, onOpenChange }: Props) {
  const { create, update } = useVenueLocationMutations(orgId);
  const [form, setForm] = useState<CreateVenueLocationPayload>(EMPTY);

  useEffect(() => {
    if (!open) return;
    if (location) {
      setForm({
        nome: location.nome,
        descricao: location.descricao ?? "",
        endereco: location.endereco ?? "",
        telefone: location.telefone ?? "",
        timezone: location.timezone,
        defaultReservationDurationMinutes: location.defaultReservationDurationMinutes,
        reservationMinAdvanceMinutes: location.reservationMinAdvanceMinutes,
        reservationLateToleranceMinutes: location.reservationLateToleranceMinutes ?? undefined,
      });
    } else {
      setForm(EMPTY);
    }
  }, [open, location]);

  const isPending = create.isPending || update.isPending;

  const handleSubmit = () => {
    if (!form.nome?.trim()) {
      toast.error("Informe o nome da unidade.");
      return;
    }
    const payload = { ...form, nome: form.nome.trim() };
    const onSuccess = () => {
      toast.success(location ? "Unidade atualizada." : "Unidade criada.");
      onOpenChange(false);
    };
    const onError = (err: unknown) => toast.error(getErrorMessage(err, "Não foi possível salvar a unidade."));

    if (location) {
      update.mutate({ locationId: location.id, payload }, { onSuccess, onError });
    } else {
      create.mutate(payload, { onSuccess, onError });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{location ? "Editar unidade" : "Nova unidade"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Nome</Label>
            <Input value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Telefone</Label>
              <Input value={form.telefone ?? ""} onChange={(e) => setForm((f) => ({ ...f, telefone: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Timezone</Label>
              <Input value={form.timezone ?? ""} onChange={(e) => setForm((f) => ({ ...f, timezone: e.target.value }))} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Endereço</Label>
            <Input value={form.endereco ?? ""} onChange={(e) => setForm((f) => ({ ...f, endereco: e.target.value }))} />
          </div>

          <div className="space-y-1.5">
            <Label>Descrição</Label>
            <Input value={form.descricao ?? ""} onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Duração padrão da reserva (min)</Label>
              <Input
                type="number"
                min={1}
                value={form.defaultReservationDurationMinutes ?? 120}
                onChange={(e) => setForm((f) => ({ ...f, defaultReservationDurationMinutes: Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Antecedência mínima (min)</Label>
              <Input
                type="number"
                min={0}
                value={form.reservationMinAdvanceMinutes ?? 0}
                onChange={(e) => setForm((f) => ({ ...f, reservationMinAdvanceMinutes: Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Tolerância de atraso (min)</Label>
              <Input
                type="number"
                min={0}
                value={form.reservationLateToleranceMinutes ?? ""}
                placeholder="Opcional"
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    reservationLateToleranceMinutes: e.target.value === "" ? undefined : Number(e.target.value),
                  }))
                }
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Salvando…" : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
