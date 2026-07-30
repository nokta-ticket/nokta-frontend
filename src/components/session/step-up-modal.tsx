"use client";

import { useState } from "react";
import { createContext, useCallback, useContext, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
      {pending ? (
        <StepUpModalInner
          request={pending}
          onSuccess={(token) => close({ token })}
          onCancel={() => close({ cancelled: true })}
        />
      ) : null}
    </StepUpContext.Provider>
  );
}

export const useStepUp = (): StepUpContextType => {
  const ctx = useContext(StepUpContext);
  if (!ctx) throw new Error("useStepUp must be used within a StepUpProvider");
  return ctx;
};

function StepUpModalInner({
  request,
  onSuccess,
  onCancel,
}: {
  request: OpenStepUpArgs;
  onSuccess: (token: string) => void;
  onCancel: () => void;
}) {
  const [phase, setPhase] = useState<"preview" | "code">("preview");
  const [grantId, setGrantId] = useState<string | null>(null);
  const [method, setMethod] = useState<"TOTP" | "OTP_SMS" | null>(null);
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

  const confirmCode = async () => {
    if (!grantId) return;
    setSubmitting(true);
    try {
      const result = await stepUpApi.verify(grantId, code);
      onSuccess(result.stepUpToken);
    } catch (err) {
      toast.error(getErrorMessage(err, "Código inválido. Verifique e tente novamente."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open onOpenChange={(next) => !next && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{request.title}</DialogTitle>
          {request.description ? <DialogDescription>{request.description}</DialogDescription> : null}
        </DialogHeader>

        {phase === "preview" ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-[#ecebf1] bg-black/[0.02] p-3.5">
              <dl className="space-y-2">
                {request.preview.map((field) => (
                  <div key={field.label} className="flex items-center justify-between text-sm">
                    <dt className="text-black/50">{field.label}</dt>
                    <dd className="font-medium text-[#1a1626]">{field.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <p className="text-xs text-black/50">
              Esta ação exige verificação em duas etapas. Você vai precisar confirmar com o código do seu aplicativo autenticador (ou um código
              enviado por SMS, se ainda não configurou o Authenticator).
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            <Label>{method === "TOTP" ? "Código do autenticador" : "Código enviado por SMS"}</Label>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && confirmCode()}
              placeholder="000000"
              inputMode="numeric"
              maxLength={8}
              autoFocus
            />
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onCancel} disabled={submitting}>
            Cancelar
          </Button>
          {phase === "preview" ? (
            <Button onClick={startChallenge} disabled={submitting}>
              {submitting ? "Iniciando…" : "Continuar"}
            </Button>
          ) : (
            <Button onClick={confirmCode} disabled={submitting || !code}>
              {submitting ? "Confirmando…" : "Confirmar"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
