import { Leaf, Loader2 } from "lucide-react";

interface AdminLoadingStateProps {
  title: string;
  subtitle?: string;
}

export const AdminLoadingState = ({ title, subtitle }: AdminLoadingStateProps) => {
  return (
    <div className="relative overflow-hidden glass-card rounded-2xl border border-border p-8 md:p-10">
      <div className="pointer-events-none absolute inset-0 opacity-60" aria-hidden>
        <div className="absolute -top-20 -left-16 h-44 w-44 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-20 -right-16 h-48 w-48 rounded-full bg-secondary/15 blur-3xl" />
      </div>

      <div className="relative flex flex-col items-center text-center gap-5 animate-fade-in">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-semibold tracking-wide text-primary">
          <Leaf className="h-3.5 w-3.5" />
          Smart Campus Admin
        </div>

        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-card border border-border shadow-sm">
          <Loader2 className="h-7 w-7 text-primary animate-spin" />
        </div>

        <div className="space-y-1.5">
          <p className="text-lg font-semibold text-foreground">{title}</p>
          <p className="text-sm text-muted-foreground">{subtitle || "Fetching the latest campus data and preparing your dashboard."}</p>
        </div>

        <div className="w-full max-w-lg space-y-2">
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full w-1/2 rounded-full bg-primary/80 animate-pulse" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="h-8 rounded-lg bg-muted/80 animate-pulse" />
            <div className="h-8 rounded-lg bg-muted/80 animate-pulse" />
            <div className="h-8 rounded-lg bg-muted/80 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
};
