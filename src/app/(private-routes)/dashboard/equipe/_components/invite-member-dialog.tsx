"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Convidar membro</DialogTitle>
          <DialogDescription>A pessoa recebe um e-mail com um link para aceitar o convite.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="invite-email">E-mail</Label>
            <Input id="invite-email" type="email" placeholder="nome@exemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label>Papel no Venue</Label>
            <Select value={roleKey} onValueChange={(v) => setRoleKey(v as VenueRoleKey)}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Selecione um papel" /></SelectTrigger>
              <SelectContent>
                {(roles ?? []).map((r) => (
                  <SelectItem key={r.key} value={r.key}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedRole ? <p className="text-xs text-black/50">{selectedRole.description}</p> : null}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={createInvitation.isPending}>
            {createInvitation.isPending ? "Enviando…" : "Enviar convite"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
