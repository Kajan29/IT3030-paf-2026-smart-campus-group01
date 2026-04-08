import type { Floor } from "@/types/campusManagement";

interface FloorSelectorProps {
  floors: Floor[];
  selectedFloor: string;
  onChange: (floorId: string) => void;
  disabled?: boolean;
}

export const FloorSelector = ({ floors, selectedFloor, onChange, disabled }: FloorSelectorProps) => {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">Floor</label>
      <select
        className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
        value={selectedFloor}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
      >
        <option value="">Select floor</option>
        {floors.map((floor) => (
          <option key={floor.id} value={floor.id}>
            {floor.floorName}
          </option>
        ))}
      </select>
    </div>
  );
};
