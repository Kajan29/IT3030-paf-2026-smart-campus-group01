import { type ChangeEvent, useEffect, useMemo, useState } from "react";
import { Building2, CalendarDays, Clock3, DoorOpen, Download, Layers, Upload } from "lucide-react";
import { toast } from "react-toastify";
import { Breadcrumb, type BreadcrumbItem } from "@/components/common/Breadcrumb";
import { BuildingCard } from "@/components/common/BuildingCard";
import { FloorCard } from "@/components/common/FloorCard";
import { RoomCard } from "@/components/common/RoomCard";
import { AdminLoadingState } from "@/components/admin/dashboard/AdminLoadingState";
import { RoomDetailsPage } from "@/components/admin/dashboard/RoomDetailsPage";
import facilityService, { type RoomTimetableImportResult } from "@/services/facilityService";
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
  const [importingCampusExcel, setImportingCampusExcel] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [campusImportFileName, setCampusImportFileName] = useState("");
  const [campusImportResults, setCampusImportResults] = useState<RoomTimetableImportResult[]>([]);

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

  const handleDownloadTemplate = async () => {
    setDownloadingTemplate(true);
    try {
      const blob = await facilityService.downloadRoomTimetableImportTemplate();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "room-timetable-import-template.xlsx";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      toast.success("Template downloaded");
    } catch (error) {
      console.error(error);
      toast.error("Failed to download template");
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const handleCampusImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      toast.error("Only .xlsx files are supported");
      return;
    }

    setImportingCampusExcel(true);
    try {
      const results = await facilityService.importRoomTimetableFromExcel(file);
      setCampusImportResults(results);
      setCampusImportFileName(file.name);

      const importedCount = results.filter((result) => result.imported).length;
      const skippedCount = results.length - importedCount;

      if (importedCount > 0 && skippedCount === 0) {
        toast.success(`Imported ${importedCount} row${importedCount === 1 ? "" : "s"} across campus`);
      } else if (importedCount > 0) {
        toast.info(`Imported ${importedCount} row${importedCount === 1 ? "" : "s"}, skipped ${skippedCount}`);
      } else {
        toast.error("No rows imported. Check the import summary.");
      }
    } catch (error: any) {
      console.error(error);
      const message = error?.response?.data?.message || "Failed to import campus timetable file";
      toast.error(message);
    } finally {
      setImportingCampusExcel(false);
    }
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
      <input
        id="campus-timetable-import-input"
        type="file"
        accept=".xlsx"
        className="hidden"
        onChange={handleCampusImport}
      />

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
        <div className="mb-5 rounded-2xl border border-border bg-background/70 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Campus bulk timetable import</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Upload one Excel file for all buildings, floors, and rooms using buildingId/floorId/roomId columns.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleDownloadTemplate}
                disabled={downloadingTemplate}
                className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-semibold text-foreground transition hover:bg-muted/40 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Download className="h-4 w-4" />
                {downloadingTemplate ? "Preparing template..." : "Download template"}
              </button>
              <label
                htmlFor="campus-timetable-import-input"
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
              >
                <Upload className="h-4 w-4" />
                {importingCampusExcel ? "Importing..." : "Upload Excel for all buildings"}
              </label>
            </div>
          </div>

          {campusImportResults.length > 0 && (
            <div className="mt-4 rounded-xl border border-border/70 bg-card p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold text-foreground">Latest file: {campusImportFileName}</p>
                <p className="text-xs text-muted-foreground">
                  {campusImportResults.filter((result) => result.imported).length} imported / {campusImportResults.filter((result) => !result.imported).length} skipped
                </p>
              </div>
              <div className="mt-2 max-h-40 space-y-1 overflow-y-auto pr-1">
                {campusImportResults.map((result) => (
                  <div key={`${result.rowNumber}-${result.message}`} className="rounded-lg border border-border/60 px-2 py-1.5 text-xs text-foreground">
                    Row {result.rowNumber}: {result.message}
                    {result.roomCode ? ` | Room ${result.roomCode}` : ""}
                    {result.staffName ? ` | ${result.staffName}` : ""}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

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
