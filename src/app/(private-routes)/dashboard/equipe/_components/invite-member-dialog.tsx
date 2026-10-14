"use client";

import { useState } from "react";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/lib/toast";
import { getErrorMessage } from "@/lib/axios";
import type { VenueRoleKey } from "@/services/venue-team";
import { useVenueRolesCatalog, useVenueTeamMutations } from "../_hooks/use-venue-team";
import { useVenueAccess } from "@/context/VenueAccessContext";

export function InviteMemberDialog({ orgId, open, onOpenChange }: { orgId: number; open: boolean; onOpenChange: (v: boolean) => void }) {
  const { data: allRoles } = useVenueRolesCatalog(orgId);
  const { venueRole } = useVenueAccess();
  const { createInvitation } = useVenueTeamMutations(orgId);

  // Só quem é OWNER pode convidar para OWNER/MANAGER — mesma regra do backend, aqui só para não oferecer uma opção que vai dar 403.
  const roles = allRoles?.filter((r) => venueRole === "OWNER" || (r.key !== "OWNER" && r.key !== "MANAGER"));

  const [email, setEmail] = useState("");
  const [roleKey, setRoleKey] = useState<VenueRoleKey | "">("");

  const selectedRole = roles?.find((r) => r.key === roleKey);

  const reset = () => {
    setEmail("");
    setRoleKey("");
  };

  const handleSubmit = async () => {
    if (!email.trim() || !roleKey) {
      toast.error("Informe o e-mail e o papel.");
      return;
    }
    try {
      await createInvitation.mutateAsync({ email: email.trim(), module: "venue", roleKey });
      toast.success("Convite enviado.");
      reset();
      onOpenChange(false);
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível enviar o convite."));
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) reset();
      }}
    >
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>Convidar membro</DialogTitle>
          <DialogDescription>A pessoa recebe um e-mail com um link para aceitar o convite.</DialogDescription>
        </DialogHeader>

        <DialogBody>
          <form
            id="invite-member-form"
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              void handleSubmit();
            }}
          >
            <Field label="E-mail" htmlFor="invite-email" required>
              <Input id="invite-email" type="email" autoComplete="off" placeholder="nome@exemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} leftIcon="mail" />
            </Field>

            <Field label="Papel na operação" htmlFor="invite-role" required hint={selectedRole?.description}>
              <Select value={roleKey} onValueChange={(v) => setRoleKey(v as VenueRoleKey)}>
                <SelectTrigger id="invite-role" className="h-11 w-full rounded-input border-border bg-surface-2 px-3.5 md:h-10">
                  <SelectValue placeholder="Selecione um papel" />
                </SelectTrigger>
                <SelectContent>
                  {(roles ?? []).map((r) => (
                    <SelectItem key={r.key} value={r.key}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </form>
        </DialogBody>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="submit" form="invite-member-form" loading={createInvitation.isPending} leftIcon="send">
            Enviar convite
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
