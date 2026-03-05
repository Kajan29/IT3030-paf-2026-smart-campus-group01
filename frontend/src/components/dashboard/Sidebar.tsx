import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  Trophy,
  Camera,
  CalendarDays,
  BookOpen,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  activeItem: string;
  onItemClick: (id: string) => void;
  collapsed: boolean;
  onToggle: () => void;
}

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "users", label: "User Management", icon: Users, badge: 5 },
  { id: "sports", label: "Sports Management", icon: Trophy },
  { id: "media", label: "Media Club", icon: Camera },
  { id: "events", label: "Event Management", icon: CalendarDays, badge: 3 },
  { id: "bookings", label: "Bookings", icon: BookOpen },
  { id: "reports", label: "Reports & Analytics", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: Settings },
];

export const Sidebar = ({ activeItem, onItemClick, collapsed, onToggle }: SidebarProps) => {
  return (
    <aside
      className={cn(
        "flex flex-col h-screen bg-sidebar border-r border-sidebar-border shadow-sidebar",
        "transition-all duration-300 ease-in-out flex-shrink-0",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-sidebar-border">
        <div className={cn("flex items-center gap-3 overflow-hidden", collapsed && "justify-center")}>
          <div className="w-9 h-9 rounded-xl bg-accent-red flex items-center justify-center flex-shrink-0 shadow-lg">
            <GraduationCap size={20} className="text-accent-red-foreground" />
          </div>
          {!collapsed && (
            <div className="animate-fade-in">
              <span className="text-white font-bold text-lg leading-none">Zentaritas</span>
              <p className="text-sidebar-foreground text-[10px] leading-tight mt-0.5">Admin Portal</p>
            </div>
          )}
        </div>
        <button
          onClick={onToggle}
          className={cn(
            "w-6 h-6 rounded-full bg-sidebar-accent flex items-center justify-center",
            "text-sidebar-foreground hover:text-white hover:bg-accent-red transition-all duration-200",
            collapsed && "hidden"
          )}
        >
          <ChevronLeft size={14} />
        </button>
      </div>

      {/* Expand button when collapsed */}
      {collapsed && (
        <button
          onClick={onToggle}
          className="mx-auto mt-3 w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center text-sidebar-foreground hover:text-white hover:bg-accent-red transition-all duration-200"
        >
          <ChevronRight size={14} />
        </button>
      )}

      {/* Nav Items */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto overflow-x-hidden">
        {!collapsed && (
          <p className="text-sidebar-foreground text-[10px] font-semibold uppercase tracking-widest px-3 mb-3">
            Main Menu
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
                  ? "bg-sidebar-accent text-white shadow-md"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-white"
              )}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-accent-red rounded-r-full" />
              )}
              <Icon
                size={18}
                className={cn(
                  "flex-shrink-0 transition-transform duration-200 group-hover:scale-110",
                  isActive ? "text-accent-red" : ""
                )}
              />
              {!collapsed && (
                <span className="flex-1 text-left truncate animate-fade-in">{item.label}</span>
              )}
              {!collapsed && item.badge && (
                <span className="bg-accent-red text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0">
                  {item.badge}
                </span>
              )}
              {collapsed && item.badge && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-accent-red rounded-full" />
              )}
              {/* Tooltip for collapsed */}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-sidebar-accent text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg">
                  {item.label}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-2 pb-4 border-t border-sidebar-border pt-3">
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-sidebar-foreground hover:bg-destructive/20 hover:text-destructive-foreground transition-all duration-200 group">
          <LogOut size={18} className="flex-shrink-0 group-hover:translate-x-1 transition-transform duration-200" />
          {!collapsed && <span className="animate-fade-in">Logout</span>}
        </button>
      </div>
    </aside>
  );
};
