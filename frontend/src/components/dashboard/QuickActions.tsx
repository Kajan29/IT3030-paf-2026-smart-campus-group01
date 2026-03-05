import { UserPlus, Trophy, Megaphone, Sparkles, BarChart3, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { mockQuickActions } from "@/data/mockData";

const iconMap: Record<string, LucideIcon> = {
  UserPlus,
  Trophy,
  Megaphone,
  Sparkles,
  BarChart3,
};

export const QuickActions = () => {
  return (
    <div className="bg-card rounded-2xl p-5 shadow-card border border-border animate-fade-in" style={{ animationDelay: "600ms" }}>
      <div className="mb-4">
        <h3 className="font-semibold text-foreground">Quick Actions</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Frequently used admin tasks</p>
      </div>
      <div className="grid grid-cols-1 gap-3">
        {mockQuickActions.map((action, i) => {
          const Icon = iconMap[action.icon];
          return (
            <button
              key={action.id}
              className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/30 hover:bg-muted/50 transition-all duration-200 group text-left animate-fade-in"
              style={{ animationDelay: `${600 + i * 80}ms` }}
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md",
                  "group-hover:scale-110 transition-transform duration-200",
                  action.gradient
                )}
              >
                {Icon && <Icon size={18} className="text-white" />}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                  {action.label}
                </p>
                <p className="text-xs text-muted-foreground truncate">{action.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
