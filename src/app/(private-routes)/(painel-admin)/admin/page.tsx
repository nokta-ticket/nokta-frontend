import { redirect } from "next/navigation";

/** `/admin` não tem tela própria — a porta de entrada do painel é o dashboard. */
export default function AdminIndexPage() {
  redirect("/admin/dashboard");
}
