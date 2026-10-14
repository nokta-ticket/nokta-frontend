import type { Metadata } from "next";
import { AuthModalPresentation } from "@/components/shell/auth-shell";
import { ForgotPasswordForm } from "@/app/(public-routes)/recuperar-senha/_components/forgot-password-form";

export const metadata: Metadata = { title: "Recuperar senha", robots: { index: false, follow: false } };

/** `/recuperar-senha` aberta a partir de outra página do site: card sobre a página atual. */
export default function ForgotPasswordModalPage() {
  return (
    <AuthModalPresentation>
      <ForgotPasswordForm />
    </AuthModalPresentation>
  );
}
