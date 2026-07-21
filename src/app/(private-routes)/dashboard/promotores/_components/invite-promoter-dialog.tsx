"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/lib/toast";
import { getErrorMessage } from "@/lib/axios";
import { usePromoterMutations } from "../_hooks/use-promoters";

export function InvitePromoterDialog({ orgId, open, onOpenChange }: { orgId: number; open: boolean; onOpenChange: (v: boolean) => void }) {
  const { invite } = usePromoterMutations(orgId);
  const [email, setEmail] = useState("");

  const reset = () => setEmail("");

  const handleSubmit = async () => {
    if (!email.trim()) {
      toast.error("Informe o e-mail do promoter.");
      return;
    }
    try {
      await invite.mutateAsync(email.trim());
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
          <DialogTitle>Convidar promoter</DialogTitle>
          <DialogDescription>A pessoa recebe um e-mail com um link para aceitar o convite e virar promoter desta organização.</DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5">
          <Label htmlFor="promoter-invite-email">E-mail</Label>
          <Input id="promoter-invite-email" type="email" placeholder="nome@exemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={invite.isPending}>
            {invite.isPending ? "Enviando…" : "Enviar convite"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
