import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthFormFallback, AuthScreen } from "@/components/auth/auth-screen";
import { AdminLoginForm } from "./_components/admin-login-form";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <AuthScreen title="Painel Nokta" subtitle="Acesso restrito à equipe administrativa.">
      <Suspense fallback={<AuthFormFallback rows={3} />}>
        <AdminLoginForm />
      </Suspense>
    </AuthScreen>
  );
}
