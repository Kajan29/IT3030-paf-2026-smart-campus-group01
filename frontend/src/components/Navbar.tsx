import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Bell, Loader2, Menu, X, GraduationCap, User, LogOut, LayoutDashboard, Settings, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/AuthContext";
import notificationService from "@/services/notificationService";
import type { BookingNotification } from "@/types/booking";
import { resolveNotificationPath } from "@/utils/notificationNavigation";

const navLinks = [
  { label: "Home", path: "/" },
  { label: "About", path: "/about" },
  { label: "Book Room", path: "/book-room", studentOnly: true },
  { label: "Find Room", path: "/find-room" },
  { label: "Resources", path: "/resources" },
  { label: "Gallery", path: "/gallery" },
  { label: "Contact", path: "/contact" },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<BookingNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const isStudent = user?.role === "STUDENT";

  const visibleNavLinks = navLinks.filter((link) => {
    if (!link.studentOnly) return true;
    return isAuthenticated && isStudent;
  });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setMobileOpen(false), [location]);

  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    let active = true;
    const loadNotifications = async () => {
      setNotificationsLoading(true);
      try {
        const [list, unread] = await Promise.all([
          notificationService.getNotifications(),
          notificationService.getUnreadCount(),
        ]);

        if (!active) return;
        setNotifications(list.slice(0, 8));
        setUnreadCount(unread);
      } catch {
        if (!active) return;
        setNotifications([]);
        setUnreadCount(0);
      } finally {
        if (active) {
          setNotificationsLoading(false);
        }
      }
    };

    void loadNotifications();
    const interval = window.setInterval(() => {
      void loadNotifications();
    }, 25000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [isAuthenticated]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const getInitials = () => {
    if (!user) return "U";
    return `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase();
  };

  const avatarSrc = user?.profilePicture || "";

  const handleNotificationClick = async (notification: BookingNotification) => {
    if (!user) return;

    if (!notification.isRead) {
      try {
        await notificationService.markAsRead(notification.id);
        setNotifications((previous) =>
          previous.map((item) =>
            item.id === notification.id
              ? { ...item, isRead: true }
              : item
          )
        );
        setUnreadCount((count) => Math.max(0, count - 1));
      } catch {
        // Continue navigation even if marking read fails.
      }
    }

    setNotificationsOpen(false);
    navigate(resolveNotificationPath(notification, user.role));
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((previous) => previous.map((item) => ({ ...item, isRead: true })));
      setUnreadCount(0);
    } catch {
      // No-op for UX resilience.
    }
  };

  const formatNotificationTime = (value: string) => {
    const createdAt = new Date(value).getTime();
    if (Number.isNaN(createdAt)) return "Just now";

    const diffMinutes = Math.floor((Date.now() - createdAt) / 60000);
    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-primary/95 backdrop-blur-md shadow-lg py-3"
          : "bg-transparent py-5"
      }`}
    >
      <div className="container mx-auto flex items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <GraduationCap className="h-8 w-8 text-accent" />
          <span className="font-display text-xl font-bold text-primary-foreground tracking-wide">
            Zentaritas
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          {visibleNavLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`text-sm font-medium transition-colors relative pb-1 ${
                location.pathname === link.path
                  ? "text-accent"
                  : "text-primary-foreground/80 hover:text-accent"
              }`}
            >
              {link.label}
              {location.pathname === link.path && (
                <motion.div
                  layoutId="nav-underline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-full"
                />
              )}
            </Link>
          ))}
        </div>

        {/* Desktop Auth Buttons / User Menu */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <DropdownMenu open={notificationsOpen} onOpenChange={setNotificationsOpen}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-10 w-10 rounded-full"
                    aria-label="Open notifications"
                  >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-accent text-accent-foreground text-[10px] font-bold flex items-center justify-center">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-96" align="end" forceMount>
                  <div className="flex items-center justify-between px-2 py-1">
                    <p className="text-sm font-semibold">Notifications</p>
                    {unreadCount > 0 && (
                      <Button
                        variant="ghost"
                        className="h-7 px-2 text-xs"
                        onClick={handleMarkAllAsRead}
                      >
                        Mark all read
                      </Button>
                    )}
                  </div>
                  <DropdownMenuSeparator />

                  {notificationsLoading ? (
                    <div className="px-3 py-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading notifications...
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="px-3 py-6 text-sm text-muted-foreground text-center">
                      No notifications yet.
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <DropdownMenuItem
                        key={notification.id}
                        className="flex flex-col items-start gap-1 py-3 cursor-pointer"
                        onClick={() => void handleNotificationClick(notification)}
                      >
                        <div className="w-full flex items-center justify-between gap-2">
                          <p className="text-sm font-medium line-clamp-1">{notification.title}</p>
                          {!notification.isRead && <span className="w-2 h-2 rounded-full bg-accent" />}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">{notification.message}</p>
                        <p className="text-[11px] text-muted-foreground">{formatNotificationTime(notification.createdAt)}</p>
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="ghost"
                className="relative h-10 w-10 rounded-full"
                onClick={() => navigate("/profile")}
                title="Go to profile"
              >
                <Avatar className="h-10 w-10 border-2 border-accent">
                  <AvatarImage src={avatarSrc} alt={`${user?.firstName || ""} ${user?.lastName || ""}`} />
                  <AvatarFallback className="bg-accent text-accent-foreground font-semibold">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-10 w-10 rounded-full" aria-label="Open user menu">
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {user?.role === "ADMIN" && (
                    <DropdownMenuItem onClick={() => navigate("/admin/dashboard")}>
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      <span>Admin Dashboard</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => navigate("/profile")}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/settings")}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link to="/auth/login">
                <Button
                  variant="ghost"
                  className="text-primary-foreground/90 hover:text-accent hover:bg-primary-foreground/10 font-medium"
                >
                  Sign In
                </Button>
              </Link>
              <Link to="/auth/register">
                <Button className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold px-5">
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden text-primary-foreground"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-primary/95 backdrop-blur-md overflow-hidden"
          >
            <div className="container mx-auto px-4 py-4 flex flex-col gap-4">
              {visibleNavLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`text-sm font-medium py-2 border-b border-primary-foreground/10 ${
                    location.pathname === link.path
                      ? "text-accent"
                      : "text-primary-foreground/80"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              {/* Mobile Auth Buttons / User Menu */}
              <div className="flex flex-col gap-3 pt-4 border-t border-primary-foreground/10">
                {isAuthenticated ? (
                  <>
                    <div className="rounded-lg border border-primary-foreground/15 p-3 bg-primary-foreground/5">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-primary-foreground/80">
                          Notifications
                        </p>
                        {unreadCount > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-accent text-accent-foreground text-[10px] font-semibold">
                            {unreadCount} new
                          </span>
                        )}
                      </div>

                      {notificationsLoading ? (
                        <div className="flex items-center gap-2 text-xs text-primary-foreground/70">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Loading notifications...
                        </div>
                      ) : notifications.length === 0 ? (
                        <p className="text-xs text-primary-foreground/70">No notifications available.</p>
                      ) : (
                        <div className="space-y-2">
                          {notifications.slice(0, 3).map((notification) => (
                            <button
                              key={notification.id}
                              onClick={() => void handleNotificationClick(notification)}
                              className="w-full text-left rounded-md border border-primary-foreground/10 p-2 hover:bg-primary-foreground/10 transition"
                            >
                              <p className="text-xs font-medium text-primary-foreground line-clamp-1">{notification.title}</p>
                              <p className="text-[11px] text-primary-foreground/70 line-clamp-2">{notification.message}</p>
                            </button>
                          ))}
                        </div>
                      )}

                      {unreadCount > 0 && (
                        <Button
                          variant="outline"
                          className="mt-3 w-full border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
                          onClick={() => void handleMarkAllAsRead()}
                        >
                          Mark all as read
                        </Button>
                      )}
                    </div>

                    <div
                      className="flex items-center gap-3 px-2 py-3 bg-primary-foreground/5 rounded-lg cursor-pointer"
                      onClick={() => navigate("/profile")}
                    >
                      <Avatar className="h-10 w-10 border-2 border-accent">
                        <AvatarImage src={avatarSrc} alt={`${user?.firstName || ""} ${user?.lastName || ""}`} />
                        <AvatarFallback className="bg-accent text-accent-foreground font-semibold">
                          {getInitials()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <p className="text-sm font-medium text-primary-foreground">
                          {user?.firstName} {user?.lastName}
                        </p>
                        <p className="text-xs text-primary-foreground/60">
                          {user?.email}
                        </p>
                      </div>
                    </div>
                    {user?.role === "ADMIN" && (
                      <Button
                        variant="outline"
                        className="w-full border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 justify-start"
                        onClick={() => navigate("/admin/dashboard")}
                      >
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Admin Dashboard
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      className="w-full border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 justify-start"
                      onClick={() => navigate("/profile")}
                    >
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 justify-start"
                      onClick={() => navigate("/settings")}
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Button>
                    <Button
                      className="w-full bg-red-500 text-white hover:bg-red-600 font-semibold justify-start"
                      onClick={handleLogout}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </Button>
                  </>
                ) : (
                  <>
                    <Link to="/auth/login">
                      <Button
                        variant="outline"
                        className="w-full border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
                      >
                        Sign In
                      </Button>
                    </Link>
                    <Link to="/auth/register">
                      <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold">
                        Get Started
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
