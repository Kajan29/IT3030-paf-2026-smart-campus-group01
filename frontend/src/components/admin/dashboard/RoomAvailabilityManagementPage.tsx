import { useEffect, useMemo, useState } from "react";
import { Building2, CalendarDays, Clock3, DoorOpen, Layers } from "lucide-react";
import { toast } from "react-toastify";
import { Breadcrumb, type BreadcrumbItem } from "@/components/common/Breadcrumb";
import { BuildingCard } from "@/components/common/BuildingCard";
import { FloorCard } from "@/components/common/FloorCard";
import { RoomCard } from "@/components/common/RoomCard";
import { AdminLoadingState } from "@/components/admin/dashboard/AdminLoadingState";
import { RoomDetailsPage } from "@/components/admin/dashboard/RoomDetailsPage";
import facilityService from "@/services/facilityService";
import type { Building, Floor, Room } from "@/types/campusManagement";

interface RoomAvailabilityManagementPageProps {
  selectedRoomId: string | null;
  onOpenRoomDetails: (roomId: string) => void;
  onClearRoomSelection: () => void;
}

const RoomAvailabilityManagementPage = ({ selectedRoomId, onOpenRoomDetails, onClearRoomSelection }: RoomAvailabilityManagementPageProps) => {
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
    if (!selectedBuildingId) {
      if (selectedFloorId) {
        setSelectedFloorId("");
      }
      return;
    }

    if (!floors.some((floor) => floor.id === selectedFloorId && floor.buildingId === selectedBuildingId)) {
      setSelectedFloorId("");
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

  useEffect(() => {
    if (!selectedRoomId) return;
    if (!availableRooms.some((room) => room.id === selectedRoomId)) {
      onClearRoomSelection();
    }
  }, [availableRooms, onClearRoomSelection, selectedRoomId]);

  const selectedRoom = useMemo(
    () => availableRooms.find((room) => room.id === selectedRoomId) || null,
    [availableRooms, selectedRoomId],
  );

  const currentStep = selectedRoom
    ? "timetable"
    : selectedFloor
      ? "rooms"
      : selectedBuilding
        ? "floors"
        : "buildings";

  const handleBuildingSelect = (buildingId: string) => {
    setSelectedBuildingId(buildingId);
    setSelectedFloorId("");
    onClearRoomSelection();
  };

  const handleFloorSelect = (floorId: string) => {
    setSelectedFloorId(floorId);
    onClearRoomSelection();
  };

  const handleBackToBuildings = () => {
    setSelectedBuildingId("");
    setSelectedFloorId("");
    onClearRoomSelection();
  };

  const handleBackToFloors = () => {
    setSelectedFloorId("");
    onClearRoomSelection();
  };

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
            Step-by-step selection flow: building first, then floor, then room, then timetable.
          </p>
        </div>
      </div>

      <div className="glass-card rounded-2xl border border-border p-5 md:p-6">
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${currentStep === "buildings" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
            1. Buildings
          </span>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${currentStep === "floors" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
            2. Floors
          </span>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${currentStep === "rooms" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
            3. Rooms
          </span>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${currentStep === "timetable" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
            4. Timetable
          </span>
        </div>

        {currentStep === "buildings" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Building2 className="h-4 w-4 text-primary" />
              Step 1: Select a building
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {buildings.map((building) => (
                <BuildingCard
                  key={building.id}
                  building={building}
                  selected={selectedBuildingId === building.id}
                  onClick={() => handleBuildingSelect(building.id)}
                  roomCount={rooms.filter((room) => room.buildingId === building.id).length}
                  showDetails={false}
                />
              ))}
            </div>
          </div>
        )}

        {currentStep === "floors" && selectedBuilding && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Layers className="h-4 w-4 text-primary" />
                Step 2: Select a floor in {selectedBuilding.name}
              </div>
              <button
                onClick={handleBackToBuildings}
                className="rounded-xl border border-border px-3 py-2 text-sm font-semibold text-foreground transition hover:bg-muted/40"
              >
                Change building
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {availableFloors.map((floor) => (
                <FloorCard
                  key={floor.id}
                  floor={floor}
                  buildingName={selectedBuilding.name}
                  roomCount={rooms.filter((room) => room.floorId === floor.id).length}
                  selected={selectedFloorId === floor.id}
                  onClick={() => handleFloorSelect(floor.id)}
                />
              ))}
            </div>

            {availableFloors.length === 0 && (
              <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center text-sm text-muted-foreground">
                No floors found for this building.
              </div>
            )}
          </div>
        )}

        {currentStep === "rooms" && selectedBuilding && selectedFloor && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <DoorOpen className="h-4 w-4 text-primary" />
                Step 3: Select a room on {selectedFloor.floorName}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleBackToFloors}
                  className="rounded-xl border border-border px-3 py-2 text-sm font-semibold text-foreground transition hover:bg-muted/40"
                >
                  Change floor
                </button>
                <button
                  onClick={handleBackToBuildings}
                  className="rounded-xl border border-border px-3 py-2 text-sm font-semibold text-foreground transition hover:bg-muted/40"
                >
                  Change building
                </button>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {availableRooms.map((room) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  buildingName={selectedBuilding.name}
                  floorName={selectedFloor.floorName}
                  selected={selectedRoomId === room.id}
                  onClick={() => onOpenRoomDetails(room.id)}
                  showDetails={true}
                />
              ))}
            </div>

            {availableRooms.length === 0 && (
              <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center text-sm text-muted-foreground">
                No rooms found on this floor.
              </div>
            )}
          </div>
        )}

        {currentStep === "timetable" && selectedRoom && selectedBuilding && selectedFloor && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Step 4: Timetable editor</h2>
                <p className="text-xs text-muted-foreground">
                  {selectedRoom.name} · {selectedFloor.floorName} · {selectedBuilding.name}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={onClearRoomSelection}
                  className="rounded-xl border border-border px-3 py-2 text-sm font-semibold text-foreground transition hover:bg-muted/40"
                >
                  Change room
                </button>
                <button
                  onClick={handleBackToFloors}
                  className="rounded-xl border border-border px-3 py-2 text-sm font-semibold text-foreground transition hover:bg-muted/40"
                >
                  Change floor
                </button>
              </div>
            </div>

            <RoomDetailsPage roomId={selectedRoomId} />
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomAvailabilityManagementPage;
