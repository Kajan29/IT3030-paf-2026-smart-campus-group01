import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Search, Sun, Moon, ChevronDown, User, Settings, LogOut, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { mockNotifications } from "@/data/mockData";
import { useAuth } from "@/context/AuthContext";

interface NavbarProps {
  darkMode: boolean;
  onToggleDark: () => void;
}

export const Navbar = ({ darkMode, onToggleDark }: NavbarProps) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/auth/login");
  };

  const unreadCount = mockNotifications.filter((n) => !n.read).length;

  const notifTypeColor: Record<string, string> = {
    info: "bg-info",
    warning: "bg-warning",
    error: "bg-destructive",
    success: "bg-success",
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
                {mockNotifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={cn(
                      "flex gap-3 p-4 hover:bg-muted/40 cursor-pointer transition-colors",
                      !notif.read && "bg-primary/5"
                    )}
                  >
                    <div className={cn("w-2 h-2 rounded-full mt-1.5 flex-shrink-0", notifTypeColor[notif.type])} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{notif.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{notif.message}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{notif.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-3 border-t border-border">
                <button className="w-full text-center text-xs font-medium text-primary hover:underline">
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
              <p className="text-sm font-semibold text-foreground leading-none">Admin User</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Super Admin</p>
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
                <p className="text-xs text-muted-foreground">admin@unihub.edu</p>
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
