"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useOrganizations } from "@/context/OrganizationContext";

interface RequireWorkspaceContextType {
  /**
   * Roda `action` só se existir um workspace (organização) selecionado.
   * Sem workspace, abre o diálogo de criação em vez de executar `action` —
   * uso: envolver o onClick de qualquer botão de escrita (criar, salvar,
   * excluir) com `guard(() => ...)`.
   */
  guard: (action: () => void) => void;
}

const RequireWorkspaceContext = createContext<RequireWorkspaceContextType | undefined>(undefined);

/**
 * Fase 6 — navegação liberada mesmo sem workspace (o usuário vê a estrutura
 * inteira do produto antes de criar a organização), mas qualquer ação que
 * escreva dado precisa de um workspace de verdade por trás. Centraliza essa
 * checagem aqui em vez de repetir `if (!currentOrg)` em cada botão de cada
 * página de módulo — ver dashboard/onboarding/page.tsx para o fluxo de
 * criação em si (este diálogo só linka pra lá).
 */
export function RequireWorkspaceProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { currentOrg } = useOrganizations();
  const [open, setOpen] = useState(false);

  const guard = useCallback(
    (action: () => void) => {
      if (currentOrg) {
        action();
        return;
      }
      setOpen(true);
    },
    [currentOrg],
  );

  const handleCreateWorkspace = () => {
    setOpen(false);
    router.push("/dashboard/onboarding");
  };

  return (
    <RequireWorkspaceContext.Provider value={{ guard }}>
      {children}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-violet-100">
              <Rocket className="text-violet-600" size={22} />
            </div>
            <DialogTitle className="text-center">Crie seu workspace primeiro</DialogTitle>
            <DialogDescription className="text-center">
              Para cadastrar ou alterar qualquer coisa, você precisa criar a organização onde isso vai ficar guardado. Leva menos de um minuto.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center">
            <Button onClick={handleCreateWorkspace} className="w-full sm:w-auto">
              Criar workspace
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </RequireWorkspaceContext.Provider>
  );
}

export function useRequireWorkspace(): RequireWorkspaceContextType {
  const ctx = useContext(RequireWorkspaceContext);
  if (!ctx) throw new Error("useRequireWorkspace must be used within a RequireWorkspaceProvider");
  return ctx;
}
