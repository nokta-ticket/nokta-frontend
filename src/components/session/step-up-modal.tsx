"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Field } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { OtpInput } from "@/components/ui/otp-input";
import { toast } from "@/lib/toast";
import { getErrorMessage } from "@/lib/axios";
import { stepUpApi, type StepUpAction } from "@/services/step-up";

export interface StepUpPreviewField {
  label: string;
  value: string;
}

export interface OpenStepUpArgs {
  action: StepUpAction;
  organizationId: number | null;
  actionParams: Record<string, unknown>;
  title: string;
  description?: string;
  preview: StepUpPreviewField[];
}

interface StepUpContextType {
  /** Abre o modal, retorna o stepUpToken pro caller incluir no header X-Step-Up-Token do request real. Rejeita se o usuário cancelar. */
  openStepUp: (args: OpenStepUpArgs) => Promise<string>;
}

const StepUpContext = createContext<StepUpContextType | undefined>(undefined);

type PendingRequest = OpenStepUpArgs & {
  resolve: (token: string) => void;
  reject: (err: Error) => void;
};

/**
 * Modal de step-up genérico e reutilizável — qualquer tela de ação sensível
 * chama useStepUp().openStepUp({...}) e recebe uma Promise<string> com o
 * stepUpToken (ou rejeição se o usuário cancelar). Mostra o preview
 * explícito (valor, organização, recebedor, conta destino — o que for
 * relevante pra cada ação) ANTES de pedir a senha/código, conforme exigido.
 */
export function StepUpProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState<PendingRequest | null>(null);
  const pendingRef = useRef<PendingRequest | null>(null);

  const openStepUp = useCallback((args: OpenStepUpArgs) => {
    return new Promise<string>((resolve, reject) => {
      const request: PendingRequest = { ...args, resolve, reject };
      pendingRef.current = request;
      setPending(request);
    });
  }, []);

  const close = (result: { token?: string; cancelled?: boolean }) => {
    const request = pendingRef.current;
    pendingRef.current = null;
    setPending(null);
    if (!request) return;
    if (result.token) request.resolve(result.token);
    else request.reject(new Error("Verificação de segurança cancelada."));
  };

  return (
    <StepUpContext.Provider value={{ openStepUp }}>
      {children}
      {pending ? <StepUpModalInner request={pending} onSuccess={(token) => close({ token })} onCancel={() => close({ cancelled: true })} /> : null}
    </StepUpContext.Provider>
  );
}

export const useStepUp = (): StepUpContextType => {
  const ctx = useContext(StepUpContext);
  if (!ctx) throw new Error("useStepUp must be used within a StepUpProvider");
  return ctx;
};

function StepUpModalInner({ request, onSuccess, onCancel }: { request: OpenStepUpArgs; onSuccess: (token: string) => void; onCancel: () => void }) {
  const [phase, setPhase] = useState<"preview" | "code">("preview");
  const [grantId, setGrantId] = useState<string | null>(null);
  const [method, setMethod] = useState<"TOTP" | "OTP_WHATSAPP" | null>(null);
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const startChallenge = async () => {
    setSubmitting(true);
    try {
      const result = await stepUpApi.challenge(request.action, request.organizationId, request.actionParams);
      setGrantId(result.grantId);
      setMethod(result.method);
      setPhase("code");
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível iniciar a verificação de segurança."));
    } finally {
      setSubmitting(false);
    }
  };

  const confirmCode = async (value = code) => {
    if (!grantId || !value) return;
    setSubmitting(true);
    try {
      const result = await stepUpApi.verify(grantId, value);
      onSuccess(result.stepUpToken);
    } catch (err) {
      toast.error(getErrorMessage(err, "Código inválido. Verifique e tente novamente."));
      setCode("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open onOpenChange={(next) => !next && onCancel()}>
      <DialogContent size="sm">
        <DialogHeader>
          <span className="mb-3 flex size-11 items-center justify-center rounded-full bg-brand-soft text-brand">
            <Icon name="shield" size={18} />
          </span>
          <DialogTitle>{request.title}</DialogTitle>
          {request.description ? <DialogDescription>{request.description}</DialogDescription> : null}
        </DialogHeader>

        <DialogBody className="pt-1">
          {phase === "preview" ? (
            <>
              <dl className="surface-inset divide-y divide-border rounded-xl">
                {request.preview.map((field) => (
                  <div key={field.label} className="flex items-center justify-between gap-4 px-4 py-2.5 text-sm">
                    <dt className="text-muted-foreground">{field.label}</dt>
                    <dd className="text-right font-medium text-foreground">{field.value}</dd>
                  </div>
                ))}
              </dl>
              <Callout tone="info" icon="lock">
                Esta ação exige verificação em duas etapas: o código do seu aplicativo autenticador ou, se ainda não configurou, um código enviado pro seu WhatsApp.
              </Callout>
            </>
          ) : (
            <Field label={method === "TOTP" ? "Código do autenticador" : "Código enviado pro seu WhatsApp"}>
              <OtpInput value={code} onChange={setCode} onComplete={(v) => confirmCode(v)} disabled={submitting} autoFocus />
            </Field>
          )}
        </DialogBody>

        <DialogFooter>
          <Button variant="ghost" onClick={onCancel} disabled={submitting}>
            Cancelar
          </Button>
          {phase === "preview" ? (
            <Button onClick={startChallenge} loading={submitting} rightIcon={submitting ? undefined : "arrow-right"}>
              {submitting ? "Iniciando…" : "Continuar"}
            </Button>
          ) : (
            <Button onClick={() => confirmCode()} loading={submitting} disabled={code.length < 6}>
              {submitting ? "Confirmando…" : "Confirmar"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
