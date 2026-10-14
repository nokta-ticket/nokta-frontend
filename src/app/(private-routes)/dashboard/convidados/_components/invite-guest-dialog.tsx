"use client";

import { useEffect, useState } from "react";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { guestsApi } from "@/services/guests";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function InviteGuestDialog({ eventId, eventName, open, onOpenChange, onInvited }: { eventId: number; eventName?: string; open: boolean; onOpenChange: (v: boolean) => void; onInvited: () => void }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setEmail("");
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      const result = await guestsApi.invite({ eventId, email: email.trim() });
      toast.success(result.message);
      onOpenChange(false);
      onInvited();
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível enviar a cortesia."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <form onSubmit={handleSubmit} className="contents">
          <DialogHeader>
            <DialogTitle>Convidar para {eventName ? `“${eventName}”` : "o evento"}</DialogTitle>
            <DialogDescription>A cortesia (com QR code) vai direto pra conta Nokta do convidado.</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <Field label="E-mail do convidado" htmlFor="guestEmail" hint="Precisa ser o e-mail da conta Nokta dele.">
              <Input id="guestEmail" type="email" leftIcon="mail" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="convidado@exemplo.com" autoFocus autoComplete="off" required />
            </Field>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" leftIcon="send" loading={loading} disabled={!email.trim()}>
              Enviar cortesia
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
