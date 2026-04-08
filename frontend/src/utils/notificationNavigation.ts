import type { BookingNotification } from "@/types/booking";
import type { UserRole } from "@/services/authService";

export const resolveNotificationPath = (
  notification: BookingNotification,
  role?: UserRole
): string => {
  if (notification.targetPath) {
    return notification.targetPath;
  }

  if (notification.relatedTicketId != null) {
    if (role === "ADMIN") return "/admin?view=tickets";
    if (role === "NON_ACADEMIC_STAFF") return "/profile?section=assignedTickets&tab=assigned";
    return "/my-tickets";
  }

  if (notification.relatedBookingId != null) {
    if (role === "ADMIN") return "/admin?view=bookings";
    return "/book-room";
  }

  switch (notification.type) {
    case "STUDENT_REGISTERED":
      return "/admin?view=users";
    case "TICKET_CREATED":
    case "TICKET_ASSIGNED":
    case "TICKET_REPLY":
    case "TICKET_STATUS_UPDATED":
      if (role === "ADMIN") return "/admin?view=tickets";
      if (role === "NON_ACADEMIC_STAFF") return "/profile?section=assignedTickets&tab=assigned";
      return "/my-tickets";
    case "BOOKING_PENDING":
      if (role === "ADMIN") return "/admin?view=bookings";
      return "/book-room";
    default:
      if (role === "ADMIN") return "/admin?view=notifications";
      return "/profile";
  }
};