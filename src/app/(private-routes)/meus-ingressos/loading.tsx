"use client";
import { TicketCardSkeleton } from "@/components/ui/skeleton";

export default function MeusIngressosLoading() {
  return (
    <div className="min-h-screen bg-background animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-4 pt-8 pb-16">
        <div className="max-w-2xl mx-auto space-y-2">
          <div className="h-7 w-48 rounded-xl bg-white/20 animate-pulse" />
          <div className="h-4 w-36 rounded-lg bg-white/15 animate-pulse" />
        </div>
      </div>
      {/* Stats strip */}
      <div className="max-w-2xl mx-auto px-4 -mt-8">
        <div className="rounded-2xl border bg-card shadow-lg p-4 flex gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex-1 space-y-1">
              <div className="h-6 w-8 rounded animate-pulse bg-muted/70 mx-auto" />
              <div className="h-3 w-14 rounded animate-pulse bg-muted/50 mx-auto" />
            </div>
          ))}
        </div>
      </div>
      {/* Cards */}
      <div className="max-w-2xl mx-auto px-4 mt-6 space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <TicketCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
