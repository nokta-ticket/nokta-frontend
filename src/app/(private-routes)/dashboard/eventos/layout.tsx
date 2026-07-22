import type { ReactNode } from "react";
import { EventoProvider } from "@/context/EventoContext";

/** Estado do wizard de criação de evento (`/dashboard/eventos/criar`) — ver EventoContext. */
export default function EventosLayout({ children }: { children: ReactNode }) {
  return <EventoProvider>{children}</EventoProvider>;
}
