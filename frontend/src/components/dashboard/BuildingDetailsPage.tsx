import { BarChart3, Building2, CalendarDays, DoorOpen, Layers, MapPin, ShieldCheck, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { roomTypes } from "@/data/campusManagementConstants";
import type { Building, Floor, Room } from "@/types/campusManagement";
import facilityService from "@/services/facilityService";
import { Breadcrumb } from "@/components/common/Breadcrumb";

interface BuildingDetailsPageProps {
  buildingId: string | null;
  onOpenFloorManagement: (buildingId?: string) => void;
  onOpenRoomDetails: (roomId: string) => void;
}

const getApiError = (error: unknown) => {
  if (typeof error === "object" && error !== null) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) {
      return response.data.message;
    }
  }
  return "Request failed. Please try again.";
};

export const BuildingDetailsPage = ({
  buildingId,
  onOpenFloorManagement,
  onOpenRoomDetails,
}: BuildingDetailsPageProps) => {
  const [building, setBuilding] = useState<Building | null>(null);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!buildingId) {
      setBuilding(null);
      setFloors([]);
      setRooms([]);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const [buildingData, floorData, roomData] = await Promise.all([
          facilityService.getBuildingById(buildingId),
          facilityService.getFloors(buildingId),
          facilityService.getRooms({ buildingId }),
        ]);
        setBuilding(buildingData);
        setFloors(floorData.sort((a, b) => a.floorNumber - b.floorNumber));
        setRooms(roomData);
      } catch (error) {
        window.alert(getApiError(error));
        setBuilding(null);
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, [buildingId]);

  const totalCapacity = useMemo(() => rooms.reduce((sum, room) => sum + room.maxOccupancy, 0), [rooms]);
  const occupiedRooms = useMemo(() => rooms.filter((room) => room.status === "Occupied").length, [rooms]);

  const roomTypeDistribution = useMemo(() => {
    return roomTypes
      .map((type) => ({ type, count: rooms.filter((room) => room.type === type).length }))
      .filter((entry) => entry.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [rooms]);

  if (!buildingId) {
    return (
      <div className="glass-card rounded-2xl border border-border p-12 text-center">
        <Building2 size={42} className="mx-auto text-muted-foreground mb-3" />
        <p className="font-semibold text-foreground">No building selected</p>
        <p className="text-sm text-muted-foreground mt-1">Open a building from Building Management to view details.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="glass-card rounded-2xl border border-border p-12 text-center">
        <p className="font-semibold text-foreground">Loading building details...</p>
      </div>
    );
  }

  if (!building) {
    return (
      <div className="glass-card rounded-2xl border border-border p-12 text-center">
        <p className="font-semibold text-foreground">Building not found</p>
      </div>
    );
  }

  const creatorName = [building.createdBy?.firstName, building.createdBy?.lastName].filter(Boolean).join(" ");

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Breadcrumb */}
      <Breadcrumb 
        items={[
          { label: "Building Management", icon: <Building2 className="h-4 w-4" /> },
          { label: building.name }
        ]} 
      />

      <div className="glass-card rounded-2xl border border-border overflow-hidden">
        {building.imageUrl && (
          <div className="h-48 w-full">
            <img src={building.imageUrl} alt={building.name} className="h-full w-full object-cover" />
          </div>
        )}

        <div className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-foreground">{building.name}</h1>
                <span className="px-2 py-0.5 rounded-md bg-muted text-xs text-muted-foreground">{building.code}</span>
              </div>
              <p className="text-muted-foreground mt-2 max-w-3xl">{building.description}</p>
              <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><MapPin size={14} /> {building.campus} - {building.location}</span>
                <span className="flex items-center gap-1.5"><CalendarDays size={14} /> Established {building.yearEstablished}</span>
                <span className="flex items-center gap-1.5"><Users size={14} /> {building.manager}</span>
                {building.createdBy && (
                  <span className="flex items-center gap-1.5"><Users size={14} /> Created by {creatorName || building.createdBy.email}</span>
                )}
              </div>
            </div>

            <button
              onClick={() => onOpenFloorManagement(building.id)}
              className="px-4 py-2.5 rounded-xl border border-border text-sm hover:bg-muted transition-colors"
            >
              Manage Floors
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards with Icons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-6 border border-border hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">Total Floors</p>
            <Layers className="h-5 w-5 text-primary/70" />
          </div>
          <p className="text-3xl font-bold text-foreground">{floors.length}</p>
        </div>
        <div className="glass-card rounded-2xl p-6 border border-border hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">Total Rooms</p>
            <DoorOpen className="h-5 w-5 text-emerald-600" />
          </div>
          <p className="text-3xl font-bold text-emerald-600">{rooms.length}</p>
        </div>
        <div className="glass-card rounded-2xl p-6 border border-border hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">Total Capacity</p>
            <Users className="h-5 w-5 text-primary/70" />
          </div>
          <p className="text-3xl font-bold text-foreground">{totalCapacity}</p>
        </div>
        <div className="glass-card rounded-2xl p-6 border border-border hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">Occupied Rooms</p>
            <BarChart3 className="h-5 w-5 text-amber-600" />
          </div>
          <p className="text-3xl font-bold text-amber-600">{occupiedRooms}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 glass-card rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Floors and Room Coverage</h2>
            <span className="text-xs text-muted-foreground">Live overview</span>
          </div>

          <div className="space-y-3">
            {floors.map((floor) => {
              const floorRooms = rooms.filter((room) => room.floorId === floor.id);
              const floorOccupiedRooms = floorRooms.filter((room) => room.status === "Occupied").length;
              const occupancyRate = floorRooms.length > 0 ? Math.round((floorOccupiedRooms / floorRooms.length) * 100) : 0;

              return (
                <div key={floor.id} className="rounded-xl border border-border p-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-foreground">{floor.floorName}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{floor.description}</p>
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-4">
                      <span className="flex items-center gap-1"><DoorOpen size={13} /> {floorRooms.length} rooms</span>
                      <span className="flex items-center gap-1"><ShieldCheck size={13} /> {occupancyRate}% occupied</span>
                    </div>
                  </div>

                  <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-2 rounded-full bg-primary" style={{ width: `${occupancyRate}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="glass-card rounded-2xl border border-border p-5">
          <h2 className="text-lg font-semibold text-foreground mb-4">Room Type Distribution</h2>
          <div className="space-y-3">
            {roomTypeDistribution.map((entry) => {
              const percentage = Math.round((entry.count / Math.max(rooms.length, 1)) * 100);
              return (
                <div key={entry.type}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-muted-foreground">{entry.type}</span>
                    <span className="font-medium text-foreground">{entry.count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-2 rounded-full bg-info" style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-5 pt-4 border-t border-border text-xs text-muted-foreground flex items-center gap-1.5">
            <BarChart3 size={12} />
            Distribution is based on active room records.
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Rooms in This Building</h2>
          <span className="text-xs text-muted-foreground">Click to view full room profile</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {rooms.map((room) => (
            <button
              key={room.id}
              onClick={() => onOpenRoomDetails(room.id)}
              className="text-left rounded-xl border border-border p-4 hover:border-primary/40 hover:bg-primary/5 transition-all"
            >
              <p className="font-medium text-foreground">{room.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{room.code} • {room.type}</p>
              <p className="text-xs text-muted-foreground mt-2">Capacity: {room.maxOccupancy}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
