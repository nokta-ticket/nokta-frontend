"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Calendar, MapPin, Ticket, ArrowLeft, Loader2, AlertCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/lib/toast";
import api, { getErrorMessage } from "@/lib/axios";
import { resolveMediaUrl } from "@/lib/media";
import { useAuth } from "@/context/AuthContext";

interface ResaleDetail {
  id: number;
  buyerPrice: number;
  sellerAmount: number;
  originalPrice: number;
  status: number;
  expiresAt: string;
  ingresso: { id: number; nome: string; tipo: number; lote: number } | null;
  evento: {
    id: number;
    nome: string;
    data: string;
    horario: string;
    endereco: { localidade: string; uf: string } | null;
    thumbnail: string | null;
  } | null;
}

export default function ComprarRevendaPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [resale, setResale] = useState<ResaleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [buying, setBuying] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await api.get<{ data: ResaleDetail[] }>("/revenda", { params: { page: 1, limit: 200 } });
        const found = (res.data.data ?? []).find((r) => r.id === Number(id));
        if (!found) {
          setError("Ingresso não encontrado ou não está mais disponível.");
        } else {
          setResale(found);
        }
      } catch (err) {
        setError(getErrorMessage(err, "Não foi possível carregar o ingresso."));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function handleBuy() {
    if (!user) {
      toast.error("Você precisa estar logado para comprar.");
      router.push("/login");
      return;
    }
    try {
      setBuying(true);
      await api.post(`/revenda/${id}/comprar`);
      setDone(true);
      toast.success("Ingresso comprado com sucesso! Acesse Meus Ingressos.");
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? getErrorMessage(err, "Erro ao comprar ingresso."));
    } finally {
      setBuying(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !resale) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center">
        <AlertCircle className="h-12 w-12 text-destructive opacity-70" />
        <p className="text-muted-foreground">{error ?? "Ingresso não encontrado."}</p>
        <Button variant="outline" onClick={() => router.push("/revenda")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar à revenda
        </Button>
      </div>
    );
  }

  const preco = (resale.buyerPrice ?? resale.originalPrice).toLocaleString("pt-BR", { minimumFractionDigits: 2 });

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 container px-4 mx-auto py-8 max-w-2xl">
        <button
          onClick={() => router.push("/revenda")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar à revenda
        </button>

        {done ? (
          <Card className="p-8 text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <ShieldCheck className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h2 className="text-2xl font-bold">Compra realizada!</h2>
            <p className="text-muted-foreground">
              Seu ingresso foi transferido. Acesse <strong>Meus Ingressos</strong> para visualizá-lo.
            </p>
            <Button onClick={() => router.push("/meus-ingressos")} className="w-full">
              Ver meus ingressos
            </Button>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card className="overflow-hidden py-0">
              {resale.evento?.thumbnail && (
                <div className="relative aspect-[16/8] overflow-hidden bg-muted">
                  <img
                    src={resolveMediaUrl(resale.evento.thumbnail, null) ?? ""}
                    alt={resale.evento?.nome ?? "Evento"}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="p-6 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <h1 className="text-xl md:text-2xl font-bold leading-tight">
                    {resale.evento?.nome ?? "Evento"}
                  </h1>
                  <Badge className="bg-primary/90 text-white border-0 shrink-0">
                    <Ticket className="h-3 w-3 mr-1" /> Revenda
                  </Badge>
                </div>

                <div className="space-y-2 text-sm text-muted-foreground">
                  {resale.evento?.data && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span>
                        {new Date(resale.evento.data).toLocaleDateString("pt-BR", {
                          day: "2-digit", month: "long", year: "numeric",
                        })}
                        {resale.evento.horario ? ` às ${resale.evento.horario}` : ""}
                      </span>
                    </div>
                  )}
                  {resale.evento?.endereco && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span>{resale.evento.endereco.localidade}, {resale.evento.endereco.uf}</span>
                    </div>
                  )}
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Setor / Lote</span>
                    <span className="font-medium">
                      {resale.ingresso?.nome ?? "—"} · Lote {resale.ingresso?.lote ?? "—"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Preço original</span>
                    <span>R$ {resale.originalPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-primary">
                    <span>Você paga</span>
                    <span>R$ {preco}</span>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-4 flex items-start gap-3 bg-muted/50">
              <ShieldCheck className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div className="text-sm text-muted-foreground space-y-1">
                <p className="font-medium text-foreground">Compra protegida</p>
                <p>O ingresso é transferido instantaneamente para sua conta após o pagamento.</p>
              </div>
            </Card>

            <Button
              onClick={handleBuy}
              disabled={buying}
              size="lg"
              className="w-full text-base"
            >
              {buying ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processando...</>
              ) : (
                <>Comprar por R$ {preco}</>
              )}
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
