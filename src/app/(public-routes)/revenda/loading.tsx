"use client";
import { ResaleCardSkeleton } from "@/components/ui/skeleton";

export default function RevendaLoading() {
  return (
    <div className="min-h-screen animate-fade-in">
      {/* Hero placeholder */}
      <div className="bg-gradient-to-br from-primary/10 via-primary-glow/5 to-background py-8 md:py-16">
        <div className="container px-4 mx-auto text-center space-y-4">
          <div className="h-10 w-64 rounded-xl bg-muted/70 animate-pulse mx-auto" />
          <div className="h-5 w-80 rounded-lg bg-muted/50 animate-pulse mx-auto" />
          <div className="h-12 w-full max-w-md rounded-lg bg-muted/50 animate-pulse mx-auto mt-4" />
        </div>
      </div>
      {/* Grid */}
      <div className="container py-8 px-4 mx-auto">
        <div className="h-6 w-48 rounded-md bg-muted/70 animate-pulse mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <ResaleCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
