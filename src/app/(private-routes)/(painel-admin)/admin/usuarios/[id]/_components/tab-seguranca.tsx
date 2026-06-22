"use client";

import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import {
  CheckCircle,
  XCircle,
  LogOut,
  Shield,
  Globe,
  AlertTriangle,
  Mail,
  Phone,
  Lock,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import api, { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";

interface SecurityData {
  emailVerificado: boolean;
  telefoneVerificado: boolean;
  contaBloqueada: boolean;
  bloqueadoMotivo: string | null;
  twoFactorAtivo: boolean;
  ultimoIp: string | null;
  falhasRecentes: number;
}

function getUserRole(): string | null {
  try {
    const raw = Cookies.get("user");
    if (!raw) return null;
    return JSON.parse(raw).role ?? null;
  } catch {
    return null;
  }
}

export default function TabSeguranca({ userId }: { userId: number }) {
  const role = getUserRole();
  const isSupport = role === "SUPPORT";

  const [data, setData] = useState<SecurityData | null>(null);
  const [loading, setLoading] = useState(true);

  const [sessionOpen, setSessionOpen] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(false);

  async function getSecurityData() {
    setLoading(true);
    try {
      const res = await api.get<SecurityData>(
        `/admin/usuarios/${userId}/seguranca`
      );
      setData(res.data);
    } catch (err) {
      toast.error(
        getErrorMessage(
          err,
          "Não foi possível carregar dados de segurança."
        )
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void getSecurityData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function handleInvalidateSessions() {
    setSessionLoading(true);
    try {
      await api.post(`/admin/usuarios/${userId}/invalidar-sessoes`);
      toast.success("Todas as sessões foram invalidadas com sucesso");
      setSessionOpen(false);
    } catch (err) {
      toast.error(
        getErrorMessage(err, "Não foi possível invalidar as sessões.")
      );
    } finally {
      setSessionLoading(false);
    }
  }

  if (loading) {
    return (
      <p className="py-12 text-center text-muted-foreground">Carregando...</p>
    );
  }

  if (!data) {
    return (
      <div className="rounded-xl border bg-white p-8 text-center shadow-sm">
        <p className="text-muted-foreground">
          Não foi possível carregar as informações de
          segurança.
        </p>
      </div>
    );
  }

  const cards = [
    {
      label: "Email verificado",
      value: data.emailVerificado,
      icon: Mail,
    },
    {
      label: "Telefone verificado",
      value: data.telefoneVerificado,
      icon: Phone,
    },
    {
      label: "Conta bloqueada",
      value: data.contaBloqueada,
      icon: Lock,
      extra: data.contaBloqueada && data.bloqueadoMotivo
        ? `Motivo: ${data.bloqueadoMotivo}`
        : undefined,
      invertColor: true,
    },
    {
      label: "2FA ativo",
      value: data.twoFactorAtivo,
      icon: Shield,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {cards.map((card) => {
          const isPositive = card.invertColor ? !card.value : card.value;

          return (
            <div
              key={card.label}
              className="rounded-lg border bg-white p-4 shadow-sm"
            >
              <p className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                <card.icon className="h-3.5 w-3.5" />
                {card.label}
              </p>
              <div className="flex items-center gap-2">
                {isPositive ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <span
                  className={`text-sm font-medium ${
                    isPositive ? "text-green-700" : "text-red-700"
                  }`}
                >
                  {card.value ? "Sim" : "Não"}
                </span>
              </div>
              {card.extra && (
                <p className="mt-1.5 text-xs text-red-600">{card.extra}</p>
              )}
            </div>
          );
        })}

        {/* Último IP */}
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <p className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Globe className="h-3.5 w-3.5" />
            Último IP
          </p>
          <p className="text-sm font-medium font-mono">
            {data.ultimoIp ?? "—"}
          </p>
        </div>

        {/* Falhas recentes */}
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <p className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <AlertTriangle className="h-3.5 w-3.5" />
            Falhas recentes
          </p>
          <p
            className={`text-sm font-medium ${
              data.falhasRecentes > 0 ? "text-red-600" : "text-green-700"
            }`}
          >
            {data.falhasRecentes}
          </p>
        </div>
      </div>

      {/* Ações */}
      {!isSupport && (
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            variant="outline"
            onClick={() => setSessionOpen(true)}
            className="border-violet-600 text-violet-600 hover:bg-violet-50"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Invalidar todas as sessões
          </Button>
        </div>
      )}

      {/* Dialog confirmação */}
      <Dialog open={sessionOpen} onOpenChange={setSessionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invalidar todas as sessões</DialogTitle>
            <DialogDescription>
              Todas as sessões ativas deste usuário serão
              encerradas imediatamente. Ele precisará fazer login novamente.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSessionOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => void handleInvalidateSessions()}
              disabled={sessionLoading}
              className="bg-violet-600 text-white hover:bg-violet-700"
            >
              {sessionLoading ? "Processando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
