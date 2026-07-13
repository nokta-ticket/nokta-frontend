import { redirect } from "next/navigation";

// Contexto default. Todo producer tem "tickets" hoje; se a org for só-venue,
// o ProductProvider corrige no client para /dashboard/venue/inicio.
export default function DashboardIndex() {
  redirect("/dashboard/tickets/inicio");
}
