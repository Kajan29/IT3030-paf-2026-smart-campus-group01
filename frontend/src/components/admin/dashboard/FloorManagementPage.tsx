import { Building2, Edit, Layers, Map, Plus, Search, Trash2, DoorOpen } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { floorAccessibilityOptions } from "@/data/campusManagementConstants";
import type { Building, Floor, FloorAccessibility, Room } from "@/types/campusManagement";
import facilityService, { FloorUpsertPayload } from "@/services/facilityService";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { FloorCard } from "@/components/common/FloorCard";
import { AdminLoadingState } from "@/components/admin/dashboard/AdminLoadingState";

interface FloorManagementPageProps {
  selectedBuildingId?: string | null;
  onOpenBuildingDetails: (buildingId: string) => void;
  onOpenRoomManagement: (buildingId?: string, floorId?: string) => void;
}

interface FloorFormState {
  id?: string;
  buildingId: string;
  floorNumber: number;
  floorName: string;
  description: string;
  accessibility: FloorAccessibility;
  mapUrl: string;
}

type FloorFormErrors = Partial<Record<keyof FloorFormState, string>>;

const emptyForm: FloorFormState = {
  buildingId: "",
  floorNumber: 0,
  floorName: "",
  description: "",
  accessibility: "Accessible",
  mapUrl: "",
};

const accessibilityTone: Record<FloorAccessibility, string> = {
  Accessible: "bg-success/10 text-success",
  Partial: "bg-warning/10 text-warning",
  "Not Accessible": "bg-destructive/10 text-destructive",
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

export const FloorManagementPage = ({
  selectedBuildingId,
  onOpenBuildingDetails,
  onOpenRoomManagement,
}: FloorManagementPageProps) => {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [buildingFilter, setBuildingFilter] = useState(selectedBuildingId || "");
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [formState, setFormState] = useState<FloorFormState>(emptyForm);
  const [formErrors, setFormErrors] = useState<FloorFormErrors>({});

  useEffect(() => {
    if (selectedBuildingId) {
      setBuildingFilter(selectedBuildingId);
    }
  }, [selectedBuildingId]);

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
    void loadData();
  }, []);

  const filteredFloors = useMemo(() => {
    return floors
      .filter((floor) => {
        const building = buildings.find((entry) => entry.id === floor.buildingId);
        const matchesBuilding = !buildingFilter || floor.buildingId === buildingFilter;
        const searchable = `${floor.floorName} ${floor.description} ${building?.name || ""}`.toLowerCase();
        const matchesSearch = searchable.includes(searchTerm.toLowerCase());
        return matchesBuilding && matchesSearch;
      })
      .sort((a, b) => a.floorNumber - b.floorNumber);
  }, [floors, buildings, buildingFilter, searchTerm]);

  const stats = useMemo(() => {
    return {
      totalFloors: floors.length,
      accessibleFloors: floors.filter((floor) => floor.accessibility === "Accessible").length,
      roomsTracked: rooms.length,
      buildingsCovered: new Set(floors.map((floor) => floor.buildingId)).size,
    };
  }, [floors, rooms]);

  const openCreateModal = () => {
    const fallbackBuilding = buildingFilter || buildings[0]?.id || "";
    setFormState({ ...emptyForm, buildingId: fallbackBuilding });
    setFormErrors({});
    setShowModal(true);
  };

  const openEditModal = (floor: Floor) => {
    setFormState({
      id: floor.id,
      buildingId: floor.buildingId,
      floorNumber: floor.floorNumber,
      floorName: floor.floorName,
      description: floor.description,
      accessibility: floor.accessibility,
      mapUrl: floor.mapUrl || "",
    });
    setFormErrors({});
    setShowModal(true);
  };

  const validateFloorForm = () => {
    const errors: FloorFormErrors = {};

    if (!formState.buildingId) {
      errors.buildingId = "Building is required.";
    }
    if (!formState.floorName.trim()) {
      errors.floorName = "Floor name is required.";
    }
    if (!formState.description.trim()) {
      errors.description = "Floor description is required.";
    }
    if (formState.floorNumber < 0 || formState.floorNumber > 100) {
      errors.floorNumber = "Floor number must be between 0 and 100.";
    }

    const duplicateFloorNumber = floors.some(
      (floor) =>
        floor.id !== formState.id &&
        floor.buildingId === formState.buildingId &&
        floor.floorNumber === formState.floorNumber
    );
    if (duplicateFloorNumber) {
      errors.floorNumber = "This floor number already exists in the selected building.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveFloor = async () => {
    if (!validateFloorForm()) {
      return;
    }

    const payload: FloorUpsertPayload = {
      buildingId: formState.buildingId,
      floorNumber: formState.floorNumber,
      floorName: formState.floorName.trim(),
      description: formState.description.trim(),
      accessibility: formState.accessibility,
      mapUrl: formState.mapUrl.trim() || undefined,
    };

    setSubmitting(true);
    try {
      if (formState.id) {
        await facilityService.updateFloor(formState.id, payload);
      } else {
        await facilityService.createFloor(payload);
      }
      setShowModal(false);
      setFormState(emptyForm);
      await loadData();
    } catch (error) {
      window.alert(getApiError(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteFloor = async (floorId: string) => {
    if (!window.confirm("Delete this floor record?")) {
      return;
    }

    try {
      await facilityService.deleteFloor(floorId);
      await loadData();
    } catch (error) {
      window.alert(getApiError(error));
    }
  };

  if (loading) {
    return (
      <AdminLoadingState
        title="Loading Floor Management"
        subtitle="Preparing floor layouts, accessibility, and room coverage."
      />
    );
  }

  const selectedBuildingData = buildings.find(b => b.id === buildingFilter);

  const breadcrumbItems = [];
  breadcrumbItems.push({ label: "Floor Management", icon: <Layers className="h-4 w-4" /> });
  if (selectedBuildingData) {
    breadcrumbItems.push({
      label: selectedBuildingData.name,
      icon: <Building2 className="h-4 w-4" />,
      onClick: () => onOpenBuildingDetails(selectedBuildingData.id)
    });
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Breadcrumb */}
      <Breadcrumb items={breadcrumbItems} />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Floor Management</h1>
          <p className="text-muted-foreground mt-2">
            Organize floors by building, accessibility profile, and room coverage.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-5 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl"
        >
          <Plus size={20} />
          Add Floor
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-6 border border-border hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">Total Floors</p>
            <Layers className="h-5 w-5 text-primary/70" />
          </div>
          <p className="text-3xl font-bold text-foreground">{stats.totalFloors}</p>
        </div>
        <div className="glass-card rounded-2xl p-6 border border-border hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">Accessible Floors</p>
            <Layers className="h-5 w-5 text-emerald-600" />
          </div>
          <p className="text-3xl font-bold text-emerald-600">{stats.accessibleFloors}</p>
        </div>
        <div className="glass-card rounded-2xl p-6 border border-border hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">Rooms Linked</p>
            <DoorOpen className="h-5 w-5 text-primary/70" />
          </div>
          <p className="text-3xl font-bold text-foreground">{stats.roomsTracked}</p>
        </div>
        <div className="glass-card rounded-2xl p-6 border border-border hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">Buildings Covered</p>
            <Building2 className="h-5 w-5 text-primary/70" />
          </div>
          <p className="text-3xl font-bold text-foreground">{stats.buildingsCovered}</p>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-4 border border-border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search floor name, description, or building"
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
        </div>
      </div>

      <div className="space-y-3">
        {filteredFloors.map((floor) => {
          const building = buildings.find((entry) => entry.id === floor.buildingId);
          const roomCount = rooms.filter((room) => room.floorId === floor.id).length;
          return (
            <div key={floor.id} className="glass-card rounded-2xl border border-border p-4">
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
                <div>
                  <div className="flex items-center flex-wrap gap-2">
                    <h3 className="text-base font-semibold text-foreground">{floor.floorName}</h3>
                    <span className="px-2 py-0.5 rounded-md bg-muted text-xs text-muted-foreground">
                      Floor {floor.floorNumber}
                    </span>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${accessibilityTone[floor.accessibility]}`}>
                      {floor.accessibility}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{floor.description}</p>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-2">
                    <span className="flex items-center gap-1.5">
                      <Building2 size={13} />
                      {building?.name || "Unknown Building"}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Layers size={13} />
                      {roomCount} rooms
                    </span>
                    {floor.mapUrl && (
                      <span className="flex items-center gap-1.5">
                        <Map size={13} />
                        Map uploaded
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => onOpenBuildingDetails(floor.buildingId)}
                    className="px-3 py-2 rounded-lg border border-border text-sm hover:bg-muted transition-colors"
                  >
                    Building Details
                  </button>
                  <button
                    onClick={() => onOpenRoomManagement(floor.buildingId, floor.id)}
                    className="px-3 py-2 rounded-lg border border-border text-sm hover:bg-muted transition-colors"
                  >
                    Manage Rooms
                  </button>
                  <button
                    onClick={() => openEditModal(floor)}
                    className="w-9 h-9 rounded-lg border border-border hover:bg-muted transition-colors"
                    title="Edit floor"
                  >
                    <Edit size={14} className="mx-auto text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => void handleDeleteFloor(floor.id)}
                    className="w-9 h-9 rounded-lg border border-border hover:bg-destructive/10 transition-colors"
                    title="Delete floor"
                  >
                    <Trash2 size={14} className="mx-auto text-destructive" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredFloors.length === 0 && (
        <div className="glass-card rounded-2xl border border-border p-12 text-center">
          <Layers size={42} className="mx-auto text-muted-foreground mb-3" />
          <p className="font-semibold text-foreground">No floors found</p>
          <p className="text-sm text-muted-foreground mt-1">Adjust filters or create a new floor record.</p>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-foreground mb-4">{formState.id ? "Edit Floor" : "Add Floor"}</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Building</label>
                <select
                  value={formState.buildingId}
                  onChange={(event) => {
                    setFormState((current) => ({ ...current, buildingId: event.target.value }));
                    setFormErrors((current) => ({ ...current, buildingId: undefined }));
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
                <label className="block text-sm font-medium text-foreground mb-1">Floor Number</label>
                <input
                  type="number"
                  value={formState.floorNumber}
                  onChange={(event) => {
                    setFormState((current) => ({ ...current, floorNumber: Number(event.target.value || 0) }));
                    setFormErrors((current) => ({ ...current, floorNumber: undefined }));
                  }}
                  className={`w-full px-3 py-2.5 rounded-xl border bg-background text-sm ${formErrors.floorNumber ? "border-destructive" : "border-border"}`}
                />
                {formErrors.floorNumber && <p className="mt-1 text-xs text-destructive">{formErrors.floorNumber}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Floor Name</label>
                <input
                  value={formState.floorName}
                  onChange={(event) => {
                    setFormState((current) => ({ ...current, floorName: event.target.value }));
                    setFormErrors((current) => ({ ...current, floorName: undefined }));
                  }}
                  className={`w-full px-3 py-2.5 rounded-xl border bg-background text-sm ${formErrors.floorName ? "border-destructive" : "border-border"}`}
                />
                {formErrors.floorName && <p className="mt-1 text-xs text-destructive">{formErrors.floorName}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Accessibility</label>
                <select
                  value={formState.accessibility}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      accessibility: event.target.value as FloorAccessibility,
                    }))
                  }
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm"
                >
                  {floorAccessibilityOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
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
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-1">Floor Map URL (Optional)</label>
                <input
                  value={formState.mapUrl}
                  onChange={(event) => setFormState((current) => ({ ...current, mapUrl: event.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm"
                />
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
                onClick={() => void handleSaveFloor()}
                className="px-4 py-2.5 rounded-xl bg-primary text-white text-sm hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                {submitting ? "Saving..." : formState.id ? "Save Changes" : "Create Floor"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

