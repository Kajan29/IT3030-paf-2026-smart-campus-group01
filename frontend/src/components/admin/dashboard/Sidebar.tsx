import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Ticket,
  Building2,
  Layers,
  DoorOpen,
  Clock3,
  BookOpen,
  RefreshCw,
  Bell,
  BarChart3,
  Settings,
  House,
  LogOut,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

interface SidebarProps {
  activeItem: string;
  onItemClick: (id: string) => void;
  collapsed: boolean;
  onToggle: () => void;
}

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "users", label: "User Management", icon: Users, badge: 5 },
  { id: "tickets", label: "Ticket Management", icon: Ticket },
  { id: "buildings", label: "Building Management", icon: Building2 },
  { id: "floors", label: "Floor Management", icon: Layers },
  { id: "rooms", label: "Room Management", icon: DoorOpen, badge: 12 },
  { id: "availability", label: "Room Availability", icon: Clock3 },
  { id: "bookings", label: "Bookings", icon: BookOpen },
  { id: "swapRequests", label: "Staff Override Requests", icon: RefreshCw },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "reports", label: "Reports & Analytics", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: Settings },
];

export const Sidebar = ({ activeItem, onItemClick, collapsed, onToggle }: SidebarProps) => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/auth/login");
  };

  const handleBackToHome = () => {
    navigate("/");
  };

  return (
    <aside
      className={cn(
        "relative flex flex-col h-screen border-r border-sidebar-border/70 shadow-[6px_0_22px_-8px_hsl(var(--foreground)/0.35)] overflow-hidden",
        "transition-all duration-300 ease-in-out flex-shrink-0",
        "bg-sidebar",
        collapsed ? "w-16" : "w-72"
      )}
    >
      <div className="relative flex items-center justify-between px-4 py-5 border-b border-sidebar-border/70">
        <div className={cn("flex items-center gap-3 overflow-hidden", collapsed && "justify-center")}>
          <div className="w-10 h-10 rounded-2xl bg-sidebar-primary flex items-center justify-center flex-shrink-0 shadow-lg">
            <GraduationCap size={20} className="text-white" />
          </div>
          {!collapsed && (
            <div className="animate-fade-in">
              <span className="text-white font-bold text-lg leading-none">Zentaritas</span>
              <p className="text-sidebar-foreground text-[10px] leading-tight mt-0.5 tracking-[0.16em] uppercase">
                University Ops
              </p>
            </div>
          )}
        </div>
        <button
          onClick={onToggle}
          className={cn(
            "w-7 h-7 rounded-full bg-sidebar-accent/90 flex items-center justify-center",
            "text-sidebar-foreground hover:text-white hover:bg-accent-red transition-all duration-200",
            collapsed && "hidden"
          )}
          aria-label="Collapse sidebar"
        >
          <ChevronLeft size={14} />
        </button>
      </div>

      {collapsed && (
        <button
          onClick={onToggle}
          className="mx-auto mt-3 w-9 h-9 rounded-full bg-sidebar-accent/90 flex items-center justify-center text-sidebar-foreground hover:text-white hover:bg-accent-red transition-all duration-200"
          aria-label="Expand sidebar"
        >
          <ChevronRight size={14} />
        </button>
      )}

      {!collapsed && (
        <div className="relative mx-3 mt-4 p-3 rounded-xl bg-white/10 border border-white/15">
          <p className="text-[10px] uppercase tracking-[0.14em] text-sidebar-foreground">Campus Security</p>
          <div className="mt-1.5 flex items-center justify-between">
            <p className="text-sm font-semibold text-white">All systems normal</p>
            <ShieldCheck size={14} className="text-success" />
          </div>
        </div>
      )}

      <nav className="relative flex-1 px-2 py-4 space-y-1 overflow-y-auto overflow-x-hidden">
        {!collapsed && (
          <p className="text-sidebar-foreground text-[10px] font-semibold uppercase tracking-widest px-3 mb-3">
            Navigation
          </p>
        )}
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onItemClick(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium",
                "transition-all duration-200 group relative",
                isActive
                  ? "bg-white text-primary shadow-md"
                  : "text-sidebar-foreground hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon
                size={18}
                className={cn(
                  "flex-shrink-0 transition-transform duration-200 group-hover:scale-110",
                  isActive ? "text-primary" : ""
                )}
              />
              {!collapsed && <span className="flex-1 text-left truncate animate-fade-in">{item.label}</span>}
              {!collapsed && item.badge && (
                <span className={cn(
                  "text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0",
                  isActive ? "bg-primary text-white" : "bg-accent-red text-white"
                )}>
                  {item.badge}
                </span>
              )}
              {collapsed && item.badge && <span className="absolute top-1 right-1 w-2 h-2 bg-accent-red rounded-full" />}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-sidebar-accent text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg">
                  {item.label}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      <div className="relative px-2 pb-4 border-t border-sidebar-border/70 pt-3">
        <button
          onClick={handleBackToHome}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-sidebar-foreground hover:bg-white/10 hover:text-white transition-all duration-200 group relative"
        >
          <House size={18} className="flex-shrink-0 group-hover:-translate-x-1 transition-transform duration-200" />
          {!collapsed && <span className="animate-fade-in">Back to Home</span>}
          {collapsed && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-sidebar-accent text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg">
              Back to Home
            </div>
          )}
        </button>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-sidebar-foreground hover:bg-destructive/20 hover:text-destructive-foreground transition-all duration-200 group"
        >
          <LogOut size={18} className="flex-shrink-0 group-hover:translate-x-1 transition-transform duration-200" />
          {!collapsed && <span className="animate-fade-in">Logout</span>}
        </button>
      </div>
    </aside>
  );
};
