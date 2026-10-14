"use client";

import { useState } from "react";
import type { EventDetails } from "@/interfaces/events";
import { Card } from "@/components/ui/card";
import { Dialog, DialogBody, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Icon, type IconName } from "@/components/ui/icon";

type Policy = "meiaEntrada" | "cancelamento";

const POLICY_TITLE: Record<Policy, string> = { meiaEntrada: "Política de meia-entrada", cancelamento: "Política de cancelamento" };

function InfoRow({ icon, label, value, onClick }: { icon: IconName; label: string; value: string; onClick?: () => void }) {
  const inner = (
    <>
      <Icon name={icon} size={16} fw className="shrink-0 text-muted-foreground" />
      <span className="min-w-0 flex-1">
        <span className="block text-caption text-muted-foreground">{label}</span>
        <span className="block truncate text-sm font-semibold text-foreground">{value}</span>
      </span>
      {onClick ? <Icon name="chevron-right" size={12} className="shrink-0 text-subtle-foreground" /> : null}
    </>
  );
  const cls = "flex min-h-[56px] w-full items-center gap-3 px-4 py-3 text-left";
  return onClick ? (
    <button type="button" onClick={onClick} className={`${cls} transition-colors hover:bg-surface-2`}>
      {inner}
    </button>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

/** Classificação, meia-entrada e cancelamento (as políticas abrem num diálogo). */
export function EventPolicies({ evento }: { evento: EventDetails }) {
  const [policy, setPolicy] = useState<Policy | null>(null);
  if (!evento.classificacaoEtaria && !evento.politicaMeiaEntrada && !evento.politicaCancelamento) return null;

  return (
    <>
      <Card className="divide-y divide-border overflow-hidden">
        {evento.classificacaoEtaria ? <InfoRow icon="id-card" label="Classificação etária" value={evento.classificacaoEtaria} /> : null}
        {evento.politicaMeiaEntrada ? <InfoRow icon="tag" label="Meia-entrada" value="Ver quem tem direito" onClick={() => setPolicy("meiaEntrada")} /> : null}
        {evento.politicaCancelamento ? <InfoRow icon="undo" label="Cancelamento" value="Ver política do organizador" onClick={() => setPolicy("cancelamento")} /> : null}
      </Card>

      <Dialog open={policy !== null} onOpenChange={(o) => (!o ? setPolicy(null) : null)}>
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle>{policy ? POLICY_TITLE[policy] : ""}</DialogTitle>
          </DialogHeader>
          <DialogBody className="pt-0">
            <p className="whitespace-pre-line text-body leading-relaxed text-muted-foreground">{policy === "meiaEntrada" ? evento.politicaMeiaEntrada : evento.politicaCancelamento}</p>
          </DialogBody>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Canais do organizador: WhatsApp, Instagram e e-mail. */
export function EventContact({ evento }: { evento: EventDetails }) {
  const channels: { icon: IconName; label: string; value: string; href: string; external: boolean }[] = [];
  if (evento.whatsapp) channels.push({ icon: "whatsapp", label: "WhatsApp", value: "Chamar no WhatsApp", href: `https://wa.me/${evento.whatsapp.replace(/\D/g, "")}`, external: true });
  if (evento.instagram) channels.push({ icon: "instagram", label: "Instagram", value: `@${evento.instagram.replace("@", "")}`, href: `https://instagram.com/${evento.instagram.replace("@", "")}`, external: true });
  if (evento.email) channels.push({ icon: "mail", label: "E-mail", value: evento.email, href: `mailto:${evento.email}`, external: false });
  if (channels.length === 0) return null;

  return (
    <Card className="divide-y divide-border overflow-hidden">
      {channels.map((c) => (
        <a key={c.label} href={c.href} target={c.external ? "_blank" : undefined} rel={c.external ? "noreferrer" : undefined} className="flex min-h-[56px] items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-2">
          <Icon name={c.icon} size={18} fw className="shrink-0 text-foreground" />
          <span className="min-w-0 flex-1">
            <span className="block text-caption text-muted-foreground">{c.label}</span>
            <span className="block truncate text-sm font-semibold text-foreground">{c.value}</span>
          </span>
          <Icon name="external" size={12} className="shrink-0 text-subtle-foreground" />
        </a>
      ))}
    </Card>
  );
}
