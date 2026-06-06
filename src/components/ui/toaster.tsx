"use client";

import { useEffect, useState, useCallback } from "react";
import { X, CheckCircle2, XCircle, AlertCircle, Info } from "lucide-react";
import { subscribe, dismiss, ToastItem, ToastType } from "@/lib/toast";

const CONFIG: Record<
  ToastType,
  {
    icon: React.ElementType;
    borderColor: string;
    iconColor: string;
    progressColor: string;
  }
> = {
  success: {
    icon: CheckCircle2,
    borderColor: "border-l-emerald-500",
    iconColor: "text-emerald-500",
    progressColor: "bg-emerald-500",
  },
  error: {
    icon: XCircle,
    borderColor: "border-l-red-500",
    iconColor: "text-red-500",
    progressColor: "bg-red-500",
  },
  warning: {
    icon: AlertCircle,
    borderColor: "border-l-amber-500",
    iconColor: "text-amber-500",
    progressColor: "bg-amber-500",
  },
  info: {
    icon: Info,
    borderColor: "border-l-blue-500",
    iconColor: "text-blue-500",
    progressColor: "bg-blue-500",
  },
};

function ToastCard({ item }: { item: ToastItem }) {
  const cfg = CONFIG[item.type];
  const Icon = cfg.icon;
  const [exiting, setExiting] = useState(false);

  const handleDismiss = useCallback(() => {
    setExiting(true);
    setTimeout(() => dismiss(item.id), 320);
  }, [item.id]);

  useEffect(() => {
    const timer = setTimeout(handleDismiss, item.duration);
    return () => clearTimeout(timer);
  }, [handleDismiss, item.duration]);

  return (
    <div
      style={{
        animation: exiting
          ? "toast-out 0.32s cubic-bezier(0.4, 0, 1, 1) forwards"
          : "toast-in 0.4s cubic-bezier(0.34, 1.4, 0.64, 1) forwards",
      }}
      className={`relative flex items-start gap-3 w-full rounded-xl border-l-4 ${cfg.borderColor} bg-white px-4 py-3.5 shadow-2xl ring-1 ring-black/[0.06] overflow-hidden`}
    >
      <Icon size={17} className={`${cfg.iconColor} mt-0.5 shrink-0`} />
      <p className="flex-1 text-sm font-medium text-gray-800 leading-snug pr-1">
        {item.message}
      </p>
      <button
        onClick={handleDismiss}
        className="cursor-pointer text-gray-300 hover:text-gray-500 transition-colors shrink-0 mt-0.5"
        aria-label="Fechar"
      >
        <X size={13} strokeWidth={2.5} />
      </button>

      {/* Progress bar */}
      <div
        className={`absolute bottom-0 left-0 h-[2px] ${cfg.progressColor} opacity-60`}
        style={{
          animation: `toast-progress ${item.duration}ms linear forwards`,
        }}
      />
    </div>
  );
}

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    const unsub = subscribe(setItems);
    return () => { unsub(); };
  }, []);

  if (items.length === 0) return null;

  return (
    <div
      className="fixed bottom-5 right-5 z-[9999] flex flex-col-reverse gap-2.5 items-end pointer-events-none"
      aria-live="polite"
      aria-atomic="false"
    >
      {items.slice(-5).map((item) => (
        <div key={item.id} className="pointer-events-auto w-full max-w-[360px]">
          <ToastCard item={item} />
        </div>
      ))}
    </div>
  );
}
