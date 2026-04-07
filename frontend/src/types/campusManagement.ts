export type BuildingStatus = "Active" | "Under Maintenance" | "Inactive";

export type FloorAccessibility = "Accessible" | "Partial" | "Not Accessible";

export type RoomStatus = "Available" | "Occupied" | "Under Maintenance" | "Inactive";

export type RoomCondition = "Excellent" | "Good" | "Fair" | "Needs Repair";

export type ClimateControl = "AC" | "Non-AC";

export type BoardType = "Whiteboard" | "Smart Board" | "Both" | "None";

export type MaintenanceStatus = "Operational" | "Scheduled" | "Critical";

export type RoomType =
  | "Lecture Hall"
  | "Laboratory"
  | "Computer Lab"
  | "Library"
  | "Auditorium"
  | "Multipurpose Hall"
  | "Staff Room"
  | "Meeting Room"
  | "Seminar Hall"
  | "Tutorial Room"
  | "Examination Hall"
  | "Server Room"
  | "Department Office"
  | "Admin Office"
  | "Research Room"
  | "Discussion Room"
  | "Storage Room"
  | "Medical Room"
  | "Common Room"
  | "Other";

export interface CreatedByUser {
  id: number;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  profilePicture?: string;
}

export interface Building {
  id: string;
  name: string;
  code: string;
  type: string;
  campus: string;
  location: string;
  totalFloors: number;
  description: string;
  status: BuildingStatus;
  imageUrl?: string;
  yearEstablished: number;
  manager: string;
  openingTime?: string;
  closingTime?: string;
  closedOnWeekends?: boolean;
  createdBy?: CreatedByUser;
  createdAt?: string;
  updatedAt?: string;
}

export interface Floor {
  id: string;
  buildingId: string;
  floorNumber: number;
  floorName: string;
  description: string;
  accessibility: FloorAccessibility;
  mapUrl?: string;
  createdBy?: CreatedByUser;
  createdAt?: string;
  updatedAt?: string;
}

export interface Room {
  id: string;
  name: string;
  code: string;
  buildingId: string;
  floorId: string;
  type: RoomType;
  lengthMeters: number;
  widthMeters: number;
  areaSqMeters: number;
  areaSqFeet: number;
  seatingCapacity: number;
  maxOccupancy: number;
  facilities: string[];
  status: RoomStatus;
  description: string;
  condition: RoomCondition;
  climateControl: ClimateControl;
  closedOnWeekends?: boolean;
  smartClassroomEnabled: boolean;
  projectorAvailable: boolean;
  boardType: BoardType;
  internetAvailable: boolean;
  chairs: number;
  tables: number;
  labEquipmentAvailable: boolean;
  powerBackupAvailable: boolean;
  accessibilitySupport: boolean;
  maintenanceStatus: MaintenanceStatus;
  bookingAvailable: boolean;
  openingTime?: string;
  closingTime?: string;
  maintenanceHistory: string[];
  imageUrl?: string;
  createdBy?: CreatedByUser;
  createdAt?: string;
  updatedAt?: string;
}
