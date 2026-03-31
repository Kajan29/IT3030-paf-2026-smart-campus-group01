import api from "./api";
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

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
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
  createdBy?: ApiUserSummary;
  createdAt?: string;
  updatedAt?: string;
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
  maxOccupancy: number;
  facilities: string[];
  status: RoomStatus;
  description: string;
  condition: Room["condition"];
  climateControl: Room["climateControl"];
  smartClassroomEnabled: boolean;
  projectorAvailable: boolean;
  boardType: Room["boardType"];
  internetAvailable: boolean;
  chairs: number;
  tables: number;
  labEquipmentAvailable: boolean;
  powerBackupAvailable: boolean;
  accessibilitySupport: boolean;
  maintenanceStatus: Room["maintenanceStatus"];
  bookingAvailable: boolean;
  maintenanceHistory: string[];
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
  maintenanceHistory: room.maintenanceHistory || [],
  imageUrl: room.imageUrl,
  createdBy: mapUser(room.createdBy),
  createdAt: room.createdAt,
  updatedAt: room.updatedAt,
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
  maintenanceHistory: payload.maintenanceHistory,
});

export const facilityService = {
  async getBuildings() {
    const response = await api.get<ApiEnvelope<ApiBuilding[]>>("/management/facilities/buildings");
    return (response.data.data || []).map(mapBuilding);
  },

  async getBuildingById(id: string) {
    const response = await api.get<ApiEnvelope<ApiBuilding>>(`/management/facilities/buildings/${id}`);
    return mapBuilding(response.data.data);
  },

  async createBuilding(payload: BuildingUpsertPayload, image?: File | null) {
    const multipart = toMultipartData(payload, image);
    const response = await api.post<ApiEnvelope<ApiBuilding>>("/management/facilities/buildings", multipart, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return mapBuilding(response.data.data);
  },

  async updateBuilding(id: string, payload: BuildingUpsertPayload, image?: File | null) {
    const multipart = toMultipartData(payload, image);
    const response = await api.put<ApiEnvelope<ApiBuilding>>(`/management/facilities/buildings/${id}`, multipart, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return mapBuilding(response.data.data);
  },

  deleteBuilding(id: string) {
    return api.delete(`/management/facilities/buildings/${id}`);
  },

  async getFloors(buildingId?: string) {
    const query = buildingId ? `?buildingId=${buildingId}` : "";
    const response = await api.get<ApiEnvelope<ApiFloor[]>>(`/management/facilities/floors${query}`);
    return (response.data.data || []).map(mapFloor);
  },

  async createFloor(payload: FloorUpsertPayload) {
    const response = await api.post<ApiEnvelope<ApiFloor>>("/management/facilities/floors", toFloorPayload(payload));
    return mapFloor(response.data.data);
  },

  async updateFloor(id: string, payload: FloorUpsertPayload) {
    const response = await api.put<ApiEnvelope<ApiFloor>>(`/management/facilities/floors/${id}`, toFloorPayload(payload));
    return mapFloor(response.data.data);
  },

  deleteFloor(id: string) {
    return api.delete(`/management/facilities/floors/${id}`);
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
    return mapRoom(response.data.data);
  },

  async updateRoom(id: string, payload: RoomUpsertPayload, image?: File | null) {
    const multipart = toMultipartData(toRoomPayload(payload), image);
    const response = await api.put<ApiEnvelope<ApiRoom>>(`/management/facilities/rooms/${id}`, multipart, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return mapRoom(response.data.data);
  },

  deleteRoom(id: string) {
    return api.delete(`/management/facilities/rooms/${id}`);
  },
};

export default facilityService;
