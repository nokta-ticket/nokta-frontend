import { ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type PageStateProps = {
  title: string;
  description: string;
  icon?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
};

export function PageState({
  title,
  description,
  icon,
  actionLabel,
  onAction,
}: PageStateProps) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border px-6 py-12 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        {icon ?? <AlertCircle className="h-8 w-8 text-muted-foreground" />}
      </div>
      <div className="space-y-1">
        <p className="text-lg font-semibold">{title}</p>
        <p className="max-w-md text-sm text-muted-foreground">{description}</p>
      </div>
      {actionLabel && onAction ? (
        <Button variant="outline" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
