import { Building2, DoorOpen, Edit, Eye, Layers, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { roomStatuses, roomTypes } from "@/data/campusManagementConstants";
import type {
  BoardType,
  Building,
  ClimateControl,
  Floor,
  MaintenanceStatus,
  Room,
  RoomCondition,
  RoomStatus,
  RoomType,
} from "@/types/campusManagement";
import facilityService, { RoomUpsertPayload } from "@/services/facilityService";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { RoomCard } from "@/components/common/RoomCard";
import { AdminLoadingState } from "@/components/admin/dashboard/AdminLoadingState";
import { useAuth } from "@/context/AuthContext";

interface RoomManagementPageProps {
  selectedBuildingId?: string | null;
  selectedFloorId?: string | null;
  onOpenRoomDetails: (roomId: string) => void;
}

interface RoomFormState {
  id?: string;
  name: string;
  code: string;
  buildingId: string;
  floorId: string;
  type: RoomType;
  lengthMeters: number;
  widthMeters: number;
  seatingCapacity: number;
  maxOccupancy: number;
  facilities: string;
  status: RoomStatus;
  description: string;
  condition: RoomCondition;
  climateControl: ClimateControl;
  smartClassroomEnabled: boolean;
  projectorAvailable: boolean;
  boardType: BoardType;
  internetAvailable: boolean;
  chairs: number;
  tables: number;
  labEquipmentAvailable: boolean;
  powerBackupAvailable: boolean;
  accessibilitySupport: boolean;
  maintenanceStatus: MaintenanceStatus;
  bookingAvailable: boolean;
  maintenanceHistory: string;
  imageUrl: string;
}

type RoomFormErrors = Partial<Record<keyof RoomFormState | "imageFile", string>>;

const roomConditions: RoomCondition[] = ["Excellent", "Good", "Fair", "Needs Repair"];
const climateModes: ClimateControl[] = ["AC", "Non-AC"];
const boardTypes: BoardType[] = ["Whiteboard", "Smart Board", "Both", "None"];
const maintenanceStatuses: MaintenanceStatus[] = ["Operational", "Scheduled", "Critical"];

const emptyForm: RoomFormState = {
  name: "",
  code: "",
  buildingId: "",
  floorId: "",
  type: "Lecture Hall",
  lengthMeters: 8,
  widthMeters: 6,
  seatingCapacity: 30,
  maxOccupancy: 35,
  facilities: "",
  status: "Available",
  description: "",
  condition: "Good",
  climateControl: "AC",
  smartClassroomEnabled: false,
  projectorAvailable: false,
  boardType: "Whiteboard",
  internetAvailable: true,
  chairs: 30,
  tables: 12,
  labEquipmentAvailable: false,
  powerBackupAvailable: true,
  accessibilitySupport: true,
  maintenanceStatus: "Operational",
  bookingAvailable: true,
  maintenanceHistory: "",
  imageUrl: "",
};

const statusBadgeClass: Record<RoomStatus, string> = {
  Available: "bg-success/10 text-success",
  Occupied: "bg-warning/10 text-warning",
  "Under Maintenance": "bg-destructive/10 text-destructive",
  Inactive: "bg-muted text-muted-foreground",
};

const getApiError = (error: unknown) => {
  if (typeof error === "object" && error !== null) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) {
      return response.data.message;
    }
  }
  return "Request failed. Please try again.";
};

export const RoomManagementPage = ({
  selectedBuildingId,
  selectedFloorId,
  onOpenRoomDetails,
}: RoomManagementPageProps) => {
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const canManage = isAuthenticated && user?.role === "ADMIN";

  const [buildings, setBuildings] = useState<Building[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [buildingFilter, setBuildingFilter] = useState(selectedBuildingId || "");
  const [floorFilter, setFloorFilter] = useState(selectedFloorId || "");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [formState, setFormState] = useState<RoomFormState>(emptyForm);
  const [formErrors, setFormErrors] = useState<RoomFormErrors>({});
  const [imageFile, setImageFile] = useState<File | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const snapshot = await facilityService.getFacilitySnapshot();
      setBuildings(snapshot.buildings);
      setFloors(snapshot.floors);
      setRooms(snapshot.rooms);
    } catch (error) {
      window.alert(getApiError(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!canManage) {
      setLoading(false);
      setBuildings([]);
      setFloors([]);
      setRooms([]);
      return;
    }

    void loadData();
  }, [authLoading, canManage]);

  useEffect(() => {
    if (selectedBuildingId) {
      setBuildingFilter(selectedBuildingId);
    }
  }, [selectedBuildingId]);

  useEffect(() => {
    if (selectedFloorId) {
      setFloorFilter(selectedFloorId);
    }
  }, [selectedFloorId]);

  useEffect(() => {
    if (!buildingFilter) {
      return;
    }
    const floorExists = floors.some((floor) => floor.id === floorFilter && floor.buildingId === buildingFilter);
    if (!floorExists) {
      setFloorFilter("");
    }
  }, [buildingFilter, floorFilter, floors]);

  const floorsForSelectedBuilding = useMemo(() => {
    if (!buildingFilter) {
      return floors;
    }
    return floors.filter((floor) => floor.buildingId === buildingFilter);
  }, [buildingFilter, floors]);

  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      const building = buildings.find((entry) => entry.id === room.buildingId);
      const floor = floors.find((entry) => entry.id === room.floorId);
      const searchable = `${room.name} ${room.code} ${building?.name || ""} ${floor?.floorName || ""}`.toLowerCase();
      const matchesSearch = searchable.includes(searchTerm.toLowerCase());
      const matchesBuilding = !buildingFilter || room.buildingId === buildingFilter;
      const matchesFloor = !floorFilter || room.floorId === floorFilter;
      const matchesType = !typeFilter || room.type === typeFilter;
      const matchesStatus = !statusFilter || room.status === statusFilter;
      return matchesSearch && matchesBuilding && matchesFloor && matchesType && matchesStatus;
    });
  }, [rooms, buildings, floors, searchTerm, buildingFilter, floorFilter, typeFilter, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: rooms.length,
      available: rooms.filter((room) => room.status === "Available").length,
      occupied: rooms.filter((room) => room.status === "Occupied").length,
      maintenance: rooms.filter((room) => room.status === "Under Maintenance").length,
    };
  }, [rooms]);

  const openCreateModal = () => {
    const fallbackBuildingId = buildingFilter || buildings[0]?.id || "";
    const fallbackFloor = floors.find((floor) => floor.buildingId === fallbackBuildingId)?.id || "";
    setFormState({ ...emptyForm, buildingId: fallbackBuildingId, floorId: fallbackFloor });
    setFormErrors({});
    setImageFile(null);
    setShowModal(true);
  };

  const openEditModal = (room: Room) => {
    setFormState({
      id: room.id,
      name: room.name,
      code: room.code,
      buildingId: room.buildingId,
      floorId: room.floorId,
      type: room.type,
      lengthMeters: room.lengthMeters,
      widthMeters: room.widthMeters,
      seatingCapacity: room.seatingCapacity,
      maxOccupancy: room.maxOccupancy,
      facilities: room.facilities.join(", "),
      status: room.status,
      description: room.description,
      condition: room.condition,
      climateControl: room.climateControl,
      smartClassroomEnabled: room.smartClassroomEnabled,
      projectorAvailable: room.projectorAvailable,
      boardType: room.boardType,
      internetAvailable: room.internetAvailable,
      chairs: room.chairs,
      tables: room.tables,
      labEquipmentAvailable: room.labEquipmentAvailable,
      powerBackupAvailable: room.powerBackupAvailable,
      accessibilitySupport: room.accessibilitySupport,
      maintenanceStatus: room.maintenanceStatus,
      bookingAvailable: room.bookingAvailable,
      maintenanceHistory: room.maintenanceHistory.join(", "),
      imageUrl: room.imageUrl || "",
    });
    setFormErrors({});
    setImageFile(null);
    setShowModal(true);
  };

  const validateRoomForm = () => {
    const errors: RoomFormErrors = {};

    if (!formState.name.trim()) {
      errors.name = "Room name is required.";
    }
    if (!formState.code.trim()) {
      errors.code = "Room code is required.";
    } else if (!/^[A-Z0-9-]{2,16}$/.test(formState.code.trim().toUpperCase())) {
      errors.code = "Use 2-16 uppercase letters, numbers, or hyphen.";
    }
    if (!formState.buildingId) {
      errors.buildingId = "Building selection is required.";
    }
    if (!formState.floorId) {
      errors.floorId = "Floor selection is required.";
    }
    if (!formState.description.trim()) {
      errors.description = "Description is required.";
    }
    if (!formState.facilities.trim()) {
      errors.facilities = "At least one facility is required.";
    }
    if (!formState.id && !imageFile) {
      errors.imageFile = "Room image is required.";
    }

    if (formState.lengthMeters < 1 || formState.lengthMeters > 200) {
      errors.lengthMeters = "Length must be between 1 and 200 meters.";
    }
    if (formState.widthMeters < 1 || formState.widthMeters > 200) {
      errors.widthMeters = "Width must be between 1 and 200 meters.";
    }
    if (formState.seatingCapacity < 1 || formState.seatingCapacity > 1000) {
      errors.seatingCapacity = "Seating capacity must be between 1 and 1000.";
    }
    if (formState.maxOccupancy < 1 || formState.maxOccupancy > 1200) {
      errors.maxOccupancy = "Max occupancy must be between 1 and 1200.";
    } else if (formState.maxOccupancy < formState.seatingCapacity) {
      errors.maxOccupancy = "Max occupancy cannot be less than seating capacity.";
    }
    if (formState.chairs < 0 || formState.chairs > 2000) {
      errors.chairs = "Number of chairs must be between 0 and 2000.";
    }
    if (formState.tables < 0 || formState.tables > 500) {
      errors.tables = "Number of tables must be between 0 and 500.";
    }

    const duplicateCode = rooms.some(
      (room) => room.id !== formState.id && room.code.toLowerCase() === formState.code.trim().toLowerCase()
    );
    if (duplicateCode) {
      errors.code = "This room code already exists.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveRoom = async () => {
    if (!validateRoomForm()) {
      return;
    }

    const facilities = formState.facilities
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);

    const maintenanceHistory = formState.maintenanceHistory
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);

    const payload: RoomUpsertPayload = {
      name: formState.name.trim(),
      code: formState.code.trim().toUpperCase(),
      buildingId: formState.buildingId,
      floorId: formState.floorId,
      type: formState.type,
      lengthMeters: formState.lengthMeters,
      widthMeters: formState.widthMeters,
      seatingCapacity: formState.seatingCapacity,
      maxOccupancy: formState.maxOccupancy,
      facilities,
      status: formState.status,
      description: formState.description.trim(),
      condition: formState.condition,
      climateControl: formState.climateControl,
      smartClassroomEnabled: formState.smartClassroomEnabled,
      projectorAvailable: formState.projectorAvailable,
      boardType: formState.boardType,
      internetAvailable: formState.internetAvailable,
      chairs: formState.chairs,
      tables: formState.tables,
      labEquipmentAvailable: formState.labEquipmentAvailable,
      powerBackupAvailable: formState.powerBackupAvailable,
      accessibilitySupport: formState.accessibilitySupport,
      maintenanceStatus: formState.maintenanceStatus,
      bookingAvailable: formState.bookingAvailable,
      maintenanceHistory,
    };

    setSubmitting(true);
    try {
      if (formState.id) {
        await facilityService.updateRoom(formState.id, payload, imageFile);
      } else {
        await facilityService.createRoom(payload, imageFile);
      }
      setShowModal(false);
      setFormState(emptyForm);
      setImageFile(null);
      await loadData();
    } catch (error) {
      window.alert(getApiError(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (!window.confirm("Delete this room profile?")) {
      return;
    }

    try {
      await facilityService.deleteRoom(roomId);
      await loadData();
    } catch (error) {
      window.alert(getApiError(error));
    }
  };

  if (loading) {
    return (
      <AdminLoadingState
        title="Loading Room Management"
        subtitle="Collecting room inventory, status, and facility readiness data."
      />
    );
  }

  if (!canManage) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-xl font-semibold text-foreground">Room Management</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          You do not have permission to manage rooms in this panel.
        </p>
      </div>
    );
  }

  const selectedBuildingData = buildings.find(b => b.id === buildingFilter);
  const selectedFloorData = floors.find(f => f.id === floorFilter);

  const breadcrumbItems = [];
  breadcrumbItems.push({ label: "Room Management", icon: <DoorOpen className="h-4 w-4" /> });
  if (selectedBuildingData) {
    breadcrumbItems.push({
      label: selectedBuildingData.name,
      icon: <Building2 className="h-4 w-4" />,
    });
  }
  if (selectedFloorData) {
    breadcrumbItems.push({
      label: selectedFloorData.floorName,
      icon: <Layers className="h-4 w-4" />,
    });
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Breadcrumb */}
      <Breadcrumb items={breadcrumbItems} />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Room Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage room inventory, facilities, occupancy, and smart classroom readiness.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-5 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl"
        >
          <Plus size={20} />
          Add Room
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-6 border border-border hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">Total Rooms</p>
            <DoorOpen className="h-5 w-5 text-primary/70" />
          </div>
          <p className="text-3xl font-bold text-foreground">{stats.total}</p>
        </div>
        <div className="glass-card rounded-2xl p-6 border border-border hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">Available</p>
            <DoorOpen className="h-5 w-5 text-emerald-600" />
          </div>
          <p className="text-3xl font-bold text-emerald-600">{stats.available}</p>
        </div>
        <div className="glass-card rounded-2xl p-6 border border-border hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">Occupied</p>
            <DoorOpen className="h-5 w-5 text-amber-600" />
          </div>
          <p className="text-3xl font-bold text-amber-600">{stats.occupied}</p>
        </div>
        <div className="glass-card rounded-2xl p-6 border border-border hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">Under Maintenance</p>
            <DoorOpen className="h-5 w-5 text-red-600" />
          </div>
          <p className="text-3xl font-bold text-red-600">{stats.maintenance}</p>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-4 border border-border">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search room, code, building, or floor"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border bg-background text-sm"
            />
          </div>

          <select
            value={buildingFilter}
            onChange={(event) => setBuildingFilter(event.target.value)}
            className="px-3 py-2.5 rounded-xl border border-border bg-background text-sm"
          >
            <option value="">All Buildings</option>
            {buildings.map((building) => (
              <option key={building.id} value={building.id}>
                {building.name}
              </option>
            ))}
          </select>

          <select
            value={floorFilter}
            onChange={(event) => setFloorFilter(event.target.value)}
            className="px-3 py-2.5 rounded-xl border border-border bg-background text-sm"
          >
            <option value="">All Floors</option>
            {floorsForSelectedBuilding.map((floor) => (
              <option key={floor.id} value={floor.id}>
                {floor.floorName}
              </option>
            ))}
          </select>

          <div className="grid grid-cols-2 gap-3">
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              className="px-3 py-2.5 rounded-xl border border-border bg-background text-sm"
            >
              <option value="">All Types</option>
              {roomTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="px-3 py-2.5 rounded-xl border border-border bg-background text-sm"
            >
              <option value="">All Status</option>
              {roomStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Room</th>
                <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Building / Floor</th>
                <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Type</th>
                <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Capacity</th>
                <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Area</th>
                <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Booking</th>
                <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRooms.map((room) => {
                const building = buildings.find((entry) => entry.id === room.buildingId);
                const floor = floors.find((entry) => entry.id === room.floorId);
                return (
                  <tr key={room.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-muted/50 overflow-hidden flex items-center justify-center">
                          {room.imageUrl ? (
                            <img src={room.imageUrl} alt={room.name} className="w-full h-full object-cover" />
                          ) : (
                            <DoorOpen size={14} className="text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{room.name}</p>
                          <p className="text-xs text-muted-foreground">{room.code}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm text-muted-foreground">
                        <p className="flex items-center gap-1.5">
                          <Building2 size={13} /> {building?.name || "Unknown Building"}
                        </p>
                        <p className="flex items-center gap-1.5 mt-1">
                          <Layers size={13} /> {floor?.floorName || "Unknown Floor"}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-foreground">{room.type}</td>
                    <td className="py-3 px-4 text-sm text-foreground">
                      {room.seatingCapacity} seats / {room.maxOccupancy} max
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">{room.areaSqMeters} sqm</td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusBadgeClass[room.status]}`}>
                        {room.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-xs font-medium ${room.bookingAvailable ? "text-success" : "text-muted-foreground"}`}>
                        {room.bookingAvailable ? "Enabled" : "Disabled"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onOpenRoomDetails(room.id)}
                          className="px-2.5 py-1.5 rounded-lg border border-border text-xs hover:bg-muted transition-colors"
                        >
                          <Eye size={12} className="inline mr-1" />
                          View
                        </button>
                        <button
                          onClick={() => openEditModal(room)}
                          className="w-8 h-8 rounded-lg border border-border hover:bg-muted transition-colors"
                        >
                          <Edit size={13} className="mx-auto text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => void handleDeleteRoom(room.id)}
                          className="w-8 h-8 rounded-lg border border-border hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 size={13} className="mx-auto text-destructive" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {filteredRooms.length === 0 && (
        <div className="glass-card rounded-2xl border border-border p-12 text-center">
          <DoorOpen size={42} className="mx-auto text-muted-foreground mb-3" />
          <p className="font-semibold text-foreground">No rooms found</p>
          <p className="text-sm text-muted-foreground mt-1">Try changing your filters or create a new room entry.</p>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-foreground mb-4">{formState.id ? "Edit Room" : "Add Room"}</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Room Name</label>
                <input
                  value={formState.name}
                  onChange={(event) => {
                    setFormState((current) => ({ ...current, name: event.target.value }));
                    setFormErrors((current) => ({ ...current, name: undefined }));
                  }}
                  className={`w-full px-3 py-2.5 rounded-xl border bg-background text-sm ${formErrors.name ? "border-destructive" : "border-border"}`}
                />
                {formErrors.name && <p className="mt-1 text-xs text-destructive">{formErrors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Room Code</label>
                <input
                  value={formState.code}
                  onChange={(event) => {
                    setFormState((current) => ({ ...current, code: event.target.value.toUpperCase() }));
                    setFormErrors((current) => ({ ...current, code: undefined }));
                  }}
                  className={`w-full px-3 py-2.5 rounded-xl border bg-background text-sm ${formErrors.code ? "border-destructive" : "border-border"}`}
                />
                {formErrors.code && <p className="mt-1 text-xs text-destructive">{formErrors.code}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Building</label>
                <select
                  value={formState.buildingId}
                  onChange={(event) => {
                    const buildingId = event.target.value;
                    const firstFloorId = floors.find((floor) => floor.buildingId === buildingId)?.id || "";
                    setFormState((current) => ({ ...current, buildingId, floorId: firstFloorId }));
                    setFormErrors((current) => ({ ...current, buildingId: undefined, floorId: undefined }));
                  }}
                  className={`w-full px-3 py-2.5 rounded-xl border bg-background text-sm ${formErrors.buildingId ? "border-destructive" : "border-border"}`}
                >
                  <option value="">Select Building</option>
                  {buildings.map((building) => (
                    <option key={building.id} value={building.id}>
                      {building.name}
                    </option>
                  ))}
                </select>
                {formErrors.buildingId && <p className="mt-1 text-xs text-destructive">{formErrors.buildingId}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Floor</label>
                <select
                  value={formState.floorId}
                  onChange={(event) => {
                    setFormState((current) => ({ ...current, floorId: event.target.value }));
                    setFormErrors((current) => ({ ...current, floorId: undefined }));
                  }}
                  className={`w-full px-3 py-2.5 rounded-xl border bg-background text-sm ${formErrors.floorId ? "border-destructive" : "border-border"}`}
                >
                  <option value="">Select Floor</option>
                  {floors
                    .filter((floor) => floor.buildingId === formState.buildingId)
                    .map((floor) => (
                      <option key={floor.id} value={floor.id}>
                        {floor.floorName}
                      </option>
                    ))}
                </select>
                {formErrors.floorId && <p className="mt-1 text-xs text-destructive">{formErrors.floorId}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Room Type</label>
                <select
                  value={formState.type}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, type: event.target.value as RoomType }))
                  }
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm"
                >
                  {roomTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Status</label>
                <select
                  value={formState.status}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, status: event.target.value as RoomStatus }))
                  }
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm"
                >
                  {roomStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Length (m)</label>
                <input
                  type="number"
                  min={1}
                  value={formState.lengthMeters}
                  onChange={(event) => {
                    setFormState((current) => ({ ...current, lengthMeters: Number(event.target.value || 1) }));
                    setFormErrors((current) => ({ ...current, lengthMeters: undefined }));
                  }}
                  className={`w-full px-3 py-2.5 rounded-xl border bg-background text-sm ${formErrors.lengthMeters ? "border-destructive" : "border-border"}`}
                />
                {formErrors.lengthMeters && <p className="mt-1 text-xs text-destructive">{formErrors.lengthMeters}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Width (m)</label>
                <input
                  type="number"
                  min={1}
                  value={formState.widthMeters}
                  onChange={(event) => {
                    setFormState((current) => ({ ...current, widthMeters: Number(event.target.value || 1) }));
                    setFormErrors((current) => ({ ...current, widthMeters: undefined }));
                  }}
                  className={`w-full px-3 py-2.5 rounded-xl border bg-background text-sm ${formErrors.widthMeters ? "border-destructive" : "border-border"}`}
                />
                {formErrors.widthMeters && <p className="mt-1 text-xs text-destructive">{formErrors.widthMeters}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Seating Capacity</label>
                <input
                  type="number"
                  min={1}
                  value={formState.seatingCapacity}
                  onChange={(event) => {
                    setFormState((current) => ({ ...current, seatingCapacity: Number(event.target.value || 1) }));
                    setFormErrors((current) => ({ ...current, seatingCapacity: undefined, maxOccupancy: undefined }));
                  }}
                  className={`w-full px-3 py-2.5 rounded-xl border bg-background text-sm ${formErrors.seatingCapacity ? "border-destructive" : "border-border"}`}
                />
                {formErrors.seatingCapacity && <p className="mt-1 text-xs text-destructive">{formErrors.seatingCapacity}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Max Occupancy</label>
                <input
                  type="number"
                  min={1}
                  value={formState.maxOccupancy}
                  onChange={(event) => {
                    setFormState((current) => ({ ...current, maxOccupancy: Number(event.target.value || 1) }));
                    setFormErrors((current) => ({ ...current, maxOccupancy: undefined }));
                  }}
                  className={`w-full px-3 py-2.5 rounded-xl border bg-background text-sm ${formErrors.maxOccupancy ? "border-destructive" : "border-border"}`}
                />
                {formErrors.maxOccupancy && <p className="mt-1 text-xs text-destructive">{formErrors.maxOccupancy}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Room Condition</label>
                <select
                  value={formState.condition}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, condition: event.target.value as RoomCondition }))
                  }
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm"
                >
                  {roomConditions.map((condition) => (
                    <option key={condition} value={condition}>
                      {condition}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">AC / Non-AC</label>
                <select
                  value={formState.climateControl}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, climateControl: event.target.value as ClimateControl }))
                  }
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm"
                >
                  {climateModes.map((mode) => (
                    <option key={mode} value={mode}>
                      {mode}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Board Type</label>
                <select
                  value={formState.boardType}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, boardType: event.target.value as BoardType }))
                  }
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm"
                >
                  {boardTypes.map((board) => (
                    <option key={board} value={board}>
                      {board}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Maintenance Status</label>
                <select
                  value={formState.maintenanceStatus}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, maintenanceStatus: event.target.value as MaintenanceStatus }))
                  }
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm"
                >
                  {maintenanceStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Number of Chairs</label>
                <input
                  type="number"
                  min={0}
                  value={formState.chairs}
                  onChange={(event) => {
                    setFormState((current) => ({ ...current, chairs: Number(event.target.value || 0) }));
                    setFormErrors((current) => ({ ...current, chairs: undefined }));
                  }}
                  className={`w-full px-3 py-2.5 rounded-xl border bg-background text-sm ${formErrors.chairs ? "border-destructive" : "border-border"}`}
                />
                {formErrors.chairs && <p className="mt-1 text-xs text-destructive">{formErrors.chairs}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Number of Tables</label>
                <input
                  type="number"
                  min={0}
                  value={formState.tables}
                  onChange={(event) => {
                    setFormState((current) => ({ ...current, tables: Number(event.target.value || 0) }));
                    setFormErrors((current) => ({ ...current, tables: undefined }));
                  }}
                  className={`w-full px-3 py-2.5 rounded-xl border bg-background text-sm ${formErrors.tables ? "border-destructive" : "border-border"}`}
                />
                {formErrors.tables && <p className="mt-1 text-xs text-destructive">{formErrors.tables}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-1">Room Image {formState.id ? "(optional on update)" : ""}</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    setImageFile(event.target.files?.[0] || null);
                    setFormErrors((current) => ({ ...current, imageFile: undefined }));
                  }}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm"
                />
                {imageFile && <p className="mt-1 text-xs text-muted-foreground">Selected: {imageFile.name}</p>}
                {!imageFile && formState.imageUrl && (
                  <p className="mt-1 text-xs text-muted-foreground">Existing image will be kept.</p>
                )}
                {formErrors.imageFile && <p className="mt-1 text-xs text-destructive">{formErrors.imageFile}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-1">Available Facilities (comma separated)</label>
                <input
                  value={formState.facilities}
                  onChange={(event) => {
                    setFormState((current) => ({ ...current, facilities: event.target.value }));
                    setFormErrors((current) => ({ ...current, facilities: undefined }));
                  }}
                  className={`w-full px-3 py-2.5 rounded-xl border bg-background text-sm ${formErrors.facilities ? "border-destructive" : "border-border"}`}
                />
                {formErrors.facilities && <p className="mt-1 text-xs text-destructive">{formErrors.facilities}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-1">Maintenance History (comma separated)</label>
                <input
                  value={formState.maintenanceHistory}
                  onChange={(event) => setFormState((current) => ({ ...current, maintenanceHistory: event.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm"
                />
              </div>

              <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  { key: "smartClassroomEnabled", label: "Smart Classroom" },
                  { key: "projectorAvailable", label: "Projector" },
                  { key: "internetAvailable", label: "Internet" },
                  { key: "labEquipmentAvailable", label: "Lab Equipment" },
                  { key: "powerBackupAvailable", label: "Power Backup" },
                  { key: "accessibilitySupport", label: "Accessibility" },
                  { key: "bookingAvailable", label: "Booking Available" },
                ].map((option) => (
                  <label key={option.key} className="flex items-center gap-2 text-sm text-foreground">
                    <input
                      type="checkbox"
                      checked={Boolean(formState[option.key as keyof RoomFormState])}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          [option.key]: event.target.checked,
                        }))
                      }
                    />
                    {option.label}
                  </label>
                ))}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-1">Description</label>
                <textarea
                  rows={3}
                  value={formState.description}
                  onChange={(event) => {
                    setFormState((current) => ({ ...current, description: event.target.value }));
                    setFormErrors((current) => ({ ...current, description: undefined }));
                  }}
                  className={`w-full px-3 py-2.5 rounded-xl border bg-background text-sm resize-none ${formErrors.description ? "border-destructive" : "border-border"}`}
                />
                {formErrors.description && <p className="mt-1 text-xs text-destructive">{formErrors.description}</p>}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2.5 rounded-xl border border-border text-sm hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={submitting}
                onClick={() => void handleSaveRoom()}
                className="px-4 py-2.5 rounded-xl bg-primary text-white text-sm hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                {submitting ? "Saving..." : formState.id ? "Save Changes" : "Create Room"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

