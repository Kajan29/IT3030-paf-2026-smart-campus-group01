import api from "@/services/api";
import authService from "@/services/authService";
import type { Building, Floor, Room } from "@/types/campusManagement";
import type { LayoutSavePayload, ResourceCreatePayload, ResourceLayout, RoomResource } from "@/types/resourceManagement";

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
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
  yearEstablished: number;
  manager: string;
}

interface ApiFloor {
  id: number;
  buildingId: number;
  floorNumber: number;
  floorName: string;
  description: string;
  accessibility: string;
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
}

interface ApiResource {
  id: number;
  name: string;
  type: string;
  quantity: number;
  roomId: number;
}

interface ApiLayout {
  id: number;
  resourceId: number;
  roomId: number;
  x: number;
  y: number;
  z: number;
  rotation: number;
  scale: number;
}

const BASE = "/management/resource-management";
const READ_RETRY_BLOCK_MS = 60_000;
const RESOURCE_READ_BLOCKED_STORAGE_KEY = "resourceReadBlockedUntil";
let readBlockedUntil = (() => {
  const stored = window.sessionStorage.getItem(RESOURCE_READ_BLOCKED_STORAGE_KEY);
  return stored ? Number(stored) || 0 : 0;
})();
const readInFlight = new Map<string, Promise<unknown>>();

const setReadBlockedUntil = (value: number) => {
  readBlockedUntil = value;
  window.sessionStorage.setItem(RESOURCE_READ_BLOCKED_STORAGE_KEY, String(value));
};

const getErrorStatus = (error: unknown): number | undefined => {
  if (typeof error === "object" && error !== null) {
    return (error as { response?: { status?: number } }).response?.status;
  }
  return undefined;
};

const withReadGuard = async <T>(key: string, action: () => Promise<T>, fallback: T): Promise<T> => {
  if (!authService.isAuthenticated() || authService.isSessionExpired()) {
    return fallback;
  }

  if (Date.now() < readBlockedUntil) {
    return fallback;
  }

  const existing = readInFlight.get(key) as Promise<T> | undefined;
  if (existing) {
    return existing;
  }

  const request = (async () => {
    try {
      const result = await action();
      setReadBlockedUntil(0);
      return result;
    } catch (error: unknown) {
      const status = getErrorStatus(error);
      if (status === 401 || status === 403) {
        setReadBlockedUntil(Date.now() + READ_RETRY_BLOCK_MS);
        return fallback;
      }
      throw error;
    } finally {
      readInFlight.delete(key);
    }
  })();

  readInFlight.set(key, request as Promise<unknown>);
  return request;
};

const mapBuilding = (entry: ApiBuilding): Building => ({
  id: String(entry.id),
  name: entry.name,
  code: entry.code,
  type: entry.type,
  campus: entry.campus,
  location: entry.location,
  totalFloors: entry.totalFloors,
  description: entry.description,
  status: entry.status as Building["status"],
  yearEstablished: entry.yearEstablished,
  manager: entry.manager,
});

const mapFloor = (entry: ApiFloor): Floor => ({
  id: String(entry.id),
  buildingId: String(entry.buildingId),
  floorNumber: entry.floorNumber,
  floorName: entry.floorName,
  description: entry.description,
  accessibility: entry.accessibility as Floor["accessibility"],
});

const mapRoom = (entry: ApiRoom): Room => ({
  id: String(entry.id),
  name: entry.name,
  code: entry.code,
  buildingId: String(entry.buildingId),
  floorId: String(entry.floorId),
  type: entry.type as Room["type"],
  lengthMeters: entry.lengthMeters,
  widthMeters: entry.widthMeters,
  areaSqMeters: entry.areaSqMeters,
  areaSqFeet: entry.areaSqFeet,
  seatingCapacity: entry.seatingCapacity,
  maxOccupancy: entry.maxOccupancy,
  facilities: entry.facilities ?? [],
  status: entry.status as Room["status"],
  description: entry.description,
  condition: entry.condition as Room["condition"],
  climateControl: entry.climateControl as Room["climateControl"],
  smartClassroomEnabled: entry.smartClassroomEnabled,
  projectorAvailable: entry.projectorAvailable,
  boardType: entry.boardType as Room["boardType"],
  internetAvailable: entry.internetAvailable,
  chairs: entry.chairs,
  tables: entry.tables,
  labEquipmentAvailable: entry.labEquipmentAvailable,
  powerBackupAvailable: entry.powerBackupAvailable,
  accessibilitySupport: entry.accessibilitySupport,
  maintenanceStatus: entry.maintenanceStatus as Room["maintenanceStatus"],
  bookingAvailable: entry.bookingAvailable,
  maintenanceHistory: entry.maintenanceHistory ?? [],
});

const mapResource = (entry: ApiResource): RoomResource => ({
  id: String(entry.id),
  name: entry.name,
  type: entry.type,
  quantity: entry.quantity,
  roomId: String(entry.roomId),
});

const mapLayout = (entry: ApiLayout): ResourceLayout => ({
  id: String(entry.id),
  resourceId: String(entry.resourceId),
  roomId: String(entry.roomId),
  x: entry.x,
  y: entry.y,
  z: entry.z,
  rotation: entry.rotation,
  scale: entry.scale,
});

const toValidRoomNumber = (roomId: string): number | null => {
  const parsed = Number(roomId);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
};

const resourceManagementService = {
  async getBuildings(): Promise<Building[]> {
    return withReadGuard("buildings", async () => {
      const response = await api.get<ApiEnvelope<ApiBuilding[]>>(`${BASE}/buildings`);
      return response.data.data.map(mapBuilding);
    }, []);
  },

  async getFloors(buildingId: string): Promise<Floor[]> {
    return withReadGuard(`floors:${buildingId}`, async () => {
      const response = await api.get<ApiEnvelope<ApiFloor[]>>(`${BASE}/floors`, { params: { buildingId } });
      return response.data.data.map(mapFloor);
    }, []);
  },

  async getRooms(floorId: string): Promise<Room[]> {
    return withReadGuard(`rooms:${floorId}`, async () => {
      const response = await api.get<ApiEnvelope<ApiRoom[]>>(`${BASE}/rooms`, { params: { floorId } });
      return response.data.data.map(mapRoom);
    }, []);
  },

  async getResources(roomId: string): Promise<RoomResource[]> {
    const numericRoomId = toValidRoomNumber(roomId);
    if (numericRoomId === null) {
      return [];
    }

    return withReadGuard(`resources:${roomId}`, async () => {
      const response = await api.get<ApiEnvelope<ApiResource[]>>(`${BASE}/resources`, { params: { roomId: numericRoomId } });
      return response.data.data.map(mapResource);
    }, []);
  },

  async createResource(payload: ResourceCreatePayload): Promise<RoomResource> {
    const numericRoomId = toValidRoomNumber(payload.roomId);
    if (numericRoomId === null) {
      throw new Error("Invalid room selection. Please choose a valid room and try again.");
    }

    const response = await api.post<ApiEnvelope<ApiResource>>(`${BASE}/resources`, {
      name: payload.name,
      type: payload.type,
      quantity: payload.quantity,
      roomId: numericRoomId,
    });
    return mapResource(response.data.data);
  },

  async updateResource(id: string, payload: ResourceCreatePayload): Promise<RoomResource> {
    const numericRoomId = toValidRoomNumber(payload.roomId);
    if (numericRoomId === null) {
      throw new Error("Invalid room selection. Please choose a valid room and try again.");
    }

    const response = await api.put<ApiEnvelope<ApiResource>>(`${BASE}/resources/${id}`, {
      name: payload.name,
      type: payload.type,
      quantity: payload.quantity,
      roomId: numericRoomId,
    });
    return mapResource(response.data.data);
  },

  async deleteResource(id: string): Promise<void> {
    await api.delete(`${BASE}/resources/${id}`);
  },

  async getLayout(roomId: string): Promise<ResourceLayout[]> {
    return withReadGuard(`layout:${roomId}`, async () => {
      const response = await api.get<ApiEnvelope<ApiLayout[]>>(`${BASE}/layout`, { params: { roomId } });
      return response.data.data.map(mapLayout);
    }, []);
  },

  async saveLayout(payload: LayoutSavePayload): Promise<ResourceLayout[]> {
    const numericRoomId = toValidRoomNumber(payload.roomId);
    if (numericRoomId === null) {
      throw new Error("Invalid room selection. Please choose a valid room and try again.");
    }

    const response = await api.post<ApiEnvelope<ApiLayout[]>>(`${BASE}/layout/save`, {
      roomId: numericRoomId,
      layouts: payload.layouts.map((layout) => ({
        resourceId: Number(layout.resourceId),
        roomId: Number(layout.roomId),
        x: layout.x,
        y: layout.y,
        z: layout.z,
        rotation: layout.rotation,
        scale: layout.scale,
      })),
    });
    return response.data.data.map(mapLayout);
  },

  async updateLayout(layout: ResourceLayout): Promise<ResourceLayout> {
    const numericRoomId = toValidRoomNumber(layout.roomId);
    if (numericRoomId === null) {
      throw new Error("Invalid room selection. Please choose a valid room and try again.");
    }

    const response = await api.put<ApiEnvelope<ApiLayout>>(`${BASE}/layout/update`, {
      resourceId: Number(layout.resourceId),
      roomId: numericRoomId,
      x: layout.x,
      y: layout.y,
      z: layout.z,
      rotation: layout.rotation,
      scale: layout.scale,
    });
    return mapLayout(response.data.data);
  },
};

export default resourceManagementService;
