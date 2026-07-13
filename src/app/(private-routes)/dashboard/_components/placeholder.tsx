import type { ReactNode } from "react";

/** Página placeholder do esqueleto do dashboard — conteúdo real vem depois. */
export function Placeholder({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="mt-2 text-black/60">
        {description ?? "Seção em construção."}
      </p>
      {children ? <div className="mt-6">{children}</div> : null}
    </div>
  );
}
