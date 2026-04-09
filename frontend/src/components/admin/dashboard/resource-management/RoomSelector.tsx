import type { Room } from "@/types/campusManagement";

interface RoomSelectorProps {
  rooms: Room[];
  selectedRoom: string;
  onChange: (roomId: string) => void;
  disabled?: boolean;
}

export const RoomSelector = ({ rooms, selectedRoom, onChange, disabled }: RoomSelectorProps) => {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">Room</label>
      <select
        className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
        value={selectedRoom}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
      >
        <option value="">Select room</option>
        {rooms.map((room) => (
          <option key={room.id} value={room.id}>
            {room.name}
          </option>
        ))}
      </select>
    </div>
  );
};
