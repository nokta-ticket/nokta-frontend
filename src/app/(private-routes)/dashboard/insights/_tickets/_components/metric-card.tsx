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
        <div className="flex items-center justify-between text-sm text-gray-600 font-medium">
          {title}
          {icon}
        </div>
        <div className="text-2xl font-semibold text-gray-900">{value}</div>
      </div>
    </Card>
  );
}
