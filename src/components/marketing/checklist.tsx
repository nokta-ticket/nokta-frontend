import { Icon } from "@/components/ui/icon";

/**
 * Lista de verificação das páginas de conteúdo (guias). Server component:
 * cada item vem no HTML. Use dentro de um ContentSection; o título do grupo
 * fica no H2 da seção, aqui só os itens.
 */
export function Checklist({ items }: { items: { title: string; text?: string }[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((it) => (
        <li key={it.title} className="flex gap-3 rounded-card border border-border bg-surface px-4 py-3.5 shadow-card">
          <Icon name="square-check" size={16} className="mt-0.5 shrink-0 text-brand" />
          <div className="min-w-0">
            <p className="text-[15px] font-semibold text-foreground">{it.title}</p>
            {it.text ? <p className="mt-0.5 text-body text-muted-foreground">{it.text}</p> : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
