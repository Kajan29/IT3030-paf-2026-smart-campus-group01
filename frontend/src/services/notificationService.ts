import api from "./api";
import type { BookingNotification } from "@/types/booking";

export interface SendAdminNotificationRequest {
  title: string;
  message: string;
  audience: "ALL_USERS" | "STUDENTS" | "STAFF" | "ADMINS" | "SELECTED_USERS";
  type?: BookingNotification["type"];
  userIds?: number[];
  targetPath?: string;
}

const notificationService = {
  getNotifications: async (): Promise<BookingNotification[]> => {
    const response = await api.get("/notifications");
    return response.data || [];
  },

  getUnreadNotifications: async (): Promise<BookingNotification[]> => {
    const response = await api.get("/notifications/unread");
    return response.data || [];
  },

  getUnreadCount: async (): Promise<number> => {
    const response = await api.get("/notifications/unread/count");
    return Number(response.data?.unreadCount || 0);
  },

  markAsRead: async (notificationId: number | string) => {
    const response = await api.put(`/notifications/${notificationId}/read`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await api.put("/notifications/read-all");
    return response.data;
  },

  deleteNotification: async (notificationId: number | string) => {
    const response = await api.delete(`/notifications/${notificationId}`);
    return response.data;
  },

  deleteAllNotifications: async () => {
    const response = await api.delete("/notifications/delete-all");
    return response.data;
  },

  sendAdminNotification: async (payload: SendAdminNotificationRequest) => {
    const response = await api.post("/notifications/admin/send", payload);
    return response.data;
  },
};

export default notificationService;