import type { Metadata } from "next";
import { AuthModalPresentation } from "@/components/shell/auth-shell";
import { LoginSurface } from "@/app/(public-routes)/login/_components/login-surface";

export const metadata: Metadata = { title: "Entrar" };

/** `/login` aberto a partir de outra página do site: card sobre a página atual. */
export default function LoginModalPage() {
  return (
    <AuthModalPresentation>
      <LoginSurface />
    </AuthModalPresentation>
  );
}
