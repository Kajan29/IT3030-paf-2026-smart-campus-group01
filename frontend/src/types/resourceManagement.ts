import type { Building, Floor, Room } from "@/types/campusManagement";

export type ResourceViewMode = "2D" | "3D";

export interface RoomResource {
  id: string;
  name: string;
  type: string;
  quantity: number;
  roomId: string;
}

export interface ResourceLayout {
  id: string;
  resourceId: string;
  roomId: string;
  x: number;
  y: number;
  z: number;
  rotation: number;
  scale: number;
}

export interface ResourceLayoutEditorItem {
  resource: RoomResource;
  layout: ResourceLayout;
}

export interface ResourceCreatePayload {
  name: string;
  type: string;
  quantity: number;
  roomId: string;
}

export interface LayoutSavePayload {
  roomId: string;
  layouts: ResourceLayout[];
}

export type FacilityTree = {
  buildings: Building[];
  floors: Floor[];
  rooms: Room[];
};
