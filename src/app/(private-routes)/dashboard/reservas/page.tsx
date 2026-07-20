import { RouteRedirect } from "../_components/route-redirect";

/** Rota canônica de Reservas — reaproveita /dashboard/venue/reservas (inclui a aba Fila de espera). */
export default function ReservasPage() {
  return <RouteRedirect to="/dashboard/venue/reservas" />;
}
