import type { ResourceLayout } from "@/types/resourceManagement";

export interface Position2D {
  x: number;
  y: number;
}

export interface Position3D {
  x: number;
  y: number;
  z: number;
}

export const to2DPosition = (layout: ResourceLayout): Position2D => ({
  x: layout.x,
  y: layout.z,
});

export const apply2DPosition = (layout: ResourceLayout, position: Position2D): ResourceLayout => ({
  ...layout,
  x: position.x,
  z: position.y,
  y: 0,
});

export const to3DPosition = (layout: ResourceLayout): Position3D => ({
  x: layout.x,
  y: layout.y,
  z: layout.z,
});

export const apply3DPosition = (layout: ResourceLayout, position: Position3D): ResourceLayout => ({
  ...layout,
  x: position.x,
  y: position.y,
  z: position.z,
});

export const normalize2DTo3D = (layout: ResourceLayout): ResourceLayout => ({
  ...layout,
  x: layout.x,
  y: 0,
  z: layout.z,
});

export const normalize3DTo2D = (layout: ResourceLayout): ResourceLayout => ({
  ...layout,
  x: layout.x,
  z: layout.z,
});
