"use client";

import { useParams } from "next/navigation";
import { RouteRedirect } from "@/app/(private-routes)/dashboard/_components/route-redirect";

/** Compatibilidade — o editor de evento mora em /dashboard/eventos/[id] (Fase 5). */
export default function ProdutorEventoEditorLegacyPage() {
  const { id } = useParams<{ id: string }>();
  return <RouteRedirect to={`/dashboard/eventos/${id}`} />;
}
