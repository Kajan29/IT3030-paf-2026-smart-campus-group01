import { describe, expect, it } from "vitest";

import {
  apply2DPosition,
  apply3DPosition,
  normalize2DTo3D,
  normalize3DTo2D,
  to2DPosition,
  to3DPosition,
} from "@/utils/resourceLayoutTransform";

const baseLayout = {
  id: "layout-1",
  resourceId: "resource-1",
  roomId: "room-1",
  x: 10,
  y: 4,
  z: 20,
  rotation: 90,
  scale: 1,
};

describe("resourceLayoutTransform", () => {
  it("maps 3D coordinates into the 2D editor plane", () => {
    expect(to2DPosition(baseLayout)).toEqual({ x: 10, y: 20 });
  });

  it("applies a 2D position back into the 3D layout shape", () => {
    expect(apply2DPosition(baseLayout, { x: 14, y: 28 })).toEqual({
      ...baseLayout,
      x: 14,
      y: 0,
      z: 28,
    });
  });

  it("preserves full coordinates when converting to and from 3D", () => {
    expect(to3DPosition(baseLayout)).toEqual({ x: 10, y: 4, z: 20 });
    expect(apply3DPosition(baseLayout, { x: 6, y: 8, z: 12 })).toEqual({
      ...baseLayout,
      x: 6,
      y: 8,
      z: 12,
    });
  });

  it("normalizes layouts consistently between editor modes", () => {
    expect(normalize2DTo3D(baseLayout)).toEqual({
      ...baseLayout,
      x: 10,
      y: 0,
      z: 20,
    });
    expect(normalize3DTo2D(baseLayout)).toEqual(baseLayout);
  });
});
