import type { Metadata } from "next";
import { ForgotPasswordForm } from "./_components/forgot-password-form";

export const metadata: Metadata = { title: "Recuperar senha" };

export default function RecuperarSenhaPage() {
  return <ForgotPasswordForm />;
}
