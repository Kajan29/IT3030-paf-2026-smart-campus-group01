import { Plus } from "lucide-react";

const RESOURCE_PRESETS = ["chair", "table", "projector", "ac_unit", "light", "power_plug", "window"];

interface ResourceToolbarProps {
  onAdd: (resourceType: string) => void;
  disabled?: boolean;
}

export const ResourceToolbar = ({ onAdd, disabled }: ResourceToolbarProps) => {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <p className="text-sm font-semibold text-foreground">Resource Toolbar</p>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-7">
        {RESOURCE_PRESETS.map((resourceType) => (
          <button
            key={resourceType}
            disabled={disabled}
            onClick={() => onAdd(resourceType)}
            className="inline-flex items-center justify-center gap-1 rounded-lg border border-border bg-background px-3 py-2 text-sm capitalize hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Plus size={14} />
            {resourceType.replace(/_/g, " ")}
          </button>
        ))}
      </div>
    </div>
  );
};
