import { useEffect, useMemo, useState } from "react";
import { Building2, CalendarDays, Clock3, DoorOpen, Layers, MapPin } from "lucide-react";
import { toast } from "react-toastify";
import { Breadcrumb, type BreadcrumbItem } from "@/components/common/Breadcrumb";
import { BuildingCard } from "@/components/common/BuildingCard";
import { FloorCard } from "@/components/common/FloorCard";
import { RoomCard } from "@/components/common/RoomCard";
import { AdminLoadingState } from "@/components/admin/dashboard/AdminLoadingState";
import facilityService from "@/services/facilityService";
import type { Building, Floor, Room } from "@/types/campusManagement";

interface RoomAvailabilityManagementPageProps {
  onOpenRoomDetails: (roomId: string) => void;
}

const RoomAvailabilityManagementPage = ({ onOpenRoomDetails }: RoomAvailabilityManagementPageProps) => {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBuildingId, setSelectedBuildingId] = useState("");
  const [selectedFloorId, setSelectedFloorId] = useState("");

  useEffect(() => {
    const loadSnapshot = async () => {
      setLoading(true);
      try {
        const snapshot = await facilityService.getFacilitySnapshot();
        setBuildings(snapshot.buildings);
        setFloors(snapshot.floors);
        setRooms(snapshot.rooms);
        setSelectedBuildingId(snapshot.buildings[0]?.id || "");
      } catch (error) {
        console.error(error);
        toast.error("Failed to load facility snapshot");
      } finally {
        setLoading(false);
      }
    };

    void loadSnapshot();
  }, []);

  useEffect(() => {
    if (!selectedBuildingId) return;
    const firstFloor = floors.find((floor) => floor.buildingId === selectedBuildingId);
    if (!floors.some((floor) => floor.id === selectedFloorId && floor.buildingId === selectedBuildingId)) {
      setSelectedFloorId(firstFloor?.id || "");
    }
  }, [floors, selectedBuildingId, selectedFloorId]);

  const selectedBuilding = useMemo(
    () => buildings.find((building) => building.id === selectedBuildingId) || null,
    [buildings, selectedBuildingId],
  );

  const selectedFloor = useMemo(
    () => floors.find((floor) => floor.id === selectedFloorId) || null,
    [floors, selectedFloorId],
  );

  const availableFloors = useMemo(
    () => floors.filter((floor) => floor.buildingId === selectedBuildingId),
    [floors, selectedBuildingId],
  );

  const availableRooms = useMemo(
    () => rooms.filter((room) => room.floorId === selectedFloorId),
    [rooms, selectedFloorId],
  );

  const breadcrumbItems: BreadcrumbItem[] = [{ label: "Room Availability", icon: <Clock3 className="h-4 w-4" /> }];
  if (selectedBuilding) {
    breadcrumbItems.push({ label: selectedBuilding.name, icon: <Building2 className="h-4 w-4" /> });
  }
  if (selectedFloor) {
    breadcrumbItems.push({ label: selectedFloor.floorName, icon: <Layers className="h-4 w-4" /> });
  }

  if (loading) {
    return (
      <AdminLoadingState title="Loading Room Availability" subtitle="Preparing buildings, floors, and rooms." />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumb items={breadcrumbItems} />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            <CalendarDays className="h-3.5 w-3.5" />
            Availability Control Center
          </div>
          <h1 className="mt-3 text-3xl font-bold text-foreground">Room availability management</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Select a building, then a room. The room opens in a separate timetable page where admin can add or edit blocks.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground">Selected building</p>
            <p className="mt-1 text-sm font-semibold text-foreground">{selectedBuilding?.name || "None"}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground">Selected floor</p>
            <p className="mt-1 text-sm font-semibold text-foreground">{selectedFloor?.floorName || "None"}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground">Rooms</p>
            <p className="mt-1 text-sm font-semibold text-foreground">{availableRooms.length}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground">Window</p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {selectedBuilding?.openingTime || "08:00"} - {selectedBuilding?.closingTime || "18:00"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
        <div className="space-y-4">
          <div className="glass-card rounded-2xl border border-border p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              Buildings
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Click a building to load its rooms below.</p>
          </div>

          <div className="space-y-3">
            {buildings.map((building) => (
              <BuildingCard
                key={building.id}
                building={building}
                selected={selectedBuildingId === building.id}
                onClick={() => setSelectedBuildingId(building.id)}
                roomCount={rooms.filter((room) => room.buildingId === building.id).length}
                showDetails={false}
              />
            ))}
          </div>
        </div>

        <div className="space-y-5">
          <div className="glass-card rounded-2xl border border-border p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Layers className="h-4 w-4 text-primary" />
              Floors
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              {availableFloors.map((floor) => (
                <FloorCard
                  key={floor.id}
                  floor={floor}
                  buildingName={selectedBuilding?.name}
                  roomCount={rooms.filter((room) => room.floorId === floor.id).length}
                  selected={selectedFloorId === floor.id}
                  onClick={() => setSelectedFloorId(floor.id)}
                />
              ))}
            </div>
          </div>

          <div className="glass-card rounded-2xl border border-border p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <DoorOpen className="h-4 w-4 text-primary" />
                  Rooms
                </div>
                <p className="text-xs text-muted-foreground">Click a room to open the timetable page.</p>
              </div>
              {selectedBuilding?.closedOnWeekends && (
                <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">Weekend closed</span>
              )}
            </div>

            <div className="grid gap-3">
              {availableRooms.map((room) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  buildingName={selectedBuilding?.name}
                  floorName={selectedFloor?.floorName}
                  selected={false}
                  onClick={() => onOpenRoomDetails(room.id)}
                  showDetails={true}
                />
              ))}

              {availableRooms.length === 0 && (
                <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center text-sm text-muted-foreground">
                  Select a floor to see its rooms.
                </div>
              )}
            </div>
          </div>

          <div className="glass-card rounded-2xl border border-border p-4 text-sm text-muted-foreground">
            <p className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Building first, then room, then timetable. This keeps the workflow clean and easy to scan.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomAvailabilityManagementPage;
