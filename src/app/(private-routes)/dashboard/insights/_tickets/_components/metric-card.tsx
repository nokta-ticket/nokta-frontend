import { Card } from "@/components/ui/card";
import clsx from "clsx";

export default function MetricCard({
  title,
  value,
  icon,
  borderColor = "border-gray-300",
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  borderColor?: string;
}) {
  return (
    <Card
      className={clsx(
        "rounded-xl bg-white p-4 border-l-4 border-gray-700 shadow-sm",
        borderColor
      )}
    >
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-2 text-[13px] text-gray-600 font-medium sm:text-sm">
          {title}
          {icon}
        </div>
        <div className="text-[19px] leading-tight font-semibold tabular-nums text-gray-900 sm:text-2xl">{value}</div>
      </div>
    </Card>
  );
}
