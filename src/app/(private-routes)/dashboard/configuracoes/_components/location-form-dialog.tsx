"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
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
  const { create, update, setCieloMerchantCode } = useVenueLocationMutations(orgId);
  const [form, setForm] = useState<CreateVenueLocationPayload>(EMPTY);
  const [merchantCode, setMerchantCode] = useState("");

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
      setMerchantCode(location.cieloMerchantCode ?? "");
    } else {
      setForm(EMPTY);
      setMerchantCode("");
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
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{location ? "Editar unidade" : "Nova unidade"}</DialogTitle>
          <DialogDescription>{location ? "Dados e preferências de reserva desta unidade." : "Toda operação (mesas, caixa, horários) fica dentro de uma unidade."}</DialogDescription>
        </DialogHeader>

        <DialogBody>
          <form
            id="location-form"
            className="flex flex-col gap-5"
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
          >
            <Field label="Nome" htmlFor="loc-nome" required>
              <Input id="loc-nome" value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} placeholder="Ex.: Unidade Centro" />
            </Field>

            <FieldGroup columns={2}>
              <Field label="Telefone" htmlFor="loc-telefone" optional>
                <Input id="loc-telefone" type="tel" value={form.telefone ?? ""} onChange={(e) => setForm((f) => ({ ...f, telefone: e.target.value }))} />
              </Field>
              <Field label="Fuso horário" htmlFor="loc-timezone" hint="Formato IANA, ex.: America/Sao_Paulo">
                <Input id="loc-timezone" value={form.timezone ?? ""} onChange={(e) => setForm((f) => ({ ...f, timezone: e.target.value }))} />
              </Field>
            </FieldGroup>

            <Field label="Endereço" htmlFor="loc-endereco" optional>
              <Input id="loc-endereco" value={form.endereco ?? ""} onChange={(e) => setForm((f) => ({ ...f, endereco: e.target.value }))} />
            </Field>

            <Field label="Descrição" htmlFor="loc-descricao" optional>
              <Input id="loc-descricao" value={form.descricao ?? ""} onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))} />
            </Field>

            <fieldset className="space-y-3">
              <legend className="text-sm font-semibold text-foreground">Reservas</legend>
              <FieldGroup columns={3}>
                <Field label="Duração padrão" htmlFor="loc-duration">
                  <Input id="loc-duration" type="number" min={1} inputMode="numeric" suffix="min" value={form.defaultReservationDurationMinutes ?? 120} onChange={(e) => setForm((f) => ({ ...f, defaultReservationDurationMinutes: Number(e.target.value) }))} />
                </Field>
                <Field label="Antecedência mínima" htmlFor="loc-advance">
                  <Input id="loc-advance" type="number" min={0} inputMode="numeric" suffix="min" value={form.reservationMinAdvanceMinutes ?? 0} onChange={(e) => setForm((f) => ({ ...f, reservationMinAdvanceMinutes: Number(e.target.value) }))} />
                </Field>
                <Field label="Tolerância de atraso" htmlFor="loc-tolerance" optional>
                  <Input
                    id="loc-tolerance"
                    type="number"
                    min={0}
                    inputMode="numeric"
                    suffix="min"
                    value={form.reservationLateToleranceMinutes ?? ""}
                    placeholder="Sem limite"
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        reservationLateToleranceMinutes: e.target.value === "" ? undefined : Number(e.target.value),
                      }))
                    }
                  />
                </Field>
              </FieldGroup>
            </fieldset>

            {location ? (
              <fieldset className="space-y-3 border-t border-border pt-5">
                <legend className="text-sm font-semibold text-foreground">Terminal Cielo</legend>
                <Field label="Código do estabelecimento na Cielo (EC)" htmlFor="loc-cielo" hint="Identifica esta unidade como recebedora nas cobranças via terminal Cielo (app Nokta POS). Não é uma senha — é só o número do estabelecimento cadastrado na sua conta Cielo.">
                  <div className="flex gap-2">
                    <Input id="loc-cielo" value={merchantCode} onChange={(e) => setMerchantCode(e.target.value)} placeholder="Ex.: 1006993336" inputMode="numeric" />
                    <Button
                      type="button"
                      variant="outline"
                      className="shrink-0"
                      loading={setCieloMerchantCode.isPending}
                      disabled={!merchantCode.trim()}
                      onClick={() =>
                        setCieloMerchantCode.mutate(
                          { locationId: location.id, cieloMerchantCode: merchantCode.trim() },
                          {
                            onSuccess: () => toast.success("Código do estabelecimento salvo."),
                            onError: (err) => toast.error(getErrorMessage(err, "Não foi possível salvar o código.")),
                          },
                        )
                      }
                    >
                      Salvar código
                    </Button>
                  </div>
                </Field>
              </fieldset>
            ) : null}
          </form>
        </DialogBody>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancelar
          </Button>
          <Button type="submit" form="location-form" loading={isPending} leftIcon="save">
            {location ? "Salvar alterações" : "Criar unidade"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
