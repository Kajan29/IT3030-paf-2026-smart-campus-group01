// Booking-related types

export type BookingType = "STUDENT" | "STAFF";
export type BookingStatus = "PENDING" | "APPROVED" | "CONFIRMED" | "CANCELLED" | "REJECTED" | "COMPLETED" | "ATTENDED" | "NO_SHOW";
export type AvailabilityStatus = "AVAILABLE" | "RESERVED" | "OCCUPIED";

export interface TimeSlot {
  startTime: string;
  endTime: string;
}

export interface OccupancyBlock {
  type: string;  // TIMETABLE, BLACKOUT, BOOKING
  description: string;
  startTime: string;
  endTime: string;
  details?: string;
}

export interface RoomAvailability {
  status: AvailabilityStatus;
  timetableConflicts: number;
  blackoutConflicts: number;
  bookingConflicts: number;
}

export interface RoomTimetableEntry {
  id: string;
  buildingId?: string;
  buildingCode?: string;
  buildingName?: string;
  floorId?: string;
  floorNumber?: number;
  floorName?: string;
  roomId: string;
  roomCode?: string;
  roomName?: string;
  substituteRoomId?: string | null;
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

export interface BookingRequest {
  roomId: string;
  startTime: string;
  endTime: string;
  bookingType: BookingType;
  purpose: string;
  participantsCount?: number;
  seatsBooked?: number;
  isRecurring?: boolean;
  recurringPattern?: string;
  recurringEndDate?: string;
}

export interface BookingResponse {
  bookingId: string;
  status: BookingStatus;
  requiresOverride: boolean;
}

export interface SwapRequest {
  id: string;
  timetableId: string;
  requestedBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  lecturer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" | "EXPIRED";
  approvalNotes?: string;
  rejectionReason?: string;
  suggestedRoomId?: string;
  createdAt: string;
}

export interface Timetable {
  id: string;
  roomId: string;
  lecturerId: string;
  moduleName: string;
  moduleCode: string;
  batchId: string;
  batchName: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  duration: number;
  studentCount: number;
  description: string;
  status: "ACTIVE" | "CANCELLED" | "RESCHEDULED";
  recurring: boolean;
  startDate?: string;
  endDate?: string;
  createdAt: string;
}

export interface BookingNotification {
  id: number;
  type: "BOOKING_CONFIRMED" | "BOOKING_PENDING" | "BOOKING_REJECTED" | 
        "TICKET_CREATED" | "TICKET_ASSIGNED" | "TICKET_REPLY" | "TICKET_STATUS_UPDATED" |
        "STUDENT_REGISTERED" |
        "SWAP_REQUEST_RECEIVED" | "SWAP_REQUEST_APPROVED" | "SWAP_REQUEST_REJECTED" |
        "BOOKING_REMINDER" | "BOOKING_CANCELLED" | "BOOKING_NO_SHOW" |
        "BOOKING_RESTRICTED" | "BOOKING_UNRESTRICTED" | "ADMIN_ALERT";
  relatedBookingId?: number;
  relatedTicketId?: number;
  targetPath?: string;
  title: string;
  message: string;
  isRead: boolean;
  eventDate?: string;
  readAt?: string;
  status?: string;
  emailSent?: boolean;
  signalrSent?: boolean;
  createdAt: string;
}
