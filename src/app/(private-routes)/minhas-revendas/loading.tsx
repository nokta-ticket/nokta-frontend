"use client";
import { ResaleCardSkeleton } from "@/components/ui/skeleton";

export default function MinhasRevendasLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 animate-fade-in space-y-6">
      <div className="h-7 w-48 rounded-md bg-muted/70 animate-pulse" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <ResaleCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
