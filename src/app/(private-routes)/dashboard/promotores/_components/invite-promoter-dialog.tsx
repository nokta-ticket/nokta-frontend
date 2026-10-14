"use client";

import { useState } from "react";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { usePromoterMutations } from "../_hooks/use-promoters";

export function InvitePromoterDialog({ orgId, open, onOpenChange }: { orgId: number; open: boolean; onOpenChange: (v: boolean) => void }) {
  const { invite } = usePromoterMutations(orgId);
  const [email, setEmail] = useState("");

  const reset = () => setEmail("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Informe o e-mail do promoter.");
      return;
    }
    try {
      await invite.mutateAsync(email.trim());
      toast.success("Convite enviado");
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
        <form onSubmit={handleSubmit} className="contents">
          <DialogHeader>
            <DialogTitle>Convidar promoter</DialogTitle>
            <DialogDescription>A pessoa recebe um e-mail com um link pra aceitar o convite e virar promoter desta organização.</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <Field label="E-mail" htmlFor="promoter-invite-email">
              <Input id="promoter-invite-email" type="email" leftIcon="mail" placeholder="nome@exemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
            </Field>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" leftIcon="send" loading={invite.isPending} disabled={!email.trim()}>
              Enviar convite
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
