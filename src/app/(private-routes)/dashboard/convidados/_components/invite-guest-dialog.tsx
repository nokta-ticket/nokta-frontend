"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { guestsApi } from "@/services/guests";

export function InviteGuestDialog({
  eventId,
  open,
  onOpenChange,
  onInvited,
}: {
  eventId: number;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onInvited: () => void;
}) {
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Convidar para o evento</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="guestEmail">E-mail do convidado</Label>
            <Input
              id="guestEmail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="convidado@exemplo.com"
              autoFocus
              autoComplete="off"
              required
            />
            <p className="text-xs text-gray-500">
              O convidado precisa já ter uma conta na Nokta com esse e-mail — a cortesia (com QR code) vai
              direto para a conta dele.
            </p>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={loading || !email.trim()} className="w-full">
              {loading ? "Enviando..." : "Enviar cortesia"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
