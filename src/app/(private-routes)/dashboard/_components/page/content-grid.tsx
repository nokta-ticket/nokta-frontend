import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Grid responsivo consistente (1 col no mobile → 2/3/4 no desktop). */
export function ContentGrid({
  children,
  className,
  cols = 4,
}: {
  children: ReactNode;
  className?: string;
  cols?: 2 | 3 | 4;
}) {
  const colClass =
    cols === 2
      ? "sm:grid-cols-2"
      : cols === 3
        ? "sm:grid-cols-2 lg:grid-cols-3"
        : "sm:grid-cols-2 lg:grid-cols-4";

  return (
    <div className={cn("grid grid-cols-1 gap-4", colClass, className)}>
      {children}
    </div>
  );
}
