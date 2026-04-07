import { Building2, DoorOpen, Edit, Eye, Layers, MapPin, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { buildingStatuses, buildingTypes } from "@/data/campusManagementConstants";
import type { Building, BuildingStatus, Floor, Room } from "@/types/campusManagement";
import facilityService, { BuildingUpsertPayload } from "@/services/facilityService";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { BuildingCard } from "@/components/common/BuildingCard";
import { AdminLoadingState } from "@/components/admin/dashboard/AdminLoadingState";

interface BuildingManagementPageProps {
  onOpenBuildingDetails: (buildingId: string) => void;
  onOpenFloorManagement: (buildingId?: string) => void;
  onOpenRoomManagement: (buildingId?: string) => void;
}

interface BuildingFormState {
  id?: string;
  name: string;
  code: string;
  type: string;
  campus: string;
  location: string;
  totalFloors: number;
  description: string;
  status: BuildingStatus;
  imageUrl: string;
  yearEstablished: number;
  manager: string;
}

type BuildingFormErrors = Partial<Record<keyof BuildingFormState | "imageFile", string>>;

const emptyForm: BuildingFormState = {
  name: "",
  code: "",
  type: "Academic",
  campus: "",
  location: "",
  totalFloors: 1,
  description: "",
  status: "Active",
  imageUrl: "",
  yearEstablished: new Date().getFullYear(),
  manager: "",
};

const statusBadgeClass: Record<BuildingStatus, string> = {
  Active: "bg-success/10 text-success",
  "Under Maintenance": "bg-warning/10 text-warning",
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

export const BuildingManagementPage = ({
  onOpenBuildingDetails,
  onOpenFloorManagement,
  onOpenRoomManagement,
}: BuildingManagementPageProps) => {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedCampus, setSelectedCampus] = useState<string>("");
  const [showModal, setShowModal] = useState(false);
  const [formState, setFormState] = useState<BuildingFormState>(emptyForm);
  const [formErrors, setFormErrors] = useState<BuildingFormErrors>({});
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
    void loadData();
  }, []);

  const campuses = useMemo(() => {
    return [...new Set(buildings.map((building) => building.campus))].sort();
  }, [buildings]);

  const filteredBuildings = useMemo(() => {
    return buildings.filter((building) => {
      const matchesSearch =
        building.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        building.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        building.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        building.manager.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = !selectedStatus || building.status === selectedStatus;
      const matchesType = !selectedType || building.type === selectedType;
      const matchesCampus = !selectedCampus || building.campus === selectedCampus;
      return matchesSearch && matchesStatus && matchesType && matchesCampus;
    });
  }, [buildings, searchTerm, selectedStatus, selectedType, selectedCampus]);

  const totals = useMemo(() => {
    return {
      buildings: buildings.length,
      activeBuildings: buildings.filter((building) => building.status === "Active").length,
      totalFloors: floors.length,
      totalRooms: rooms.length,
    };
  }, [buildings, floors, rooms]);

  const getBuildingRoomCount = (buildingId: string) =>
    rooms.filter((room) => room.buildingId === buildingId).length;

  const getBuildingCapacity = (buildingId: string) =>
    rooms
      .filter((room) => room.buildingId === buildingId)
      .reduce((sum, room) => sum + room.maxOccupancy, 0);

  const getFloorCount = (buildingId: string) =>
    floors.filter((floor) => floor.buildingId === buildingId).length;

  const openCreateModal = () => {
    setFormState(emptyForm);
    setFormErrors({});
    setImageFile(null);
    setShowModal(true);
  };

  const openEditModal = (building: Building) => {
    setFormState({
      id: building.id,
      name: building.name,
      code: building.code,
      type: building.type,
      campus: building.campus,
      location: building.location,
      totalFloors: building.totalFloors,
      description: building.description,
      status: building.status,
      imageUrl: building.imageUrl || "",
      yearEstablished: building.yearEstablished,
      manager: building.manager,
    });
    setFormErrors({});
    setImageFile(null);
    setShowModal(true);
  };

  const validateBuildingForm = () => {
    const errors: BuildingFormErrors = {};
    const currentYear = new Date().getFullYear();

    if (!formState.name.trim()) {
      errors.name = "Building name is required.";
    }
    if (!formState.code.trim()) {
      errors.code = "Building code is required.";
    } else if (!/^[A-Z0-9-]{2,12}$/.test(formState.code.trim().toUpperCase())) {
      errors.code = "Use 2-12 uppercase letters, numbers, or hyphen.";
    }
    if (!formState.campus.trim()) {
      errors.campus = "Campus or branch is required.";
    }
    if (!formState.location.trim()) {
      errors.location = "Building location is required.";
    }
    if (!formState.manager.trim()) {
      errors.manager = "Person in charge is required.";
    }
    if (!formState.description.trim()) {
      errors.description = "Description is required.";
    }
    if (formState.totalFloors < 1 || formState.totalFloors > 60) {
      errors.totalFloors = "Number of floors must be between 1 and 60.";
    }
    if (formState.yearEstablished < 1800 || formState.yearEstablished > currentYear) {
      errors.yearEstablished = `Year must be between 1800 and ${currentYear}.`;
    }
    if (!formState.id && !imageFile) {
      errors.imageFile = "Building image is required.";
    }

    const codeAlreadyExists = buildings.some(
      (building) =>
        building.id !== formState.id &&
        building.code.toLowerCase() === formState.code.trim().toLowerCase()
    );
    if (codeAlreadyExists) {
      errors.code = "This building code already exists.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveBuilding = async () => {
    if (!validateBuildingForm()) {
      return;
    }

    const payload: BuildingUpsertPayload = {
      name: formState.name.trim(),
      code: formState.code.trim().toUpperCase(),
      type: formState.type,
      campus: formState.campus.trim(),
      location: formState.location.trim(),
      totalFloors: formState.totalFloors,
      description: formState.description.trim(),
      status: formState.status,
      yearEstablished: formState.yearEstablished,
      manager: formState.manager.trim(),
    };

    setSubmitting(true);
    try {
      if (formState.id) {
        await facilityService.updateBuilding(formState.id, payload, imageFile);
      } else {
        await facilityService.createBuilding(payload, imageFile);
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

  const handleDeleteBuilding = async (buildingId: string) => {
    if (!window.confirm("Delete this building?")) {
      return;
    }

    try {
      await facilityService.deleteBuilding(buildingId);
      await loadData();
    } catch (error) {
      window.alert(getApiError(error));
    }
  };

  if (loading) {
    return (
      <AdminLoadingState
        title="Loading Building Management"
        subtitle="Syncing buildings, floors, and room capacity details."
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Breadcrumb */}
      <Breadcrumb items={[{ label: "Building Management", icon: <Building2 className="h-4 w-4" /> }]} />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Building Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage university buildings, metadata, floor count, and responsible managers.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-5 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl"
        >
          <Plus size={20} />
          Add Building
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-6 border border-border hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">Total Buildings</p>
            <Building2 className="h-5 w-5 text-primary/70" />
          </div>
          <p className="text-3xl font-bold text-foreground">{totals.buildings}</p>
        </div>
        <div className="glass-card rounded-2xl p-6 border border-border hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">Active Buildings</p>
            <Building2 className="h-5 w-5 text-emerald-600" />
          </div>
          <p className="text-3xl font-bold text-emerald-600">{totals.activeBuildings}</p>
        </div>
        <div className="glass-card rounded-2xl p-6 border border-border hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">Registered Floors</p>
            <Layers className="h-5 w-5 text-primary/70" />
          </div>
          <p className="text-3xl font-bold text-foreground">{totals.totalFloors}</p>
        </div>
        <div className="glass-card rounded-2xl p-6 border border-border hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">Registered Rooms</p>
            <DoorOpen className="h-5 w-5 text-primary/70" />
          </div>
          <p className="text-3xl font-bold text-foreground">{totals.totalRooms}</p>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-4 border border-border">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search building name, code, location, or manager"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <select
            value={selectedCampus}
            onChange={(event) => setSelectedCampus(event.target.value)}
            className="px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">All Campuses</option>
            {campuses.map((campus) => (
              <option key={campus} value={campus}>
                {campus}
              </option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <select
              value={selectedType}
              onChange={(event) => setSelectedType(event.target.value)}
              className="px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">All Types</option>
              {buildingTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <select
              value={selectedStatus}
              onChange={(event) => setSelectedStatus(event.target.value)}
              className="px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">All Status</option>
              {buildingStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {filteredBuildings.map((building) => {
          const buildingRoomCount = getBuildingRoomCount(building.id);
          const buildingCapacity = getBuildingCapacity(building.id);
          const buildingFloorCount = getFloorCount(building.id);
          const creatorName = [building.createdBy?.firstName, building.createdBy?.lastName].filter(Boolean).join(" ");

          return (
            <div key={building.id} className="glass-card rounded-2xl border border-border p-5">
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                    {building.imageUrl ? (
                      <img src={building.imageUrl} alt={building.name} className="w-full h-full object-cover" />
                    ) : (
                      <Building2 className="text-primary" size={22} />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center flex-wrap gap-2">
                      <h3 className="text-lg font-semibold text-foreground">{building.name}</h3>
                      <span className="px-2 py-0.5 rounded-md bg-muted text-xs text-muted-foreground font-medium">
                        {building.code}
                      </span>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusBadgeClass[building.status]}`}>
                        {building.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <MapPin size={14} />
                      <span>{building.campus}</span>
                      <span>â€¢</span>
                      <span>{building.location}</span>
                    </div>

                    <p className="text-sm text-muted-foreground mt-2 max-w-3xl">{building.description}</p>

                    <div className="flex flex-wrap items-center gap-5 mt-3 text-sm">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Layers size={14} />
                        <span className="font-medium text-foreground">{buildingFloorCount}</span> floors
                      </span>
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <DoorOpen size={14} />
                        <span className="font-medium text-foreground">{buildingRoomCount}</span> rooms
                      </span>
                      <span className="text-muted-foreground">
                        Capacity: <span className="font-medium text-foreground">{buildingCapacity}</span>
                      </span>
                      <span className="text-muted-foreground">
                        Manager: <span className="font-medium text-foreground">{building.manager}</span>
                      </span>
                      {building.createdBy && (
                        <span className="text-muted-foreground">
                          Created by:{" "}
                          <span className="font-medium text-foreground">{creatorName || building.createdBy.email}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => onOpenBuildingDetails(building.id)}
                    className="px-3 py-2 rounded-lg border border-border text-sm hover:bg-muted transition-colors"
                  >
                    <Eye size={14} className="inline mr-1" />
                    View Details
                  </button>
                  <button
                    onClick={() => onOpenFloorManagement(building.id)}
                    className="px-3 py-2 rounded-lg border border-border text-sm hover:bg-muted transition-colors"
                  >
                    Manage Floors
                  </button>
                  <button
                    onClick={() => onOpenRoomManagement(building.id)}
                    className="px-3 py-2 rounded-lg border border-border text-sm hover:bg-muted transition-colors"
                  >
                    Manage Rooms
                  </button>
                  <button
                    onClick={() => openEditModal(building)}
                    className="w-9 h-9 rounded-lg border border-border hover:bg-muted transition-colors"
                    title="Edit building"
                  >
                    <Edit size={14} className="mx-auto text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => void handleDeleteBuilding(building.id)}
                    className="w-9 h-9 rounded-lg border border-border hover:bg-destructive/10 transition-colors"
                    title="Delete building"
                  >
                    <Trash2 size={14} className="mx-auto text-destructive" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredBuildings.length === 0 && (
        <div className="glass-card rounded-2xl border border-border p-10 text-center">
          <Building2 size={40} className="mx-auto text-muted-foreground mb-3" />
          <p className="text-foreground font-semibold">No buildings found</p>
          <p className="text-sm text-muted-foreground mt-1">Adjust filters or add a new building profile.</p>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-2xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-foreground mb-4">
              {formState.id ? "Edit Building" : "Add Building"}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Building Name</label>
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
                <label className="block text-sm font-medium text-foreground mb-1">Building Code</label>
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
                <label className="block text-sm font-medium text-foreground mb-1">Building Type</label>
                <select
                  value={formState.type}
                  onChange={(event) => setFormState((current) => ({ ...current, type: event.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm"
                >
                  {buildingTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Campus / Branch Name</label>
                <input
                  value={formState.campus}
                  onChange={(event) => {
                    setFormState((current) => ({ ...current, campus: event.target.value }));
                    setFormErrors((current) => ({ ...current, campus: undefined }));
                  }}
                  className={`w-full px-3 py-2.5 rounded-xl border bg-background text-sm ${formErrors.campus ? "border-destructive" : "border-border"}`}
                />
                {formErrors.campus && <p className="mt-1 text-xs text-destructive">{formErrors.campus}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Building Location</label>
                <input
                  value={formState.location}
                  onChange={(event) => {
                    setFormState((current) => ({ ...current, location: event.target.value }));
                    setFormErrors((current) => ({ ...current, location: undefined }));
                  }}
                  className={`w-full px-3 py-2.5 rounded-xl border bg-background text-sm ${formErrors.location ? "border-destructive" : "border-border"}`}
                />
                {formErrors.location && <p className="mt-1 text-xs text-destructive">{formErrors.location}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Number of Floors</label>
                <input
                  type="number"
                  min={1}
                  value={formState.totalFloors}
                  onChange={(event) => {
                    setFormState((current) => ({ ...current, totalFloors: Number(event.target.value || 1) }));
                    setFormErrors((current) => ({ ...current, totalFloors: undefined }));
                  }}
                  className={`w-full px-3 py-2.5 rounded-xl border bg-background text-sm ${formErrors.totalFloors ? "border-destructive" : "border-border"}`}
                />
                {formErrors.totalFloors && <p className="mt-1 text-xs text-destructive">{formErrors.totalFloors}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Year Established</label>
                <input
                  type="number"
                  min={1900}
                  max={2100}
                  value={formState.yearEstablished}
                  onChange={(event) => {
                    setFormState((current) => ({ ...current, yearEstablished: Number(event.target.value || 2000) }));
                    setFormErrors((current) => ({ ...current, yearEstablished: undefined }));
                  }}
                  className={`w-full px-3 py-2.5 rounded-xl border bg-background text-sm ${formErrors.yearEstablished ? "border-destructive" : "border-border"}`}
                />
                {formErrors.yearEstablished && <p className="mt-1 text-xs text-destructive">{formErrors.yearEstablished}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Person in Charge</label>
                <input
                  value={formState.manager}
                  onChange={(event) => {
                    setFormState((current) => ({ ...current, manager: event.target.value }));
                    setFormErrors((current) => ({ ...current, manager: undefined }));
                  }}
                  className={`w-full px-3 py-2.5 rounded-xl border bg-background text-sm ${formErrors.manager ? "border-destructive" : "border-border"}`}
                />
                {formErrors.manager && <p className="mt-1 text-xs text-destructive">{formErrors.manager}</p>}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-1">Status</label>
                <select
                  value={formState.status}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, status: event.target.value as BuildingStatus }))
                  }
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm"
                >
                  {buildingStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-1">
                  Building Image {formState.id ? "(optional on update)" : ""}
                </label>
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
                onClick={() => void handleSaveBuilding()}
                className="px-4 py-2.5 rounded-xl bg-primary text-white text-sm hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                {submitting ? "Saving..." : formState.id ? "Save Changes" : "Create Building"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

