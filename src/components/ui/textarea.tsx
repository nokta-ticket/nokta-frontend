import * as React from "react";
import { cn } from "@/lib/cn";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-24 w-full rounded-input border border-border bg-surface-2 px-3.5 py-2.5 text-[15px] text-foreground outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-subtle-foreground focus:border-transparent focus:ring-2 focus:ring-brand disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-danger aria-invalid:ring-2 aria-invalid:ring-danger-ring md:text-sm",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
