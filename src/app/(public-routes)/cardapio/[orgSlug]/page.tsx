"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { UtensilsCrossed } from "lucide-react";
import { getVisitorToken, venueMenuPublicApi, type PublicMenuResponse } from "@/services/venue-menu-public";
import { PublicMenuView } from "./_components/public-menu-view";

export default function CardapioPublicoPage() {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const [data, setData] = useState<PublicMenuResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!orgSlug) return;
    venueMenuPublicApi
      .getByOrgSlug(orgSlug, getVisitorToken())
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
      <main className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#e9e9ec] text-sm text-muted-foreground">
        Carregando cardápio…
      </main>
    );
  }

  if (notFound || !data) {
    return (
      <main className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 overflow-y-auto bg-[#e9e9ec] px-6 text-center">
        <UtensilsCrossed size={40} className="text-black/20" />
        <h1 className="font-poppins text-xl font-semibold text-foreground">Cardápio ainda não disponível</h1>
        <p className="max-w-xs text-sm text-muted-foreground">
          Este estabelecimento ainda não publicou um cardápio público.
        </p>
      </main>
    );
  }

  return (
    <main className="fixed inset-0 z-50 overflow-y-auto">
      <PublicMenuView initialData={data} orgSlug={orgSlug} />
    </main>
  );
}
