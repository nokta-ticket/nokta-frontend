"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { toast } from "@/lib/toast";
import {
  CalendarDays,
  Clock,
  MapPin,
  Ticket,
  Info,
  Ban,
  BadgeAlert,
  BadgePercent,
  Phone,
  Mail,
  Instagram,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import api from "@/lib/axios";
import { EventDetails, EventoAPI } from "@/interfaces/events";
import { resolveThumbnailUrl } from "@/lib/media";

export default function IngressoDetalhesPage() {
  const { id } = useParams<{ id: string }>();
  const [evento, setEvento] = useState<EventDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchEvento = async () => {
      try {
        const res = await api.get<EventDetails>(`/eventos/${id}`);

        const data = res.data;
        setEvento(data);
      } catch (err: any) {
        toast.error(err.message ?? "Erro ao carregar evento.");
      } finally {
        setLoading(false);
      }
    };

    fetchEvento();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-[1300px] mx-auto p-10 text-center text-muted-foreground">
        Carregando…
      </div>
    );
  }

  if (!evento) return null;

  const thumb = resolveThumbnailUrl(evento.thumbnails[0], null);
  const dataFmt = new Date(evento.data).toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const horarioFmt = evento.horario?.slice(0, 5);

  return (
    <main className="max-w-[1300px] mx-auto space-y-8">
      {thumb && (
        <div className="w-full overflow-hidden rounded-lg">
          <Image
            src={thumb}
            alt={evento.nome}
            width={1200}
            height={600}
            sizes="100vw"
            className="w-full h-auto object-cover rounded-lg"
            priority
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <header className="space-y-2">
            <h1 className="text-3xl font-bold">{evento.nome}</h1>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4" /> {dataFmt}
              </span>
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4" /> {horarioFmt}
              </span>
              <span className="flex items-center gap-2">
                <MapPin className="w-4 h-4" /> {evento.local}
              </span>
            </div>
          </header>

          <Separator />

          <section className="space-y-6">
            <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <Ticket className="w-5 h-5" /> Atrações
            </h2>
            <p className="whitespace-pre-line text-sm">{evento.descricao}</p>

            <Separator />

            <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <Ticket className="w-5 h-5" /> Programação
            </h2>
            <p className="whitespace-pre-line text-sm">{evento.programacao}</p>
          </section>

          {(evento.classificacaoEtaria ||
            evento.politicaMeiaEntrada ||
            evento.politicaCancelamento) && (
            <>
              <Separator />
              <section className="space-y-6">
                <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <Info className="w-5 h-5" /> Informações adicionais
                </h2>
                <div className="space-y-4">
                  {evento.classificacaoEtaria && (
                    <div>
                      <div className="flex items-center gap-2 font-medium">
                        <BadgeAlert className="w-5 h-5" /> Classificação Etária
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {evento.classificacaoEtaria}
                      </p>
                    </div>
                  )}
                  {evento.politicaMeiaEntrada && (
                    <div>
                      <div className="flex items-center gap-2 font-medium">
                        <BadgePercent className="w-5 h-5" /> Meia Entrada
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {evento.politicaMeiaEntrada}
                      </p>
                    </div>
                  )}
                  {evento.politicaCancelamento && (
                    <div>
                      <div className="flex items-center gap-2 font-medium">
                        <Ban className="w-5 h-5" /> Política de Cancelamento
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {evento.politicaCancelamento}
                      </p>
                    </div>
                  )}
                  {evento.whatsapp && (
                    <div>
                      <div className="flex items-center gap-2 font-medium">
                        <Phone className="w-5 h-5" /> Whatsapp
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {evento.whatsapp}
                      </p>
                    </div>
                  )}
                  {evento.email && (
                    <div>
                      <div className="flex items-center gap-2 font-medium">
                        <Mail className="w-5 h-5" /> Email
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {evento.email}
                      </p>
                    </div>
                  )}
                  {evento.instagram && (
                    <div>
                      <div className="flex items-center gap-2 font-medium">
                        <Instagram className="w-5 h-5" /> Instagram
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {evento.instagram}
                      </p>
                    </div>
                  )}
                </div>
              </section>
            </>
          )}

          {evento.info && (
            <>
              <Separator />
              <section>
                <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <Info className="w-5 h-5" /> Informações
                </h2>
                <p className="text-sm text-muted-foreground">{evento.info}</p>
              </section>
            </>
          )}
        </div>

        <Card className="h-fit shadow-md">
          <CardHeader>
            <h3 className="text-lg font-semibold">Detalhes do Evento</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground">Data</p>
              <p className="text-base font-medium">{dataFmt}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Horário</p>
              <p className="text-base font-medium">{horarioFmt}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Endereço</p>
              <p className="text-base font-medium leading-tight">
                {evento.local}
              </p>
            </div>
            <Link href={`/eventos/${evento.id}/checkout`}>
              <Button className="w-full bg-primary text-white">
                Comprar Ingresso
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
