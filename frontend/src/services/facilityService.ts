import api from "./api";
import authService from "./authService";
import type {
  Building,
  BuildingStatus,
  CreatedByUser,
  Floor,
  FloorAccessibility,
  Room,
  RoomStatus,
  RoomType,
} from "@/types/campusManagement";
import type { RoomTimetableEntry as RoomTimetableEntryType } from "@/types/booking";

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

interface FacilitySnapshot {
  buildings: Building[];
  floors: Floor[];
  rooms: Room[];
}

interface ApiUserSummary {
  id: number;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  profilePicture?: string;
}

interface ApiBuilding {
  id: number;
  name: string;
  code: string;
  type: string;
  campus: string;
  location: string;
  totalFloors: number;
  description: string;
  status: string;
  imageUrl?: string;
  yearEstablished: number;
  manager: string;
  openingTime?: string;
  closingTime?: string;
  closedOnWeekends?: boolean;
  createdBy?: ApiUserSummary;
  createdAt?: string;
  updatedAt?: string;
}

interface ApiFloor {
  id: number;
  buildingId: number;
  floorNumber: number;
  floorName: string;
  description: string;
  accessibility: string;
  mapUrl?: string;
  createdBy?: ApiUserSummary;
  createdAt?: string;
  updatedAt?: string;
}

interface ApiRoom {
  id: number;
  name: string;
  code: string;
  buildingId: number;
  floorId: number;
  type: string;
  lengthMeters: number;
  widthMeters: number;
  areaSqMeters: number;
  areaSqFeet: number;
  seatingCapacity: number;
  maxOccupancy: number;
  facilities: string[];
  status: string;
  description: string;
  condition: string;
  climateControl: string;
  closedOnWeekends?: boolean;
  smartClassroomEnabled: boolean;
  projectorAvailable: boolean;
  boardType: string;
  internetAvailable: boolean;
  chairs: number;
  tables: number;
  labEquipmentAvailable: boolean;
  powerBackupAvailable: boolean;
  accessibilitySupport: boolean;
  maintenanceStatus: string;
  bookingAvailable: boolean;
  maintenanceHistory: string[];
  imageUrl?: string;
  openingTime?: string;
  closingTime?: string;
  createdBy?: ApiUserSummary;
  createdAt?: string;
  updatedAt?: string;
}

interface ApiTimetableEntry {
  id: number;
  buildingId?: number;
  buildingCode?: string;
  buildingName?: string;
  floorId?: number;
  floorNumber?: number;
  floorName?: string;
  roomId: number;
  roomCode?: string;
  roomName?: string;
  substituteRoomId?: number | null;
  substituteRoomCode?: string | null;
  substituteRoomName?: string | null;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  lectureName: string;
  lecturerName: string;
  lecturerEmail?: string;
  purpose: string;
  notes?: string;
  entryType: string;
  active: boolean;
  substituteNotified: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ApiTimetableImportResult {
  rowNumber: number;
  imported: boolean;
  roomCode?: string;
  staffName?: string;
  message: string;
  entry?: ApiTimetableEntry;
}

export interface BuildingUpsertPayload {
  name: string;
  code: string;
  type: string;
  campus: string;
  location: string;
  totalFloors: number;
  description: string;
  status: BuildingStatus;
  yearEstablished: number;
  manager: string;
  openingTime?: string;
  closingTime?: string;
  closedOnWeekends?: boolean;
}

export interface FloorUpsertPayload {
  buildingId: string;
  floorNumber: number;
  floorName: string;
  description: string;
  accessibility: FloorAccessibility;
  mapUrl?: string;
}

export interface RoomUpsertPayload {
  name: string;
  code: string;
  buildingId: string;
  floorId: string;
  type: RoomType;
  lengthMeters: number;
  widthMeters: number;
  seatingCapacity: number;
  facilities: string[];
  status: RoomStatus;
  description: string;
  condition: Room["condition"];
  climateControl: Room["climateControl"];
  smartClassroomEnabled: boolean;
  projectorAvailable: boolean;
  boardType: Room["boardType"];
  internetAvailable: boolean;
  labEquipmentAvailable: boolean;
  powerBackupAvailable: boolean;
  accessibilitySupport: boolean;
  maintenanceStatus: Room["maintenanceStatus"];
  bookingAvailable: boolean;
  openingTime?: string;
  closingTime?: string;
  maintenanceHistory: string[];
}

export interface RoomTimetablePayload {
  roomId: string;
  substituteRoomId?: string | null;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  lectureName: string;
  lecturerName: string;
  lecturerEmail?: string;
  purpose: string;
  notes?: string;
  entryType: string;
  active?: boolean;
}

export interface RoomTimetableImportResult {
  rowNumber: number;
  imported: boolean;
  roomCode?: string;
  staffName?: string;
  message: string;
  entry?: RoomTimetableEntryType;
}

const mapUser = (user?: ApiUserSummary): CreatedByUser | undefined => {
  if (!user) {
    return undefined;
  }
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
    profilePicture: user.profilePicture,
  };
};

const mapBuilding = (building: ApiBuilding): Building => ({
  id: String(building.id),
  name: building.name,
  code: building.code,
  type: building.type,
  campus: building.campus,
  location: building.location,
  totalFloors: building.totalFloors,
  description: building.description,
  status: building.status as BuildingStatus,
  imageUrl: building.imageUrl,
  yearEstablished: building.yearEstablished,
  manager: building.manager,
  openingTime: building.openingTime,
  closingTime: building.closingTime,
  closedOnWeekends: building.closedOnWeekends,
  createdBy: mapUser(building.createdBy),
  createdAt: building.createdAt,
  updatedAt: building.updatedAt,
});

const mapFloor = (floor: ApiFloor): Floor => ({
  id: String(floor.id),
  buildingId: String(floor.buildingId),
  floorNumber: floor.floorNumber,
  floorName: floor.floorName,
  description: floor.description,
  accessibility: floor.accessibility as FloorAccessibility,
  mapUrl: floor.mapUrl,
  createdBy: mapUser(floor.createdBy),
  createdAt: floor.createdAt,
  updatedAt: floor.updatedAt,
});

const mapRoom = (room: ApiRoom): Room => ({
  id: String(room.id),
  name: room.name,
  code: room.code,
  buildingId: String(room.buildingId),
  floorId: String(room.floorId),
  type: room.type as RoomType,
  lengthMeters: room.lengthMeters,
  widthMeters: room.widthMeters,
  areaSqMeters: room.areaSqMeters,
  areaSqFeet: room.areaSqFeet,
  seatingCapacity: room.seatingCapacity,
  maxOccupancy: room.maxOccupancy,
  facilities: room.facilities || [],
  status: room.status as RoomStatus,
  description: room.description,
  condition: room.condition as Room["condition"],
  climateControl: room.climateControl as Room["climateControl"],
  closedOnWeekends: room.closedOnWeekends,
  smartClassroomEnabled: room.smartClassroomEnabled,
  projectorAvailable: room.projectorAvailable,
  boardType: room.boardType as Room["boardType"],
  internetAvailable: room.internetAvailable,
  chairs: room.chairs,
  tables: room.tables,
  labEquipmentAvailable: room.labEquipmentAvailable,
  powerBackupAvailable: room.powerBackupAvailable,
  accessibilitySupport: room.accessibilitySupport,
  maintenanceStatus: room.maintenanceStatus as Room["maintenanceStatus"],
  bookingAvailable: room.bookingAvailable,
  openingTime: room.openingTime,
  closingTime: room.closingTime,
  maintenanceHistory: room.maintenanceHistory || [],
  imageUrl: room.imageUrl,
  createdBy: mapUser(room.createdBy),
  createdAt: room.createdAt,
  updatedAt: room.updatedAt,
});

const mapTimetableEntry = (entry: ApiTimetableEntry): RoomTimetableEntryType => ({
  id: String(entry.id),
  buildingId: entry.buildingId != null ? String(entry.buildingId) : undefined,
  buildingCode: entry.buildingCode,
  buildingName: entry.buildingName,
  floorId: entry.floorId != null ? String(entry.floorId) : undefined,
  floorNumber: entry.floorNumber,
  floorName: entry.floorName,
  roomId: String(entry.roomId),
  roomCode: entry.roomCode,
  roomName: entry.roomName,
  substituteRoomId: entry.substituteRoomId != null ? String(entry.substituteRoomId) : null,
  substituteRoomCode: entry.substituteRoomCode,
  substituteRoomName: entry.substituteRoomName,
  dayOfWeek: entry.dayOfWeek,
  startTime: entry.startTime,
  endTime: entry.endTime,
  lectureName: entry.lectureName,
  lecturerName: entry.lecturerName,
  lecturerEmail: entry.lecturerEmail,
  purpose: entry.purpose,
  notes: entry.notes,
  entryType: entry.entryType,
  active: entry.active,
  substituteNotified: entry.substituteNotified,
  createdAt: entry.createdAt,
  updatedAt: entry.updatedAt,
});

const mapTimetableImportResult = (result: ApiTimetableImportResult): RoomTimetableImportResult => ({
  rowNumber: result.rowNumber,
  imported: result.imported,
  roomCode: result.roomCode,
  staffName: result.staffName,
  message: result.message,
  entry: result.entry ? mapTimetableEntry(result.entry) : undefined,
});

const toMultipartData = (payload: object, image?: File | null) => {
  const formData = new FormData();
  formData.append("data", new Blob([JSON.stringify(payload)], { type: "application/json" }));
  if (image) {
    formData.append("image", image);
  }
  return formData;
};

const toFloorPayload = (payload: FloorUpsertPayload) => ({
  buildingId: Number(payload.buildingId),
  floorNumber: payload.floorNumber,
  floorName: payload.floorName,
  description: payload.description,
  accessibility: payload.accessibility,
  mapUrl: payload.mapUrl,
});

const toRoomPayload = (payload: RoomUpsertPayload) => ({
  name: payload.name,
  code: payload.code,
  buildingId: Number(payload.buildingId),
  floorId: Number(payload.floorId),
  type: payload.type,
  lengthMeters: payload.lengthMeters,
  widthMeters: payload.widthMeters,
  seatingCapacity: payload.seatingCapacity,
  maxOccupancy: payload.maxOccupancy,
  facilities: payload.facilities,
  status: payload.status,
  description: payload.description,
  condition: payload.condition,
  climateControl: payload.climateControl,
  smartClassroomEnabled: payload.smartClassroomEnabled,
  projectorAvailable: payload.projectorAvailable,
  boardType: payload.boardType,
  internetAvailable: payload.internetAvailable,
  chairs: payload.chairs,
  tables: payload.tables,
  labEquipmentAvailable: payload.labEquipmentAvailable,
  powerBackupAvailable: payload.powerBackupAvailable,
  accessibilitySupport: payload.accessibilitySupport,
  maintenanceStatus: payload.maintenanceStatus,
  bookingAvailable: payload.bookingAvailable,
  openingTime: payload.openingTime,
  closingTime: payload.closingTime,
  maintenanceHistory: payload.maintenanceHistory,
});

const toBuildingPayload = (payload: BuildingUpsertPayload) => ({
  name: payload.name,
  code: payload.code,
  type: payload.type,
  campus: payload.campus,
  location: payload.location,
  totalFloors: payload.totalFloors,
  description: payload.description,
  status: payload.status,
  yearEstablished: payload.yearEstablished,
  manager: payload.manager,
  openingTime: payload.openingTime,
  closingTime: payload.closingTime,
  closedOnWeekends: payload.closedOnWeekends,
});

const SNAPSHOT_CACHE_TTL_MS = 45_000;
const SNAPSHOT_FORBIDDEN_RETRY_MS = 60_000;
const SNAPSHOT_BLOCKED_STORAGE_KEY = "facilitySnapshotBlockedUntil";
const EMPTY_SNAPSHOT: FacilitySnapshot = {
  buildings: [],
  floors: [],
  rooms: [],
};

let snapshotCache: FacilitySnapshot | null = null;
let snapshotExpiresAt = 0;
let snapshotInFlight: Promise<FacilitySnapshot> | null = null;
let snapshotBlockedUntil = (() => {
  const stored = window.sessionStorage.getItem(SNAPSHOT_BLOCKED_STORAGE_KEY);
  return stored ? Number(stored) || 0 : 0;
})();

const setSnapshotBlockedUntil = (value: number) => {
  snapshotBlockedUntil = value;
  window.sessionStorage.setItem(SNAPSHOT_BLOCKED_STORAGE_KEY, String(value));
};

const isSnapshotFresh = () => snapshotCache !== null && Date.now() < snapshotExpiresAt;

const fetchFacilitySnapshot = async (): Promise<FacilitySnapshot> => {
  if (Date.now() < snapshotBlockedUntil) {
    return snapshotCache ?? EMPTY_SNAPSHOT;
  }

  if (!authService.isAuthenticated() || authService.isSessionExpired()) {
    return EMPTY_SNAPSHOT;
  }

  if (isSnapshotFresh()) {
    return snapshotCache as FacilitySnapshot;
  }

  if (snapshotInFlight) {
    return snapshotInFlight;
  }

  snapshotInFlight = (async () => {
    try {
      // Call sequentially so a forbidden response does not fan out into multiple failed network calls.
      const buildingsResponse = await api.get<ApiEnvelope<ApiBuilding[]>>("/management/facilities/buildings");
      const floorsResponse = await api.get<ApiEnvelope<ApiFloor[]>>("/management/facilities/floors");
      const roomsResponse = await api.get<ApiEnvelope<ApiRoom[]>>("/management/facilities/rooms");

      const data: FacilitySnapshot = {
        buildings: (buildingsResponse.data.data || []).map(mapBuilding),
        floors: (floorsResponse.data.data || []).map(mapFloor),
        rooms: (roomsResponse.data.data || []).map(mapRoom),
      };
      snapshotCache = data;
      snapshotExpiresAt = Date.now() + SNAPSHOT_CACHE_TTL_MS;
      setSnapshotBlockedUntil(0);
      return data;
    } catch (error: unknown) {
      const status =
        typeof error === "object" && error !== null
          ? (error as { response?: { status?: number } }).response?.status
          : undefined;

      if (status === 401 || status === 403) {
        setSnapshotBlockedUntil(Date.now() + SNAPSHOT_FORBIDDEN_RETRY_MS);
        snapshotCache = EMPTY_SNAPSHOT;
        snapshotExpiresAt = Date.now() + 5_000;
        return EMPTY_SNAPSHOT;
      }

      throw error;
    } finally {
      snapshotInFlight = null;
    }
  })();

  return snapshotInFlight;
};

const invalidateSnapshot = () => {
  snapshotCache = null;
  snapshotExpiresAt = 0;
  setSnapshotBlockedUntil(0);
};

export const facilityService = {
  getFacilitySnapshot: fetchFacilitySnapshot,

  preloadFacilitySnapshot() {
    return fetchFacilitySnapshot().catch((error: unknown) => {
      const status =
        typeof error === "object" && error !== null
          ? (error as { response?: { status?: number } }).response?.status
          : undefined;

      if (status === 401 || status === 403) {
        return null;
      }

      throw error;
    });
  },

  invalidateFacilitySnapshot: invalidateSnapshot,

  async getBuildings() {
    const response = await api.get<ApiEnvelope<ApiBuilding[]>>("/management/facilities/buildings");
    return (response.data.data || []).map(mapBuilding);
  },

  async getBuildingById(id: string) {
    const response = await api.get<ApiEnvelope<ApiBuilding>>(`/management/facilities/buildings/${id}`);
    return mapBuilding(response.data.data);
  },

  async createBuilding(payload: BuildingUpsertPayload, image?: File | null) {
    const multipart = toMultipartData(toBuildingPayload(payload), image);
    const response = await api.post<ApiEnvelope<ApiBuilding>>("/management/facilities/buildings", multipart, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    invalidateSnapshot();
    return mapBuilding(response.data.data);
  },

  async updateBuilding(id: string, payload: BuildingUpsertPayload, image?: File | null) {
    const multipart = toMultipartData(toBuildingPayload(payload), image);
    const response = await api.put<ApiEnvelope<ApiBuilding>>(`/management/facilities/buildings/${id}`, multipart, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    invalidateSnapshot();
    return mapBuilding(response.data.data);
  },

  async deleteBuilding(id: string) {
    const response = await api.delete(`/management/facilities/buildings/${id}`);
    invalidateSnapshot();
    return response;
  },

  async getFloors(buildingId?: string) {
    const query = buildingId ? `?buildingId=${buildingId}` : "";
    const response = await api.get<ApiEnvelope<ApiFloor[]>>(`/management/facilities/floors${query}`);
    return (response.data.data || []).map(mapFloor);
  },

  async createFloor(payload: FloorUpsertPayload) {
    const response = await api.post<ApiEnvelope<ApiFloor>>("/management/facilities/floors", toFloorPayload(payload));
    invalidateSnapshot();
    return mapFloor(response.data.data);
  },

  async updateFloor(id: string, payload: FloorUpsertPayload) {
    const response = await api.put<ApiEnvelope<ApiFloor>>(`/management/facilities/floors/${id}`, toFloorPayload(payload));
    invalidateSnapshot();
    return mapFloor(response.data.data);
  },

  async deleteFloor(id: string) {
    const response = await api.delete(`/management/facilities/floors/${id}`);
    invalidateSnapshot();
    return response;
  },

  async getRooms(filters?: { buildingId?: string; floorId?: string }) {
    const params = new URLSearchParams();
    if (filters?.buildingId) {
      params.set("buildingId", filters.buildingId);
    }
    if (filters?.floorId) {
      params.set("floorId", filters.floorId);
    }

    const query = params.toString() ? `?${params.toString()}` : "";
    const response = await api.get<ApiEnvelope<ApiRoom[]>>(`/management/facilities/rooms${query}`);
    return (response.data.data || []).map(mapRoom);
  },

  async getRoomById(id: string) {
    const response = await api.get<ApiEnvelope<ApiRoom>>(`/management/facilities/rooms/${id}`);
    return mapRoom(response.data.data);
  },

  async createRoom(payload: RoomUpsertPayload, image?: File | null) {
    const multipart = toMultipartData(toRoomPayload(payload), image);
    const response = await api.post<ApiEnvelope<ApiRoom>>(`/management/facilities/rooms`, multipart, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    invalidateSnapshot();
    return mapRoom(response.data.data);
  },

  async updateRoom(id: string, payload: RoomUpsertPayload, image?: File | null) {
    const multipart = toMultipartData(toRoomPayload(payload), image);
    const response = await api.put<ApiEnvelope<ApiRoom>>(`/management/facilities/rooms/${id}`, multipart, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    invalidateSnapshot();
    return mapRoom(response.data.data);
  },

  async getRoomTimetable(roomId: string) {
    const response = await api.get<ApiEnvelope<ApiTimetableEntry[]>>(`/management/availability/rooms/${roomId}`);
    return (response.data.data || []).map(mapTimetableEntry);
  },

  async getRoomTimetableForDate(roomId: string, date: string) {
    const response = await api.get<ApiEnvelope<ApiTimetableEntry[]>>(`/management/availability/rooms/${roomId}/date`, {
      params: { date },
    });
    return (response.data.data || []).map(mapTimetableEntry);
  },

  async getMyTimetableAllocations() {
    const response = await api.get<ApiEnvelope<ApiTimetableEntry[]>>(`/management/availability/my-allocations`);
    return (response.data.data || []).map(mapTimetableEntry);
  },

  async createRoomTimetableEntry(payload: RoomTimetablePayload) {
    const response = await api.post<ApiEnvelope<ApiTimetableEntry>>("/management/availability/entries", {
      ...payload,
      roomId: Number(payload.roomId),
      substituteRoomId: payload.substituteRoomId ? Number(payload.substituteRoomId) : null,
      active: payload.active ?? true,
    });
    return mapTimetableEntry(response.data.data);
  },

  async updateRoomTimetableEntry(id: string, payload: RoomTimetablePayload) {
    const response = await api.put<ApiEnvelope<ApiTimetableEntry>>(`/management/availability/entries/${id}`, {
      ...payload,
      roomId: Number(payload.roomId),
      substituteRoomId: payload.substituteRoomId ? Number(payload.substituteRoomId) : null,
      active: payload.active ?? true,
    });
    return mapTimetableEntry(response.data.data);
  },

  async deleteRoomTimetableEntry(id: string) {
    return api.delete(`/management/availability/entries/${id}`);
  },

  async importRoomTimetableFromExcel(file: File, defaultRoomId?: string) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post<ApiEnvelope<ApiTimetableImportResult[]>>(
      "/management/availability/entries/import",
      formData,
      {
        params: defaultRoomId ? { defaultRoomId } : undefined,
      },
    );

    return (response.data.data || []).map(mapTimetableImportResult);
  },

  async downloadRoomTimetableImportTemplate() {
    const response = await api.get<Blob>("/management/availability/entries/import-template", {
      responseType: "blob",
    });
    return response.data;
  },

  async deleteRoom(id: string) {
    const response = await api.delete(`/management/facilities/rooms/${id}`);
    invalidateSnapshot();
    return response;
  },
};

export default facilityService;
