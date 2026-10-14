"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api, { getErrorMessage } from "@/lib/axios";

// Link curto da lista VIP (o que o produtor põe no story). Leva para a
// página do evento, onde o VIP é retirado (VipClaimCard, `?vip=<token>`).

interface VipListResponse {
  evento: { id: number; slug: string | null };
}

export default function VipListRedirectPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    api
      .get<VipListResponse>(`/lista-vip/${token}`)
      .then((res) => {
        if (!active) return;
        const { slug, id } = res.data.evento;
        router.replace(`/evento/${slug ?? id}?vip=${token}`);
      })
      .catch((err) => {
        if (active) setError(getErrorMessage(err, "Este link de lista VIP não é válido."));
      });
    return () => {
      active = false;
    };
  }, [token, router]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      {error ? (
        <div className="max-w-sm text-center">
          <h1 className="text-lg font-semibold text-gray-900">Lista VIP indisponível</h1>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
          <Link href="/eventos" className="mt-4 inline-block text-sm font-semibold text-primary">
            Ver eventos
          </Link>
        </div>
      ) : (
        <p className="text-sm text-gray-500">Abrindo o evento…</p>
      )}
    </div>
  );
}
