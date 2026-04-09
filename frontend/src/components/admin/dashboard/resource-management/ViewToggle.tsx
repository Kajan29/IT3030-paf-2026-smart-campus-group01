import type { ResourceViewMode } from "@/types/resourceManagement";
import { cn } from "@/lib/utils";

interface ViewToggleProps {
  value: ResourceViewMode;
  onChange: (mode: ResourceViewMode) => void;
}

export const ViewToggle = ({ value, onChange }: ViewToggleProps) => {
  return (
    <div className="inline-flex rounded-lg border border-border bg-muted p-1">
      {(["2D", "3D"] as ResourceViewMode[]).map((mode) => (
        <button
          key={mode}
          onClick={() => onChange(mode)}
          className={cn(
            "px-4 py-2 text-sm font-semibold rounded-md transition-colors",
            value === mode ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {mode} View
        </button>
      ))}
    </div>
  );
};
