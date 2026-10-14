"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api, { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Transferir o ingresso pra outra conta Nokta (por e-mail), em dois passos:
 * e-mail → revisão → `POST /tickets/:id/transferir`. Depois volta pra
 * carteira, porque o ingresso sai dela.
 */
export function TransferDialog({ open, onOpenChange, ticketId }: { open: boolean; onOpenChange: (open: boolean) => void; ticketId: string | number }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"form" | "confirm">("form");
  const [transferring, setTransferring] = useState(false);

  useEffect(() => {
    if (open) {
      setEmail("");
      setStep("form");
    }
  }, [open]);

  const submit = async () => {
    try {
      setTransferring(true);
      await api.post(`/tickets/${ticketId}/transferir`, { email: email.trim() });
      toast.success("Ingresso transferido com sucesso!");
      onOpenChange(false);
      router.push("/meus-ingressos");
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível realizar a transferência."));
    } finally {
      setTransferring(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !transferring && onOpenChange(v)}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>{step === "form" ? "Transferir ingresso" : "Confirmar transferência?"}</DialogTitle>
          <DialogDescription>{step === "form" ? "Envie este ingresso para outra pessoa." : "Revise antes de confirmar."}</DialogDescription>
        </DialogHeader>

        <DialogBody>
          {step === "form" ? (
            <>
              <Callout tone="info" title="Antes de continuar">
                <p>Use a transferência só pra enviar seu ingresso pra alguém de confiança. Ao confirmar, ele sai da sua carteira e passa automaticamente pra conta da outra pessoa.</p>
                <p className="mt-1.5">
                  Quer vender? Use a <strong className="text-foreground">revenda oficial da Nokta</strong> pra evitar golpe, duplicidade ou problema na entrada.
                </p>
              </Callout>
              <Field label="E-mail de quem vai receber" htmlFor="transfer-email" hint="A pessoa precisa ter uma conta Nokta com este e-mail.">
                <Input id="transfer-email" type="email" leftIcon="mail" autoComplete="off" placeholder="exemplo@email.com" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
              </Field>
            </>
          ) : (
            <>
              <div className="surface-inset rounded-xl p-4">
                <p className="text-caption text-muted-foreground">Você está enviando este ingresso para</p>
                <p className="mt-1 break-all text-base font-semibold text-foreground">{email}</p>
                <p className="mt-1 text-caption text-subtle-foreground">Confira o e-mail antes de continuar.</p>
              </div>
              <p className="text-body text-muted-foreground">Após confirmar, o ingresso vai pra esta conta e não aparece mais na sua carteira. Esta ação não pode ser desfeita.</p>
            </>
          )}
        </DialogBody>

        <DialogFooter>
          {step === "form" ? (
            <>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button disabled={!EMAIL_RE.test(email)} onClick={() => setStep("confirm")} rightIcon="arrow-right">
                Continuar
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => setStep("form")} disabled={transferring}>
                Voltar
              </Button>
              <Button onClick={submit} loading={transferring} leftIcon={transferring ? undefined : "send"}>
                {transferring ? "Transferindo…" : "Confirmar transferência"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
