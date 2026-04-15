import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Search, Sun, Moon, ChevronDown, User, Settings, LogOut, ShieldCheck, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import notificationService from "@/services/notificationService";
import type { BookingNotification } from "@/types/booking";
import { resolveNotificationPath } from "@/utils/notificationNavigation";

interface NavbarProps {
  darkMode: boolean;
  onToggleDark: () => void;
}

export const Navbar = ({ darkMode, onToggleDark }: NavbarProps) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [notifications, setNotifications] = useState<BookingNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/auth/login");
  };

  const loadNotifications = async () => {
    setLoadingNotifications(true);
    try {
      const [list, unread] = await Promise.all([
        notificationService.getNotifications(),
        notificationService.getUnreadCount(),
      ]);
      setNotifications(list.slice(0, 8));
      setUnreadCount(unread);
    } catch {
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoadingNotifications(false);
    }
  };

  useEffect(() => {
    void loadNotifications();

    const interval = window.setInterval(() => {
      void loadNotifications();
    }, 25000);

    return () => window.clearInterval(interval);
  }, []);

  const notifTypeColor: Record<BookingNotification["type"], string> = {
    BOOKING_CONFIRMED: "bg-success",
    BOOKING_PENDING: "bg-warning",
    BOOKING_REJECTED: "bg-destructive",
    TICKET_CREATED: "bg-info",
    TICKET_ASSIGNED: "bg-primary",
    TICKET_REPLY: "bg-info",
    TICKET_STATUS_UPDATED: "bg-warning",
    STUDENT_REGISTERED: "bg-primary",
    SWAP_REQUEST_RECEIVED: "bg-info",
    SWAP_REQUEST_APPROVED: "bg-success",
    SWAP_REQUEST_REJECTED: "bg-destructive",
    BOOKING_REMINDER: "bg-warning",
    BOOKING_CANCELLED: "bg-destructive",
    ADMIN_ALERT: "bg-primary",
  };

  const formatNotificationTime = (value: string) => {
    const createdAt = new Date(value).getTime();
    if (Number.isNaN(createdAt)) {
      return "Just now";
    }

    const diffMinutes = Math.floor((Date.now() - createdAt) / 60000);
    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const handleNotificationClick = async (notification: BookingNotification) => {
    if (!notification.isRead) {
      try {
        await notificationService.markAsRead(notification.id);
      } catch {
        // Continue with navigation even if mark-as-read fails.
      }
    }

    setShowNotifications(false);
    navigate(resolveNotificationPath(notification, "ADMIN"));
  };

  return (
    <header className="h-16 glass-card border-b border-border/70 flex items-center justify-between px-4 md:px-6 gap-4 relative z-40">
      <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-success/10 border border-success/20">
        <ShieldCheck size={14} className="text-success" />
        <span className="text-xs font-semibold text-success">Campus systems secure</span>
      </div>

      <div
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-xl border transition-all duration-200",
          "bg-card/80 max-w-xl w-full",
          searchFocused ? "border-primary shadow-sm ring-2 ring-primary/10" : "border-border/70"
        )}
      >
        <Search size={16} className="text-muted-foreground flex-shrink-0" />
        <input
          type="text"
          placeholder="Search buildings, floors, rooms, reports..."
          className="bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground w-full"
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
        />
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden lg:block text-right mr-2">
          <p className="text-xs text-muted-foreground">
            {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </p>
          <p className="text-xs font-semibold text-foreground">Operations Desk</p>
        </div>

        <button
          onClick={onToggleDark}
          className="w-9 h-9 rounded-xl bg-muted/70 hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-all duration-200"
          aria-label="Toggle dark mode"
        >
          {darkMode ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfile(false);
            }}
            className="w-9 h-9 rounded-xl bg-muted/70 hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-all duration-200 relative"
            aria-label="Notifications"
          >
            <Bell size={17} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent-red text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-12 w-80 bg-card border border-border rounded-2xl shadow-card-hover animate-scale-in z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <h3 className="font-semibold text-foreground text-sm">Notifications</h3>
                <span className="text-xs text-muted-foreground">{unreadCount} unread</span>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-border">
                {loadingNotifications ? (
                  <div className="p-4 text-xs text-muted-foreground flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading notifications...
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-4 text-xs text-muted-foreground">No notifications yet.</div>
                ) : (
                  notifications.map((notif) => (
                    <button
                      key={notif.id}
                      onClick={() => void handleNotificationClick(notif)}
                      className={cn(
                        "w-full text-left flex gap-3 p-4 hover:bg-muted/40 cursor-pointer transition-colors",
                        !notif.isRead && "bg-primary/5"
                      )}
                    >
                      <div className={cn("w-2 h-2 rounded-full mt-1.5 flex-shrink-0", notifTypeColor[notif.type])} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{notif.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{notif.message}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">{formatNotificationTime(notif.createdAt)}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
              <div className="p-3 border-t border-border">
                <button
                  className="w-full text-center text-xs font-medium text-primary hover:underline"
                  onClick={() => {
                    setShowNotifications(false);
                    navigate("/admin?view=notifications");
                  }}
                >
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => {
              setShowProfile(!showProfile);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-muted/70 transition-all duration-200 group"
          >
            <div className="w-8 h-8 rounded-xl gradient-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              AD
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-semibold text-foreground leading-none">
                {user?.firstName || "Admin"} {user?.lastName || "User"}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{user?.role || "ADMIN"}</p>
            </div>
            <ChevronDown size={14} className="text-muted-foreground group-hover:text-foreground transition-all duration-200 hidden md:block" />
          </button>

          {showProfile && (
            <div className="absolute right-0 top-12 w-52 bg-card border border-border rounded-2xl shadow-card-hover animate-scale-in z-50 overflow-hidden">
              <div className="p-4 border-b border-border">
                <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center text-white text-sm font-bold mb-2">
                  AD
                </div>
                <p className="font-semibold text-foreground text-sm">Admin User</p>
                <p className="text-xs text-muted-foreground">{user?.email || "admin@smartcampus.com"}</p>
              </div>
              <div className="p-2">
                {[
                  { icon: User, label: "My Profile" },
                  { icon: Settings, label: "Settings" },
                ].map(({ icon: Icon, label }) => (
                  <button
                    key={label}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted rounded-xl transition-colors"
                  >
                    <Icon size={15} />
                    {label}
                  </button>
                ))}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-xl transition-colors mt-1"
                >
                  <LogOut size={15} />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {(showNotifications || showProfile) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowNotifications(false);
            setShowProfile(false);
          }}
        />
      )}
    </header>
  );
};
