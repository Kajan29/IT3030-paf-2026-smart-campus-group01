import { Building2, CalendarClock, CheckCircle2, Cpu, DoorOpen, Layers, Notebook, Ruler, ShieldCheck, Wrench } from "lucide-react";
import { useEffect, useState } from "react";
import type { Building, Floor, Room } from "@/types/campusManagement";
import facilityService from "@/services/facilityService";

interface RoomDetailsPageProps {
  roomId: string | null;
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

export const RoomDetailsPage = ({ roomId }: RoomDetailsPageProps) => {
  const [room, setRoom] = useState<Room | null>(null);
  const [building, setBuilding] = useState<Building | null>(null);
  const [floor, setFloor] = useState<Floor | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!roomId) {
      setRoom(null);
      setBuilding(null);
      setFloor(null);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const roomData = await facilityService.getRoomById(roomId);
        const [buildingData, floorData] = await Promise.all([
          facilityService.getBuildings(),
          facilityService.getFloors(roomData.buildingId),
        ]);

        setRoom(roomData);
        setBuilding(buildingData.find((entry) => entry.id === roomData.buildingId) || null);
        setFloor(floorData.find((entry) => entry.id === roomData.floorId) || null);
      } catch (error) {
        window.alert(getApiError(error));
        setRoom(null);
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, [roomId]);

  if (!roomId) {
    return (
      <div className="glass-card rounded-2xl border border-border p-12 text-center">
        <DoorOpen size={42} className="mx-auto text-muted-foreground mb-3" />
        <p className="font-semibold text-foreground">No room selected</p>
        <p className="text-sm text-muted-foreground mt-1">Open a room from Room Management to view complete information.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="glass-card rounded-2xl border border-border p-12 text-center">
        <p className="font-semibold text-foreground">Loading room details...</p>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="glass-card rounded-2xl border border-border p-12 text-center">
        <p className="font-semibold text-foreground">Room not found</p>
      </div>
    );
  }

  const creatorName = [room.createdBy?.firstName, room.createdBy?.lastName].filter(Boolean).join(" ");

  return (
    <div className="space-y-6 animate-fade-in">
      {room.imageUrl && (
        <div className="glass-card rounded-2xl border border-border overflow-hidden">
          <div className="h-56 w-full">
            <img src={room.imageUrl} alt={room.name} className="h-full w-full object-cover" />
          </div>
        </div>
      )}

      <div className="glass-card rounded-2xl border border-border p-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{room.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">{room.code} • {room.type}</p>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-3">
              <span className="flex items-center gap-1.5"><Building2 size={14} /> {building?.name}</span>
              <span className="flex items-center gap-1.5"><Layers size={14} /> {floor?.floorName}</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 size={14} /> {room.status}</span>
              {room.createdBy && (
                <span className="flex items-center gap-1.5"><Building2 size={14} /> Created by {creatorName || room.createdBy.email}</span>
              )}
            </div>
          </div>

          <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${room.bookingAvailable ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
            {room.bookingAvailable ? "Booking Enabled" : "Booking Disabled"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-5 border border-border">
          <p className="text-sm text-muted-foreground">Seating Capacity</p>
          <p className="text-3xl font-bold text-foreground mt-1">{room.seatingCapacity}</p>
        </div>
        <div className="glass-card rounded-2xl p-5 border border-border">
          <p className="text-sm text-muted-foreground">Max Occupancy</p>
          <p className="text-3xl font-bold text-foreground mt-1">{room.maxOccupancy}</p>
        </div>
        <div className="glass-card rounded-2xl p-5 border border-border">
          <p className="text-sm text-muted-foreground">Area (sqm)</p>
          <p className="text-3xl font-bold text-foreground mt-1">{room.areaSqMeters}</p>
        </div>
        <div className="glass-card rounded-2xl p-5 border border-border">
          <p className="text-sm text-muted-foreground">Condition</p>
          <p className="text-3xl font-bold text-foreground mt-1">{room.condition}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 glass-card rounded-2xl border border-border p-5">
          <h2 className="text-lg font-semibold text-foreground mb-4">Complete Room Information</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl border border-border p-3">
              <p className="text-muted-foreground">Dimensions</p>
              <p className="font-medium text-foreground mt-1">{room.lengthMeters}m × {room.widthMeters}m</p>
              <p className="text-xs text-muted-foreground mt-1">{room.areaSqFeet} sq ft</p>
            </div>
            <div className="rounded-xl border border-border p-3">
              <p className="text-muted-foreground">Climate</p>
              <p className="font-medium text-foreground mt-1">{room.climateControl}</p>
            </div>
            <div className="rounded-xl border border-border p-3">
              <p className="text-muted-foreground">Board Setup</p>
              <p className="font-medium text-foreground mt-1">{room.boardType}</p>
            </div>
            <div className="rounded-xl border border-border p-3">
              <p className="text-muted-foreground">Maintenance</p>
              <p className="font-medium text-foreground mt-1">{room.maintenanceStatus}</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl border border-border p-3">
              <p className="text-muted-foreground">Furnishing</p>
              <p className="font-medium text-foreground mt-1">{room.chairs} chairs, {room.tables} tables</p>
            </div>
            <div className="rounded-xl border border-border p-3">
              <p className="text-muted-foreground">Digital Readiness</p>
              <p className="font-medium text-foreground mt-1">{room.smartClassroomEnabled ? "Smart classroom ready" : "Standard classroom"}</p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mt-4">{room.description}</p>
        </div>

        <div className="glass-card rounded-2xl border border-border p-5">
          <h2 className="text-lg font-semibold text-foreground mb-4">Facilities</h2>
          <div className="space-y-2 text-sm">
            {room.facilities.map((facility) => (
              <div key={facility} className="rounded-lg bg-muted/40 px-3 py-2 text-foreground">
                {facility}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl border border-border p-4 text-sm">
          <p className="text-muted-foreground flex items-center gap-1.5"><Cpu size={13} /> Smart Features</p>
          <p className="mt-2 text-foreground">Projector: {room.projectorAvailable ? "Yes" : "No"}</p>
          <p className="text-foreground">Internet: {room.internetAvailable ? "Yes" : "No"}</p>
          <p className="text-foreground">Lab Equipment: {room.labEquipmentAvailable ? "Yes" : "No"}</p>
        </div>

        <div className="glass-card rounded-2xl border border-border p-4 text-sm">
          <p className="text-muted-foreground flex items-center gap-1.5"><ShieldCheck size={13} /> Support</p>
          <p className="mt-2 text-foreground">Accessibility: {room.accessibilitySupport ? "Available" : "Not available"}</p>
          <p className="text-foreground">Power Backup: {room.powerBackupAvailable ? "Available" : "Not available"}</p>
          <p className="text-foreground">Booking: {room.bookingAvailable ? "Open" : "Restricted"}</p>
        </div>

        <div className="glass-card rounded-2xl border border-border p-4 text-sm">
          <p className="text-muted-foreground flex items-center gap-1.5"><Ruler size={13} /> Area Details</p>
          <p className="mt-2 text-foreground">Square meters: {room.areaSqMeters}</p>
          <p className="text-foreground">Square feet: {room.areaSqFeet}</p>
          <p className="text-foreground">Type: {room.type}</p>
        </div>
      </div>

      <div className="glass-card rounded-2xl border border-border p-5">
        <h2 className="text-lg font-semibold text-foreground mb-4">Maintenance History</h2>
        <div className="space-y-2">
          {room.maintenanceHistory.map((entry) => (
            <div key={entry} className="rounded-xl border border-border p-3 text-sm text-foreground flex items-center gap-2">
              <Wrench size={14} className="text-muted-foreground" />
              {entry}
            </div>
          ))}
          {room.maintenanceHistory.length === 0 && (
            <p className="text-sm text-muted-foreground">No maintenance records available.</p>
          )}
        </div>
      </div>

      <div className="glass-card rounded-2xl border border-border p-5 text-sm text-muted-foreground">
        <p className="flex items-center gap-2"><CalendarClock size={14} /> This room profile tracks facilities, operational readiness, and maintenance for smart campus planning.</p>
        <p className="mt-2 flex items-center gap-2"><Notebook size={14} /> Keep maintenance and equipment fields updated to improve room allocation and booking quality.</p>
      </div>
    </div>
  );
};
