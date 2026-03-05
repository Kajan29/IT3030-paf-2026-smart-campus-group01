import {
  Users,
  Calendar,
  Star,
  Trophy,
  FileImage,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { mockStats } from "@/data/mockData";

const iconMap: Record<string, LucideIcon> = {
  Users,
  Calendar,
  Star,
  Trophy,
  FileImage,
  AlertTriangle,
};

export const StatsCards = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {mockStats.map((stat, index) => {
        const Icon = iconMap[stat.icon];
        const isPositive = stat.growth >= 0;
        return (
          <div
            key={stat.id}
            className="bg-card rounded-2xl p-5 shadow-card hover:shadow-card-hover border border-border transition-all duration-300 hover:-translate-y-1 group animate-fade-in cursor-pointer"
            style={{ animationDelay: `${index * 80}ms` }}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground font-medium">{stat.title}</p>
                <p className="text-3xl font-bold text-foreground mt-1 tabular-nums">
                  {stat.value.toLocaleString()}
                </p>
              </div>
              <div
                className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md",
                  "group-hover:scale-110 transition-transform duration-300",
                  stat.gradient
                )}
              >
                {Icon && <Icon size={22} className="text-white" />}
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <div
                className={cn(
                  "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold",
                  isPositive
                    ? "bg-success/10 text-success"
                    : "bg-destructive/10 text-destructive"
                )}
              >
                {isPositive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                {isPositive ? "+" : ""}{stat.growth}%
              </div>
              <span className="text-xs text-muted-foreground">vs last month</span>
            </div>

            {/* Subtle bottom accent bar */}
            <div
              className={cn(
                "absolute bottom-0 left-0 h-0.5 rounded-full w-0 group-hover:w-full transition-all duration-500",
                stat.gradient
              )}
            />
          </div>
        );
      })}
    </div>
  );
};
