"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { toast } from "sonner";

// Tipagem correta para os eventos
type EventOption = {
  id: "1" | "2" | "3";
  name: string;
};

const events: EventOption[] = [
  { id: "1", name: "Tequilada Insper" },
  { id: "2", name: "Festival de Verão" },
  { id: "3", name: "Semanight: em.braza" },
];

// Tipar ticketsByEvent corretamente
const ticketsByEvent: Record<EventOption["id"], string[]> = {
  "1": ["Pista", "Camarote"],
  "2": ["Pista", "Pista Premium", "Backstage"],
  "3": ["Mezanino", "VIP", "Front Stage"],
};

export default function SellTicketPage() {
  const [selectedEvent, setSelectedEvent] = useState<EventOption["id"] | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [price, setPrice] = useState<string>("");

  const handleSubmit = () => {
    if (!selectedEvent || !selectedTicket || !price) {
      toast.error("Preencha todos os campos");
      return;
    }

    toast.success("Ingresso anunciado com sucesso!");
  };

  return (
    <section className="w-full max-w-[600px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-semibold mb-6">Vender Ingresso</h1>

      <div className="space-y-6">
        {/* Evento */}
        <div className="space-y-2">
          <Label>Evento</Label>
          <Select
            onValueChange={(value: EventOption["id"]) => {
              setSelectedEvent(value);
              setSelectedTicket(null);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o evento" />
            </SelectTrigger>
            <SelectContent>
              {events.map((event) => (
                <SelectItem key={event.id} value={event.id}>
                  {event.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Ingresso */}
        <div className="space-y-2">
          <Label>Tipo de Ingresso</Label>
          <Select
            disabled={!selectedEvent}
            onValueChange={setSelectedTicket}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={
                  selectedEvent
                    ? "Selecione o ingresso"
                    : "Selecione o evento primeiro"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {selectedEvent &&
                ticketsByEvent[selectedEvent].map((ticketType: string) => (
                  <SelectItem key={ticketType} value={ticketType}>
                    {ticketType}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        {/* Valor */}
        <div className="space-y-2">
          <Label>Valor</Label>
          <Input
            type="number"
            placeholder="Ex: 120.00"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>

        {/* Botão */}
        <Button
          className="w-full bg-violet-600 text-white hover:bg-violet-700"
          onClick={handleSubmit}
        >
          Anunciar Ingresso
        </Button>
      </div>
    </section>
  );
}
