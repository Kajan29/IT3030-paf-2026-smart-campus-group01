import type { RoomType } from "@/types/campusManagement";

export const buildingTypes = [
  "Academic",
  "Administrative",
  "Library",
  "Research",
  "Technology",
  "Auditorium",
  "Laboratory",
] as const;

export const buildingStatuses = ["Active", "Under Maintenance", "Inactive"] as const;

export const floorAccessibilityOptions = ["Accessible", "Partial", "Not Accessible"] as const;

export const roomStatuses = ["Available", "Occupied", "Under Maintenance", "Inactive"] as const;

export const roomTypes: RoomType[] = [
  "Lecture Hall",
  "Laboratory",
  "Computer Lab",
  "Library",
  "Auditorium",
  "Multipurpose Hall",
  "Staff Room",
  "Meeting Room",
  "Seminar Hall",
  "Tutorial Room",
  "Examination Hall",
  "Server Room",
  "Department Office",
  "Admin Office",
  "Research Room",
  "Discussion Room",
  "Storage Room",
  "Medical Room",
  "Common Room",
  "Other",
];
