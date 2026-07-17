import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";

export function HomeMetricCard({ label, value, icon, tone }: { label: string; value: ReactNode; icon?: ReactNode; tone?: "warning" | "danger" }) {
  const valueTone = tone === "danger" ? "text-red-600" : tone === "warning" ? "text-amber-600" : "text-gray-900";
  return (
    <Card className="rounded-xl bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between text-sm font-medium text-black/60">
        <span>{label}</span>
        {icon}
      </div>
      <div className={`mt-2 text-3xl font-semibold ${valueTone}`}>{value}</div>
    </Card>
  );
}
