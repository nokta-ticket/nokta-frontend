"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import api, { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { COMPANY } from "@/lib/company";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Callout } from "@/components/ui/callout";
import { FaqList } from "@/components/ui/faq";
import { Field } from "@/components/ui/field";
import { Icon, type IconName } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";

/**
 * Central de ajuda (/ajuda). Categorias levam direto pra onde o problema se
 * resolve; a FAQ é revisada contra o comportamento real do backend:
 * - Pagamento: só Pix e cartão de crédito parcelado — nunca débito.
 * - Entrega: e-mail confirma a COMPRA; o QR do ingresso só vai por WhatsApp,
 *   perto do evento — nunca por e-mail.
 * - Transferência: regra geral do sistema (1 transferência grátis por
 *   ingresso, destinatário com conta ativa, bloqueada perto do evento).
 * - Reembolso: 7 dias corridos da confirmação do pagamento, condicionado a
 *   ingresso não usado/transferido/revendido (politica-de-cancelamento).
 */
const CATEGORIES: { icon: IconName; title: string; text: string; href: string }[] = [
  { icon: "ticket", title: "Meus ingressos", text: "Onde está o ingresso, QR pelo WhatsApp, transferência pra outra pessoa.", href: "/meus-ingressos" },
  { icon: "credit-card", title: "Pagamento e reembolso", text: "Pix, cartão parcelado e a regra dos 7 dias de arrependimento.", href: "/politica-de-cancelamento" },
  { icon: "user", title: "Minha conta", text: "Dados, telefone verificado e login com Google ou Apple.", href: "/perfil" },
  { icon: "megaphone", title: "Sou produtor", text: "Criar evento, lotes, portaria e repasse do saldo.", href: "/para-produtores" },
];

const FAQ_ITEMS = [
  { q: "Como comprar ingressos na Nokta Tickets?", a: "Escolha o evento, selecione os ingressos, informe seus dados e finalize o pagamento por Pix ou cartão de crédito. Você recebe um e-mail confirmando a compra, e o ingresso fica disponível a qualquer momento em “Meus ingressos”, dentro da sua conta." },
  { q: "Quais as formas de pagamento aceitas?", a: "Pix (aprovação quase imediata) e cartão de crédito, com opção de parcelamento conforme as taxas exibidas no checkout. Não trabalhamos com cartão de débito." },
  { q: "Como e quando eu recebo meu ingresso?", a: "O ingresso já fica disponível em “Meus ingressos” assim que o pagamento é confirmado. O QR Code de entrada é enviado por WhatsApp perto da data do evento — não por e-mail — pro número verificado na sua conta, por isso é importante manter telefone e verificação em dia." },
  { q: "Posso transferir meu ingresso pra outra pessoa?", a: "Sim. Cada ingresso pode ser transferido gratuitamente uma vez, direto em “Meus ingressos”, pro e-mail de outra conta já cadastrada e ativa na Nokta. A transferência fica indisponível perto do horário do evento e não é possível depois que o ingresso já foi utilizado." },
  { q: "O que fazer se eu não encontrar meu ingresso?", a: "Acesse “Meus ingressos” com a conta usada na compra — é sempre a fonte mais atualizada. Confira também se o QR chegou no WhatsApp do número verificado da conta. Se ainda assim não encontrar, fala com a gente pelo formulário abaixo." },
  { q: "Como solicitar reembolso ou cancelamento?", a: "Você pode cancelar e pedir reembolso total em até 7 dias corridos após a confirmação do pagamento, desde que o ingresso ainda não tenha sido utilizado, transferido ou revendido — sem precisar justificar o motivo. Depois desse prazo, só há reembolso se o evento for cancelado ou em caso de erro do produtor." },
];

const ASSUNTOS = [
  { value: "compra_ingressos", label: "Compra de ingressos" },
  { value: "pagamento_estorno", label: "Pagamento e estorno" },
  { value: "minha_conta", label: "Minha conta" },
  { value: "sou_produtor", label: "Sou produtor" },
  { value: "outro", label: "Outro assunto" },
] as const;

export default function CentralDeAjuda() {
  return (
    <div className="pb-8">
      <section className="relative overflow-hidden" aria-labelledby="ajuda-title">
        <div className="absolute inset-0 bg-[radial-gradient(700px_circle_at_90%_-20%,color-mix(in_oklab,var(--brand)_32%,transparent),transparent_60%)]" aria-hidden />
        <div className="hero-fade absolute inset-0" aria-hidden />
        <div className="relative mx-auto max-w-7xl px-4 pb-8 pt-8 lg:px-6 lg:pb-12 lg:pt-14">
          <h1 id="ajuda-title" className="slide-up text-balance font-display text-[2.5rem] uppercase leading-[0.95] text-white lg:text-[3.5rem]">
            Central de ajuda
          </h1>
          <p className="slide-up [--i:1] mt-3 max-w-md text-pretty text-base text-white/75">Encontre a resposta ou fala com a gente — respondemos em até 24 horas úteis.</p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 lg:px-6">
        <section aria-label="Assuntos" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORIES.map((c, i) => (
            <Link key={c.title} href={c.href} className="fade-up card-hover press block rounded-card border border-border bg-surface p-5 shadow-card" style={{ ["--i" as string]: i } as never}>
              <Icon name={c.icon} size={20} className="text-brand" />
              <p className="mt-3 text-[15px] font-semibold text-foreground">{c.title}</p>
              <p className="mt-1 text-body text-muted-foreground">{c.text}</p>
            </Link>
          ))}
        </section>

        <div className="mt-10 grid gap-8 lg:mt-14 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start">
          <section aria-labelledby="ajuda-faq">
            <h2 id="ajuda-faq" className="text-title font-semibold tracking-tight text-foreground">
              Dúvidas frequentes
            </h2>
            <FaqList items={FAQ_ITEMS} name="ajuda-faq" className="mt-4" />
            <PedidoFaixa />
            <p className="mt-4 text-center text-sm">
              <Link href="/termos" className="font-semibold text-brand underline-offset-4 hover:underline">
                Ver termos e políticas completos
              </Link>
            </p>
          </section>

          <FaleConosco />
        </div>
      </div>
    </div>
  );
}

function PedidoFaixa() {
  const { isAuthenticated, isAuthResolved } = useAuth();
  // Deslogado: "Ver meus pedidos" tem que levar pro login (com redirect de
  // volta pra /meus-ingressos), nunca cair na home sem sessão.
  const href = !isAuthResolved || isAuthenticated ? "/meus-ingressos" : `/login?redirect=${encodeURIComponent("/meus-ingressos")}`;

  return (
    <Callout
      tone="info"
      icon="question"
      title="Teve um problema com seu pedido?"
      className="mt-5"
      action={
        <Button asChild variant="outline" size="sm" shape="pill">
          <Link href={href}>Ver meus pedidos</Link>
        </Button>
      }
    >
      Acesse “Meus ingressos” com a conta usada na compra pra ver todos os detalhes do pedido.
    </Callout>
  );
}

function FaleConosco() {
  const [assunto, setAssunto] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    if (!assunto) {
      toast.error("Selecione um assunto.");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/support-contact", { assunto, mensagem, email });
      toast.success("Mensagem enviada! Vamos te responder em breve.");
      setAssunto("");
      setMensagem("");
      setEmail("");
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível enviar sua mensagem. Tenta de novo."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card accent id="contato" className="scroll-mt-24">
      <CardHeader>
        <div>
          <CardTitle className="text-title">Fala com a gente</CardTitle>
          <CardDescription>Manda sua mensagem que a equipe responde o mais rápido possível.</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Seu e-mail" htmlFor="ajuda-email" required>
            <Input id="ajuda-email" type="email" leftIcon="mail" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" disabled={submitting} autoComplete="email" />
          </Field>
          <Field label="Assunto" htmlFor="ajuda-assunto" required>
            <NativeSelect id="ajuda-assunto" required value={assunto} onChange={(e) => setAssunto(e.target.value)} disabled={submitting}>
              <option value="" disabled>
                Selecione um assunto
              </option>
              {ASSUNTOS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Mensagem" htmlFor="ajuda-mensagem" required hint={`${mensagem.length}/1000`}>
            <Textarea id="ajuda-mensagem" required maxLength={1000} value={mensagem} onChange={(e) => setMensagem(e.target.value)} disabled={submitting} placeholder="Descreva sua dúvida ou problema" className="min-h-32" />
          </Field>
          <Button type="submit" size="full" shape="pill" loading={submitting} leftIcon="send">
            Enviar mensagem
          </Button>
        </form>
        <div className="mt-5 space-y-1.5 text-center text-caption text-muted-foreground">
          <p className="inline-flex items-center gap-1.5">
            <Icon name="clock" size={12} />
            Tempo médio de resposta: até 24h úteis
          </p>
          <p>
            Ou escreva direto pra{" "}
            <a href={`mailto:${COMPANY.emails.support}`} className="font-semibold text-brand underline-offset-4 hover:underline">
              {COMPANY.emails.support}
            </a>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
