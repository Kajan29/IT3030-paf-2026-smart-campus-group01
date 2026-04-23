import { describe, expect, it } from "vitest";

import { resolveNotificationPath } from "@/utils/notificationNavigation";

describe("resolveNotificationPath", () => {
  it("prefers an explicit target path when one exists", () => {
    expect(
      resolveNotificationPath(
        {
          id: 1,
          type: "BOOKING_PENDING",
          targetPath: "/custom-path",
          title: "Booking pending",
          message: "Pending approval",
          isRead: false,
          createdAt: "2026-04-23T00:00:00Z",
        },
        "ADMIN"
      )
    ).toBe("/custom-path");
  });

  it("routes ticket notifications by user role", () => {
    const notification = {
      id: 2,
      type: "TICKET_CREATED" as const,
      relatedTicketId: 77,
      title: "Ticket created",
      message: "New ticket",
      isRead: false,
      createdAt: "2026-04-23T00:00:00Z",
    };

    expect(resolveNotificationPath(notification, "ADMIN")).toBe("/admin?view=tickets");
    expect(resolveNotificationPath(notification, "NON_ACADEMIC_STAFF")).toBe(
      "/profile?section=assignedTickets&tab=assigned"
    );
    expect(resolveNotificationPath(notification, "STUDENT")).toBe("/my-tickets");
  });

  it("routes booking notifications to booking management areas", () => {
    const notification = {
      id: 3,
      type: "BOOKING_PENDING" as const,
      relatedBookingId: 9,
      title: "Booking update",
      message: "Booking changed",
      isRead: false,
      createdAt: "2026-04-23T00:00:00Z",
    };

    expect(resolveNotificationPath(notification, "ADMIN")).toBe("/admin?view=bookings");
    expect(resolveNotificationPath(notification, "STUDENT")).toBe("/book-room");
  });

  it("falls back to profile or notifications when no specific route matches", () => {
    const notification = {
      id: 4,
      type: "ADMIN_ALERT" as const,
      title: "Alert",
      message: "General alert",
      isRead: false,
      createdAt: "2026-04-23T00:00:00Z",
    };

    expect(resolveNotificationPath(notification, "ADMIN")).toBe("/admin?view=notifications");
    expect(resolveNotificationPath(notification, "ACADEMIC_STAFF")).toBe("/profile");
  });
});
