"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import api, { getErrorMessage } from "@/lib/axios";
import EventoPageClient from "../../../evento/[id]/_components/EventoPageClient";

// Confere o endereço antes de abrir a página do evento: os primeiros links
// usavam o código da lista, e um evento renomeado muda de endereço. Nos dois
// casos a URL é trocada para /vip/<endereço atual do evento>.
export function VipEntry() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [state, setState] = useState<"checking" | "ready" | "error">("checking");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    setState("checking");
    api
      .get<{ evento: { id: number; slug: string | null } }>(`/lista-vip/${encodeURIComponent(id)}`)
      .then((res) => {
        if (!active) return;
        const current = String(res.data.evento.slug ?? res.data.evento.id);
        if (current !== id) router.replace(`/vip/${current}`);
        else setState("ready");
      })
      .catch((err) => {
        if (!active) return;
        setMessage(getErrorMessage(err, "Este link de lista VIP não é válido."));
        setState("error");
      });
    return () => {
      active = false;
    };
  }, [id, router]);

  if (state === "ready") return <EventoPageClient />;

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      {state === "error" ? (
        <div className="max-w-sm text-center">
          <h1 className="text-lg font-semibold text-gray-900">Lista VIP indisponível</h1>
          <p className="mt-1 text-sm text-gray-500">{message}</p>
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
