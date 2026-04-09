import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CheckCircle2,
  Loader2,
  Send,
  Trash2,
  Users,
  UserRound,
  UserSquare,
} from "lucide-react";
import notificationService, { type SendAdminNotificationRequest } from "@/services/notificationService";
import adminUserService, { type UserResponse } from "@/services/admin/adminUserService";
import type { BookingNotification } from "@/types/booking";
import { resolveNotificationPath } from "@/utils/notificationNavigation";

const notificationTypes: BookingNotification["type"][] = [
  "ADMIN_ALERT",
  "BOOKING_PENDING",
  "BOOKING_CONFIRMED",
  "BOOKING_REJECTED",
  "BOOKING_CANCELLED",
  "TICKET_CREATED",
  "TICKET_ASSIGNED",
  "TICKET_REPLY",
  "TICKET_STATUS_UPDATED",
  "STUDENT_REGISTERED",
];

const audienceOptions: Array<{
  value: SendAdminNotificationRequest["audience"];
  label: string;
  helper: string;
}> = [
  { value: "ALL_USERS", label: "All Users", helper: "Send to every active user" },
  { value: "STUDENTS", label: "Students", helper: "Only users with STUDENT role" },
  { value: "STAFF", label: "Staff", helper: "Academic and non-academic staff" },
  { value: "ADMINS", label: "Admins", helper: "Only admin accounts" },
  { value: "SELECTED_USERS", label: "Selected Users", helper: "Choose one or more users manually" },
];

const prettyType = (value: string) =>
  value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const formatTime = (value: string) => {
  const parsed = new Date(value).getTime();
  if (Number.isNaN(parsed)) return "Just now";

  const diffMinutes = Math.floor((Date.now() - parsed) / 60000);
  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return new Date(value).toLocaleString();
};

export const NotificationsPage = (): JSX.Element => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<BookingNotification[]>([]);
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [readFilter, setReadFilter] = useState<"ALL" | "UNREAD" | "READ">("ALL");
  const [typeFilter, setTypeFilter] = useState<"ALL" | BookingNotification["type"]>("ALL");

  const [form, setForm] = useState<SendAdminNotificationRequest>({
    title: "",
    message: "",
    audience: "STUDENTS",
    type: "ADMIN_ALERT",
    userIds: [],
    targetPath: "",
  });

  const isSelectedAudience = form.audience === "SELECTED_USERS";

  const loadNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const [list, unread] = await Promise.all([
        notificationService.getNotifications(),
        notificationService.getUnreadCount(),
      ]);
      setNotifications(list);
      setUnreadCount(unread);
    } catch {
      setError("Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await adminUserService.getAllUsers();
      setUsers(response.data?.data || []);
    } catch {
      setUsers([]);
    }
  };

  useEffect(() => {
    void loadNotifications();
    void loadUsers();

    const interval = window.setInterval(() => {
      void loadNotifications();
    }, 25000);

    return () => window.clearInterval(interval);
  }, []);

  const filteredNotifications = useMemo(() => {
    return notifications.filter((notification) => {
      const readMatched =
        readFilter === "ALL" ||
        (readFilter === "READ" && notification.isRead) ||
        (readFilter === "UNREAD" && !notification.isRead);

      const typeMatched = typeFilter === "ALL" || notification.type === typeFilter;
      return readMatched && typeMatched;
    });
  }, [notifications, readFilter, typeFilter]);

  const toggleSelectedUser = (userId: number) => {
    setForm((previous) => {
      const selected = new Set(previous.userIds || []);
      if (selected.has(userId)) {
        selected.delete(userId);
      } else {
        selected.add(userId);
      }

      return {
        ...previous,
        userIds: Array.from(selected),
      };
    });
  };

  const handleSend = async () => {
    if (!form.title.trim() || !form.message.trim()) {
      setError("Title and message are required.");
      return;
    }

    if (isSelectedAudience && (!form.userIds || form.userIds.length === 0)) {
      setError("Select at least one user for selected-users audience.");
      return;
    }

    setSending(true);
    setError(null);
    setSuccess(null);

    try {
      const payload: SendAdminNotificationRequest = {
        title: form.title.trim(),
        message: form.message.trim(),
        audience: form.audience,
        type: form.type || "ADMIN_ALERT",
        userIds: isSelectedAudience ? form.userIds : undefined,
        targetPath: form.targetPath?.trim() || undefined,
      };

      const response = await notificationService.sendAdminNotification(payload);
      const sentCount = Number(response?.count || 0);

      setSuccess(`Notification sent successfully to ${sentCount} user${sentCount === 1 ? "" : "s"}.`);
      setForm((previous) => ({
        ...previous,
        title: "",
        message: "",
        userIds: [],
        targetPath: "",
      }));

      await loadNotifications();
    } catch (sendError: any) {
      setError(sendError?.response?.data?.error || "Failed to send notification.");
    } finally {
      setSending(false);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((previous) =>
        previous.map((item) => (item.id === id ? { ...item, isRead: true } : item))
      );
      setUnreadCount((count) => Math.max(0, count - 1));
    } catch {
      setError("Failed to mark notification as read.");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((previous) => previous.map((item) => ({ ...item, isRead: true })));
      setUnreadCount(0);
    } catch {
      setError("Failed to mark all notifications as read.");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await notificationService.deleteNotification(id);
      setNotifications((previous) => previous.filter((item) => item.id !== id));
    } catch {
      setError("Failed to delete notification.");
    }
  };

  const handleDeleteAll = async () => {
    try {
      await notificationService.deleteAllNotifications();
      setNotifications([]);
      setUnreadCount(0);
    } catch {
      setError("Failed to delete all notifications.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Bell className="h-6 w-6" />
              Notification Management
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {unreadCount > 0
                ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
                : "All notifications are read"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleMarkAllAsRead}
              className="px-3 py-2 text-sm rounded-md border border-border hover:bg-muted transition"
            >
              Mark all read
            </button>
            <button
              onClick={handleDeleteAll}
              className="px-3 py-2 text-sm rounded-md border border-destructive/30 text-destructive hover:bg-destructive/10 transition"
            >
              Delete all
            </button>
          </div>
        </div>
      </div>

      {(error || success) && (
        <div className="space-y-2">
          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {success}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1.1fr,1.9fr] gap-6">
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Send className="h-5 w-5" />
            Send Notification
          </h2>

          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Audience</label>
              <select
                value={form.audience}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    audience: event.target.value as SendAdminNotificationRequest["audience"],
                    userIds: [],
                  }))
                }
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                {audienceOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                {audienceOptions.find((option) => option.value === form.audience)?.helper}
              </p>
            </div>

            {isSelectedAudience && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Select Users</label>
                <div className="max-h-52 overflow-auto rounded-md border border-border p-2 space-y-2">
                  {users.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No users available.</p>
                  ) : (
                    users.map((user) => {
                      const isSelected = (form.userIds || []).includes(user.id);
                      return (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => toggleSelectedUser(user.id)}
                          className={`w-full text-left rounded-md border px-2 py-2 transition ${
                            isSelected
                              ? "border-primary bg-primary/10"
                              : "border-border hover:bg-muted"
                          }`}
                        >
                          <p className="text-sm font-medium text-foreground">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">{prettyType(user.role)}</p>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Type</label>
              <select
                value={form.type}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    type: event.target.value as BookingNotification["type"],
                  }))
                }
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                {notificationTypes.map((type) => (
                  <option key={type} value={type}>
                    {prettyType(type)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Title</label>
              <input
                value={form.title}
                onChange={(event) =>
                  setForm((previous) => ({ ...previous, title: event.target.value }))
                }
                placeholder="Enter notification title"
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Message</label>
              <textarea
                value={form.message}
                onChange={(event) =>
                  setForm((previous) => ({ ...previous, message: event.target.value }))
                }
                placeholder="Write your message"
                className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Target Path (optional)</label>
              <input
                value={form.targetPath}
                onChange={(event) =>
                  setForm((previous) => ({ ...previous, targetPath: event.target.value }))
                }
                placeholder="Example: /admin?view=tickets"
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              />
            </div>

            <button
              onClick={handleSend}
              disabled={sending}
              className="w-full h-10 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {sending && <Loader2 className="h-4 w-4 animate-spin" />}
              Send Notification
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-foreground">Inbox</h2>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={readFilter}
                onChange={(event) => setReadFilter(event.target.value as "ALL" | "UNREAD" | "READ")}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="ALL">All</option>
                <option value="UNREAD">Unread</option>
                <option value="READ">Read</option>
              </select>

              <select
                value={typeFilter}
                onChange={(event) =>
                  setTypeFilter(event.target.value as "ALL" | BookingNotification["type"])
                }
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="ALL">All Types</option>
                {notificationTypes.map((type) => (
                  <option key={type} value={type}>
                    {prettyType(type)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {loading ? (
              <div className="rounded-lg border border-border p-5 text-sm text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading notifications...
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                No notifications found.
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`rounded-lg border p-3 transition ${
                    notification.isRead
                      ? "border-border bg-background"
                      : "border-primary/40 bg-primary/5"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground line-clamp-1">
                          {notification.title}
                        </p>
                        {!notification.isRead && <span className="w-2 h-2 rounded-full bg-primary" />}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{notification.message}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                        <span className="px-2 py-0.5 rounded-full border border-border bg-muted/50">
                          {prettyType(notification.type)}
                        </span>
                        <span>{formatTime(notification.createdAt)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {!notification.isRead && (
                        <button
                          onClick={() => void handleMarkAsRead(notification.id)}
                          className="h-8 w-8 rounded-md border border-border hover:bg-muted flex items-center justify-center"
                          title="Mark as read"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </button>
                      )}

                      <button
                        onClick={() => void handleDelete(notification.id)}
                        className="h-8 w-8 rounded-md border border-destructive/30 text-destructive hover:bg-destructive/10 flex items-center justify-center"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => navigate(resolveNotificationPath(notification, "ADMIN"))}
                        className="h-8 rounded-md border border-border px-2 text-xs hover:bg-muted"
                      >
                        Open
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground">
            <div className="rounded-md border border-border px-3 py-2 flex items-center gap-2">
              <Users className="h-3.5 w-3.5" /> All users
            </div>
            <div className="rounded-md border border-border px-3 py-2 flex items-center gap-2">
              <UserRound className="h-3.5 w-3.5" /> Students
            </div>
            <div className="rounded-md border border-border px-3 py-2 flex items-center gap-2">
              <UserSquare className="h-3.5 w-3.5" /> Staff
            </div>
            <div className="rounded-md border border-border px-3 py-2 flex items-center gap-2">
              <Bell className="h-3.5 w-3.5" /> Admin alerts
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default NotificationsPage;
