import Link from "next/link";
import { Icon } from "@/components/ui/icon";

/**
 * Aviso obrigatório da agenda: a Nokta não vende esses ingressos e pode
 * receber comissão pelo link (transparência exigida pelos programas de
 * afiliados e pelo CDC).
 */
export function AgendaDisclosure({ className = "" }: { className?: string }) {
  return (
    <aside className={`flex gap-3 rounded-card border border-border bg-surface p-4 text-caption leading-relaxed text-muted-foreground ${className}`}>
      <Icon name="info" size={14} className="mt-0.5 shrink-0 text-brand" />
      <p>
        Os eventos da agenda são vendidos por outras plataformas. A compra, o pagamento, o ingresso e o atendimento ficam com o site oficial de cada evento. A Nokta pode receber uma comissão quando você compra pelo link, sem custo extra para você. Datas e preços vêm da fonte oficial e podem mudar. Produz eventos? <Link href="/para-produtores" className="font-semibold text-brand hover:underline">Venda pela Nokta</Link>.
      </p>
    </aside>
  );
}
