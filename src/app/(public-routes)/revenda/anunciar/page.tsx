"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Card, CardContent } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SelectInput } from "@/components/ui/select-input";
import { toast } from "@/lib/toast";

// Protótipo sem backend: eventos e ingressos fixos, só pra ver o fluxo.
type EventOption = { id: "1" | "2" | "3"; name: string };

const events: EventOption[] = [
  { id: "1", name: "Tequilada Insper" },
  { id: "2", name: "Festival de Verão" },
  { id: "3", name: "Semanight: em.braza" },
];

const ticketsByEvent: Record<EventOption["id"], string[]> = {
  "1": ["Pista", "Camarote"],
  "2": ["Pista", "Pista Premium", "Backstage"],
  "3": ["Mezanino", "VIP", "Front Stage"],
};

export default function SellTicketPage() {
  const [selectedEvent, setSelectedEvent] = useState<EventOption["id"] | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [price, setPrice] = useState("");

  const handleSubmit = () => {
    if (!selectedEvent || !selectedTicket || !price) {
      toast.error("Preencha todos os campos");
      return;
    }
    toast.success("Ingresso anunciado com sucesso!");
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-6 lg:py-10">
      <h1 className="text-title font-semibold tracking-tight text-foreground">Anunciar ingresso</h1>
      <p className="mt-1.5 text-body text-muted-foreground">Escolha o evento, o ingresso e o valor. A revenda não permite lucro: o preço vai até o que você pagou.</p>

      <Card className="mt-6">
        <CardContent className="space-y-5">
          <Field label="Evento" htmlFor="sell-event">
            <SelectInput
              id="sell-event"
              value={selectedEvent ?? undefined}
              onValueChange={(value) => {
                setSelectedEvent(value as EventOption["id"]);
                setSelectedTicket(null);
              }}
              options={events.map((e) => ({ value: e.id, label: e.name }))}
              placeholder="Selecione o evento"
            />
          </Field>

          <Field label="Tipo de ingresso" htmlFor="sell-ticket" hint={!selectedEvent ? "Selecione o evento primeiro" : undefined}>
            <SelectInput id="sell-ticket" value={selectedTicket ?? undefined} onValueChange={setSelectedTicket} options={selectedEvent ? ticketsByEvent[selectedEvent].map((t) => ({ value: t, label: t })) : []} placeholder="Selecione o ingresso" disabled={!selectedEvent} />
          </Field>

          <Field label="Valor" htmlFor="sell-price" hint="Até o valor que você pagou pelo ingresso.">
            <Input id="sell-price" inputMode="decimal" prefix="R$" placeholder="120,00" value={price} onChange={(e) => setPrice(e.target.value)} />
          </Field>

          <Callout tone="info">Enquanto estiver à venda, o QR Code fica suspenso. Se não vender até 2h antes do evento, ele volta pra você.</Callout>

          <Button size="full" onClick={handleSubmit}>
            Anunciar ingresso
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
