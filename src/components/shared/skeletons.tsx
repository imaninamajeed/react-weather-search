import { Skeleton } from "@/components/ui/skeleton";

export function HeroSkeleton() {
  return (
    <div aria-hidden="true" className="rounded-4xl border border-border bg-card p-6 md:p-10">
      <Skeleton className="h-3 w-40" />
      <Skeleton className="mt-4 h-14 w-2/3 max-w-md" />
      <Skeleton className="mt-3 h-4 w-48" />
      <Skeleton className="mt-8 h-5 w-full max-w-md" />
    </div>
  );
}

export function ChartSkeleton() {
  return <Skeleton aria-hidden="true" className="h-64 w-full" />;
}

export function RowsSkeleton({ rows = 7 }: { rows?: number }) {
  return (
    <div aria-hidden="true" className="space-y-3">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-9 w-full" />
      ))}
    </div>
  );
}

export function TileSkeleton() {
  return <Skeleton aria-hidden="true" className="h-32 w-full" />;
}

export function PlaceSkeleton() {
  return (
    <div role="status" aria-label="Loading forecast" className="space-y-10">
      <HeroSkeleton />
      <ChartSkeleton />
      <RowsSkeleton />
    </div>
  );
}
