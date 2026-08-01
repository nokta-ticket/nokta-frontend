"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { UtensilsCrossed } from "lucide-react";
import { venueMenuPublicApi, formatCentsBRL, type PublicMenuResponse } from "@/services/venue-menu-public";

export default function CardapioPublicoPage() {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const [data, setData] = useState<PublicMenuResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!orgSlug) return;
    venueMenuPublicApi
      .getByOrgSlug(orgSlug)
      .then(setData)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [orgSlug]);

  // A página pública nunca deve mostrar o header/footer do site de
  // ingressos (herdados do Root Layout, compartilhado pelas 3 superfícies —
  // ver comentário em app/layout.tsx) — mesmo padrão de cobertura "fixed
  // inset-0 z-50" já usado pela landing institucional.
  if (loading) {
    return (
      <main className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#faf9fd] text-sm text-muted-foreground">
        Carregando cardápio…
      </main>
    );
  }

  if (notFound || !data) {
    return (
      <main className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 overflow-y-auto bg-[#faf9fd] px-6 text-center">
        <UtensilsCrossed size={40} className="text-black/20" />
        <h1 className="font-poppins text-xl font-semibold text-foreground">Cardápio ainda não disponível</h1>
        <p className="max-w-xs text-sm text-muted-foreground">
          Este estabelecimento ainda não publicou um cardápio público.
        </p>
      </main>
    );
  }

  const hasAnyItem = data.menu.categories.some((c) => c.items.length > 0);

  return (
    <main className="fixed inset-0 z-50 overflow-y-auto bg-[#faf9fd] pb-16">
      <header className="bg-gradient-to-br from-[#1d1834] via-[#191530] to-[#141020] px-5 py-8 text-white">
        <p className="text-xs font-medium uppercase tracking-wide text-white/50">Cardápio</p>
        <h1 className="mt-1 font-poppins text-2xl font-bold tracking-tight">{data.organizationName}</h1>
        {data.menu.descricao ? <p className="mt-2 text-sm text-white/70">{data.menu.descricao}</p> : null}
      </header>

      <div className="mx-auto max-w-2xl px-5 py-6">
        {!hasAnyItem ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Nenhum item disponível no momento.</p>
        ) : (
          <div className="space-y-8">
            {data.menu.categories.map((category) => (
              <section key={category.id}>
                <h2 className="mb-3 font-poppins text-lg font-semibold text-foreground">{category.nome}</h2>
                {category.descricao ? <p className="mb-3 text-sm text-muted-foreground">{category.descricao}</p> : null}
                <div className="space-y-3">
                  {category.items.map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-center gap-3 rounded-2xl bg-white p-3 shadow-[0_1px_2px_rgba(28,24,48,0.05),0_2px_6px_rgba(28,24,48,0.04)] ${
                        item.available ? "" : "opacity-60"
                      }`}
                    >
                      {item.imageUrl ? (
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-black/5">
                          <Image src={item.imageUrl} alt={item.nome} fill className="object-cover" unoptimized />
                        </div>
                      ) : null}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-semibold text-gray-900">{item.nome}</p>
                          {!item.available ? (
                            <span className="shrink-0 rounded-full bg-black/5 px-2 py-0.5 text-[10px] font-medium text-black/50">Esgotado</span>
                          ) : null}
                        </div>
                        {item.descricao ? <p className="mt-0.5 truncate text-xs text-muted-foreground">{item.descricao}</p> : null}
                      </div>
                      {item.prices.length > 0 ? (
                        <p className="shrink-0 text-sm font-semibold text-violet-600">
                          {item.prices.length === 1
                            ? formatCentsBRL(item.prices[0].effectivePriceCents)
                            : `a partir de ${formatCentsBRL(Math.min(...item.prices.map((p) => p.effectivePriceCents)))}`}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
