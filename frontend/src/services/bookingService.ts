import api from "./api";
import type { 
  RoomAvailability, 
  TimeSlot, 
  BookingRequest, 
  BookingResponse,
  OccupancyBlock,
  BookingNotification 
} from "@/types/booking";

const bookingService = {
  /**
   * Check room availability for a specific time period
   */
  checkRoomAvailability: async (
    roomId: string,
    startTime: string,
    endTime: string
  ): Promise<RoomAvailability> => {
    const response = await api.get(`/bookings/availability/${roomId}`, {
      params: {
        startTime,
        endTime,
      },
    });
    return response.data;
  },

  /**
   * Get available time slots for a room on a specific date
   */
  getAvailableSlots: async (
    roomId: string,
    date: string,
    slotDuration: number = 30
  ): Promise<TimeSlot[]> => {
    const response = await api.get(`/bookings/available-slots/${roomId}`, {
      params: {
        date,
        slotDuration,
      },
    });
    return response.data.slots || [];
  },

  /**
   * Get room occupancy/timeline for a specific date
   */
  getRoomOccupancy: async (
    roomId: string,
    date: string
  ): Promise<OccupancyBlock[]> => {
    const response = await api.get(`/bookings/occupancy/${roomId}`, {
      params: { date },
    });
    return response.data.blocks || [];
  },

  /**
   * Detect conflicts for a proposed booking
   */
  detectConflicts: async (
    roomId: string,
    startTime: string,
    endTime: string
  ) => {
    const response = await api.post(`/bookings/detect-conflicts`, {
      roomId,
      startTime,
      endTime,
    });
    return response.data;
  },

  /**
   * Create a new booking
   */
  createBooking: async (request: BookingRequest): Promise<BookingResponse> => {
    const response = await api.post(`/bookings`, request);
    return response.data;
  },

  /**
   * Get pending bookings (Admin only)
   */
  getPendingBookings: async () => {
    const response = await api.get(`/bookings/pending`);
    return response.data;
  },

  /**
   * Get current user's bookings
   */
  getMyBookings: async () => {
    const response = await api.get(`/bookings/my-bookings`);
    return response.data;
  },

  /**
   * Approve a pending booking (Admin only)
   */
  approveBooking: async (bookingId: string, notes: string = "") => {
    const response = await api.put(`/bookings/${bookingId}/approve`, { notes });
    return response.data;
  },

  /**
   * Reject a pending booking (Admin only)
   */
  rejectBooking: async (bookingId: string, reason: string = "") => {
    const response = await api.put(`/bookings/${bookingId}/reject`, { reason });
    return response.data;
  },

  /**
   * Cancel a booking
   */
  cancelBooking: async (bookingId: string, reason: string = "") => {
    const response = await api.delete(`/bookings/${bookingId}`, {
      params: { reason },
    });
    return response.data;
  },

  /**
   * Get notifications for current user
   */
  getNotifications: async () => {
    const response = await api.get(`/notifications`);
    return response.data;
  },

  /**
   * Mark notification as read
   */
  markNotificationAsRead: async (notificationId: string) => {
    const response = await api.put(`/notifications/${notificationId}/read`);
    return response.data;
  },
};

export default bookingService;
