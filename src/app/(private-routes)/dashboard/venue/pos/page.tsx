import { redirect } from "next/navigation";

// Rota antiga renomeada para "Operação". Mantido apenas como redirecionamento
// para não quebrar favoritos ou links antigos que apontem para /venue/pos.
export default function VenuePosRedirect() {
  redirect("/dashboard/venue/operacao");
}
