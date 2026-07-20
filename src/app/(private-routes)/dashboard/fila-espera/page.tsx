import { RouteRedirect } from "../_components/route-redirect";

/** Alias canônico — Fila de espera é a aba "fila" dentro de Reservas, não uma página própria. */
export default function FilaEsperaPage() {
  return <RouteRedirect to="/dashboard/venue/reservas?tab=fila" />;
}
