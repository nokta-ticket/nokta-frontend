"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import api, { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";

/**
 * Transferência administrativa de um ingresso (`POST /admin/ingressos/:id/transferir`).
 * Usado na lista de ingressos e na aba Ingressos do usuário.
 */
export function TransferTicketDialog({ ticket, onOpenChange, onDone }: { ticket: { id: number; code?: string } | null; onOpenChange: (open: boolean) => void; onDone: () => void }) {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const open = ticket !== null;

  useEffect(() => {
    if (!open) setEmail("");
  }, [open]);

  async function confirm() {
    if (!ticket) return;
    if (!email.trim()) {
      toast.error("Informe o e-mail de destino.");
      return;
    }
    setPending(true);
    try {
      await api.post(`/admin/ingressos/${ticket.id}/transferir`, { toEmail: email.trim() });
      toast.success("Ingresso transferido");
      onOpenChange(false);
      onDone();
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível transferir o ingresso."));
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => (!pending ? onOpenChange(o) : null)}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>Transferir ingresso</DialogTitle>
          <DialogDescription>
            {ticket?.code ? (
              <>
                O ingresso <span className="font-mono text-foreground">{ticket.code}</span> vai
              </>
            ) : (
              "O ingresso vai"
            )}{" "}
            pra conta do e-mail informado. A conta de destino precisa existir, estar ativa e não estar bloqueada.
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <Field label="E-mail de destino" htmlFor="transfer-email">
            <Input id="transfer-email" type="email" leftIcon="mail" placeholder="pessoa@exemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => (e.key === "Enter" ? void confirm() : null)} autoFocus />
          </Field>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancelar
          </Button>
          <Button onClick={() => void confirm()} loading={pending} leftIcon="transfer">
            Confirmar transferência
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
