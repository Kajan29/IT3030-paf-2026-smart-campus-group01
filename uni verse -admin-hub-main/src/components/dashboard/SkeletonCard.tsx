import { cn } from "@/lib/utils";

const Shimmer = ({ className }: { className?: string }) => (
  <div
    className={cn(
      "rounded-lg bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-shimmer",
      className
    )}
  />
);

export const SkeletonStatCard = () => (
  <div className="bg-card rounded-2xl p-5 shadow-card border border-border">
    <div className="flex items-start justify-between mb-4">
      <div className="space-y-2 flex-1">
        <Shimmer className="h-4 w-28" />
        <Shimmer className="h-8 w-20" />
      </div>
      <Shimmer className="w-12 h-12 rounded-2xl" />
    </div>
    <Shimmer className="h-5 w-24 rounded-full" />
  </div>
);

export const SkeletonTable = () => (
  <div className="bg-card rounded-2xl shadow-card border border-border p-5 space-y-4">
    <div className="flex justify-between">
      <Shimmer className="h-5 w-32" />
      <Shimmer className="h-8 w-48 rounded-xl" />
    </div>
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="flex items-center gap-4">
        <Shimmer className="w-9 h-9 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-1.5">
          <Shimmer className="h-4 w-36" />
          <Shimmer className="h-3 w-24" />
        </div>
        <Shimmer className="h-5 w-16 rounded-full" />
        <Shimmer className="h-5 w-14 rounded-full" />
      </div>
    ))}
  </div>
);
