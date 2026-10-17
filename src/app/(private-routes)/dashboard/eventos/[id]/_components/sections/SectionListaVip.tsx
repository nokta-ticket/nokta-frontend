"use client";

import { VipListsSection } from "@/app/(private-routes)/dashboard/convidados/_components/vip-lists-section";
import type { SectionProps } from "../types";

/**
 * Lista VIP dentro do editor do evento: a mesma seção da tela de Convidados
 * (criar, editar total e prazo, pausar, ver quem colocou o nome). Assim o
 * admin — que edita pelo mesmo editor, sem acesso à tela de Convidados do
 * workspace — também gerencia a lista; a API já libera SUPER_ADMIN nessas
 * rotas (ProducerController.effectiveUserId).
 */
export default function SectionListaVip({ event }: SectionProps) {
  return <VipListsSection eventId={event.id} eventDate={event.data} />;
}
