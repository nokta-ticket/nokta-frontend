"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon, type IconName } from "@/components/ui/icon";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/cn";

type Item = { icon: IconName; title: string; desc: string };

const COMPRAR: Item[] = [
  { icon: "shield", title: "Compra verificada", desc: "Todo ingresso é validado pela Nokta antes de aparecer aqui." },
  { icon: "transfer", title: "Transferência automática", desc: "Pagou, o ingresso é seu na hora — com QR Code novo." },
  { icon: "qr", title: "QR Code só pra você", desc: "O código antigo é cancelado; só o seu funciona na porta." },
  { icon: "lock", title: "Sem contato com o vendedor", desc: "Tudo acontece dentro da plataforma, com pagamento protegido." },
  { icon: "tag", title: "Preço justo", desc: "Nunca acima do valor original do ingresso." },
];

const REVENDER: Item[] = [
  { icon: "tag", title: "Você define o preço", desc: "Até o limite do que pagou — revenda não tem lucro." },
  { icon: "qr", title: "QR Code suspenso", desc: "Enquanto estiver à venda, o ingresso não pode ser usado." },
  { icon: "money-transfer", title: "Vendeu, recebeu", desc: "A transferência é automática e o dinheiro cai pra você." },
  { icon: "history", title: "Não vendeu? Tudo certo", desc: "Até 2h antes do evento o ingresso volta pra sua carteira." },
  { icon: "clock", title: "Prazo", desc: "A revenda fica disponível até 2 horas antes do início." },
];

function List({ items }: { items: Item[] }) {
  return (
    <ul className="space-y-4">
      {items.map((item) => (
        <li key={item.title} className="flex items-start gap-3">
          <Icon name={item.icon} size={15} className="mt-0.5 shrink-0 text-brand" />
          <div>
            <p className="text-sm font-semibold text-foreground">{item.title}</p>
            <p className="mt-0.5 text-caption text-muted-foreground">{item.desc}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Como funciona (comprar / revender) + chamada pra quem tem ingresso sobrando. */
export function ResaleInfoTabs({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-4", className)}>
      <Card className="p-5">
        <Tabs defaultValue="comprar">
          <TabsList variant="pill" className="w-full">
            <TabsTrigger value="comprar" className="flex-1">
              Quero comprar
            </TabsTrigger>
            <TabsTrigger value="revender" className="flex-1">
              Quero revender
            </TabsTrigger>
          </TabsList>
          <TabsContent value="comprar">
            <List items={COMPRAR} />
          </TabsContent>
          <TabsContent value="revender">
            <List items={REVENDER} />
          </TabsContent>
        </Tabs>
      </Card>

      <Card accent className="relative overflow-hidden p-5">
        <div className="ambient-blob -right-20 -top-20 size-48 [--blob-blur:48px]" aria-hidden />
        <div className="relative">
          <h2 className="text-base font-semibold text-foreground">Tem ingresso sobrando?</h2>
          <p className="mt-1 text-body text-muted-foreground">Anuncie em um minuto direto dos seus ingressos. Vendeu, o dinheiro é seu.</p>
          <Button asChild variant="contrast" shape="pill" className="mt-4">
            <Link href="/meus-ingressos">
              Revender meu ingresso
              <Icon name="arrow-right" size={13} />
            </Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}
