import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";
import type { HomeChecklistGroup } from "@/services/platform";

/** Próximos passos concretos por área ativa — substitui o beco sem saída "Sua organização ainda não tem nada ativo". */
export function HomeChecklist({ groups }: { groups: HomeChecklistGroup[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {groups.map((group, gi) => {
        const done = group.items.filter((i) => i.done).length;
        return (
          <Card key={group.title} accent className="fade-up gap-0 p-0" style={{ ["--i" as string]: gi } as never}>
            <div className="flex items-center justify-between gap-3 px-5 pt-5">
              <h3 className="text-base font-semibold text-foreground">{group.title}</h3>
              <span className="text-caption text-muted-foreground tnum">
                {done}/{group.items.length}
              </span>
            </div>
            <ul className="mt-3 px-2 pb-3">
              {group.items.map((item) => (
                <li key={item.key}>
                  <Link href={item.route} className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors hover:bg-surface-2", item.done ? "text-subtle-foreground" : "text-foreground")}>
                    <span className={cn("flex size-5 shrink-0 items-center justify-center rounded-full border-2", item.done ? "border-success bg-success text-white" : "border-border-strong")}>{item.done ? <Icon name="check" size={9} /> : null}</span>
                    <span className={cn("min-w-0 flex-1 truncate", item.done && "line-through")}>{item.label}</span>
                    {!item.done ? <Icon name="chevron-right" size={10} className="text-subtle-foreground" /> : null}
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        );
      })}
    </div>
  );
}
