import type { Metadata } from "next";
import { AuthModalPresentation } from "@/components/shell/auth-shell";
import { RegisterSurface } from "@/app/(public-routes)/register/_components/register-surface";

export const metadata: Metadata = { title: "Criar conta" };

/** `/register` aberto a partir de outra página do site: card sobre a página atual. */
export default function RegisterModalPage() {
  return (
    <AuthModalPresentation>
      <RegisterSurface />
    </AuthModalPresentation>
  );
}
