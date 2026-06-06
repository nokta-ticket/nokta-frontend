"use client";
import { EventCardSkeleton } from "@/components/ui/skeleton";

export default function EventosLoading() {
  return (
    <section className="mx-auto mt-8 w-full max-w-[1300px] px-4 sm:px-6 lg:px-8 animate-fade-in">
      <div className="mb-6 flex items-center justify-between">
        <div className="h-7 w-44 rounded-md bg-muted/70 animate-pulse" />
        <div className="h-9 w-52 rounded-lg bg-muted/70 animate-pulse hidden md:block" />
      </div>
      <div className="flex flex-wrap gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <EventCardSkeleton key={i} />
        ))}
      </div>
    </section>
  );
}
