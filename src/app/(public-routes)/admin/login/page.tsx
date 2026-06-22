import { Suspense } from "react";
import { AdminLoginForm } from "./_components/admin-login-form";

export const metadata = {
  title: "Admin — Nokta Tickets",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#151619] px-4 py-8">
      <div className="w-full max-w-[420px]">
        <div className="rounded-2xl border border-white/10 bg-[#1C1D21] px-6 py-8 shadow-2xl">
          <div className="mb-6 text-center">
            <h1 className="text-xl font-bold text-white">Painel Nokta</h1>
            <p className="mt-1 text-sm text-white/50">
              Acesso restrito à equipe administrativa
            </p>
          </div>

          <Suspense
            fallback={
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-11 animate-pulse rounded-xl bg-white/5" />
                ))}
              </div>
            }
          >
            <AdminLoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
