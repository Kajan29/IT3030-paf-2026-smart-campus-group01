import type { Building } from "@/types/campusManagement";

interface BuildingSelectorProps {
  buildings: Building[];
  selectedBuilding: string;
  onChange: (buildingId: string) => void;
  disabled?: boolean;
}

export const BuildingSelector = ({ buildings, selectedBuilding, onChange, disabled }: BuildingSelectorProps) => {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">Building</label>
      <select
        className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
        value={selectedBuilding}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
      >
        <option value="">Select building</option>
        {buildings.map((building) => (
          <option key={building.id} value={building.id}>
            {building.name}
          </option>
        ))}
      </select>
    </div>
  );
};
