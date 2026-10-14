"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import api, { getErrorMessage } from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import EventoPageClient from "../../../evento/[id]/_components/EventoPageClient";
import { EventoSkeleton } from "../../../evento/[id]/_components/evento-skeleton";

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

  if (state === "error") {
    return (
      <div className="mx-auto w-full max-w-md px-4 py-16">
        <EmptyState
          icon="crown"
          title="Lista VIP indisponível"
          description={message}
          action={
            <Button asChild variant="contrast" shape="pill">
              <Link href="/eventos">Ver eventos</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return <EventoSkeleton />;
}
