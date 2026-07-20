import { redirect } from "next/navigation";

/** /dashboard vai direto para a Início unificada. */
export default function DashboardIndex() {
  redirect("/dashboard/inicio");
}
