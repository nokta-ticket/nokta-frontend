import type { ReactNode } from "react";
import { PageHeader } from "@/components/ui/page-header";

/** Página placeholder do esqueleto do dashboard — conteúdo real vem depois. */
export function Placeholder({ title, description, children }: { title: string; description?: string; children?: ReactNode }) {
  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title={title} description={description ?? "Seção em construção."} />
      {children}
    </div>
  );
}
