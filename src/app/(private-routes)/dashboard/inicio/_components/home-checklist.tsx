import Link from "next/link";
import { Check } from "lucide-react";
import type { HomeChecklistGroup } from "@/services/platform";

/** Substitui "Sua organização ainda não tem nada ativo" — próximos passos concretos por área ativa, em vez de um beco sem saída. */
export function HomeChecklist({ groups }: { groups: HomeChecklistGroup[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {groups.map((group) => (
        <div key={group.title} className="rounded-2xl border border-black/10 bg-white p-4">
          <p className="mb-3 text-sm font-semibold text-gray-900">{group.title}</p>
          <ul className="space-y-2">
            {group.items.map((item) => (
              <li key={item.key}>
                <Link
                  href={item.route}
                  className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors ${
                    item.done ? "text-black/40" : "text-gray-900 hover:bg-violet-50"
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                      item.done ? "border-emerald-500 bg-emerald-500 text-white" : "border-gray-300"
                    }`}
                  >
                    {item.done ? <Check size={12} /> : null}
                  </span>
                  <span className={item.done ? "line-through" : ""}>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
