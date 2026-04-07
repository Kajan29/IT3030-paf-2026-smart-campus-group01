import { BarChart3, Building2, DoorOpen, Layers, Wrench, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { mockQuickActions } from "@/data/mockData";

const iconMap: Record<string, LucideIcon> = {
  Building2,
  Layers,
  DoorOpen,
  Wrench,
  BarChart3,
};

export const QuickActions = () => {
  return (
    <div className="glass-card rounded-2xl p-5 animate-fade-in" style={{ animationDelay: "600ms" }}>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground">Quick Actions</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Common daily workflows</p>
        </div>
        <span className="text-[10px] px-2 py-1 rounded-md bg-primary/10 text-primary font-semibold">One click</span>
      </div>
      <div className="grid grid-cols-1 gap-3">
        {mockQuickActions.map((action, i) => {
          const Icon = iconMap[action.icon];
          return (
            <button
              key={action.id}
              className="flex items-center gap-3 p-3 rounded-xl border border-border/70 hover:border-primary/40 hover:bg-primary/5 transition-all duration-200 group text-left animate-fade-in"
              style={{ animationDelay: `${600 + i * 80}ms` }}
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md",
                  "group-hover:scale-110 transition-transform duration-200 border border-white/30",
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
