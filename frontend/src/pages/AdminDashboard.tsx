import { useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Navbar } from "@/components/dashboard/Navbar";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { UserManagementPage } from "@/components/dashboard/UserManagementPage";
import { SportsManagementPage } from "@/components/dashboard/SportsManagementPage";
import { MediaClubPage } from "@/components/dashboard/MediaClubPage";
import { EventManagementPage } from "@/components/dashboard/EventManagementPage";
import { BookingsPage } from "@/components/dashboard/BookingsPage";
import { ReportsAnalyticsPage } from "@/components/dashboard/ReportsAnalyticsPage";
import { SettingsPage } from "@/components/dashboard/SettingsPage";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";

const pageComponents: Record<string, React.ComponentType> = {
  dashboard: DashboardOverview,
  users: UserManagementPage,
  sports: SportsManagementPage,
  media: MediaClubPage,
  events: EventManagementPage,
  bookings: BookingsPage,
  reports: ReportsAnalyticsPage,
  settings: SettingsPage,
};

const pageTitles: Record<string, string> = {
  dashboard: "Dashboard",
  users: "User Management",
  sports: "Sports Management",
  media: "Media Club",
  events: "Event Management",
  bookings: "Bookings",
  reports: "Reports & Analytics",
  settings: "Settings",
};

const AdminDashboard = () => {
  const [activeItem, setActiveItem] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const toggleDark = () => {
    setDarkMode((d) => {
      document.documentElement.classList.toggle("dark", !d);
      return !d;
    });
  };

  const PageComponent = pageComponents[activeItem];
  const pageTitle = pageTitles[activeItem] || activeItem;

  return (
    <div className="admin-theme flex h-screen dashboard-surface overflow-hidden">
      {mobileSidebarOpen && (
        <div className="fixed inset-0 bg-foreground/40 z-30 md:hidden" onClick={() => setMobileSidebarOpen(false)} />
      )}

      <div className="hidden md:flex">
        <Sidebar
          activeItem={activeItem}
          onItemClick={setActiveItem}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((c) => !c)}
        />
      </div>

      <div className={cn(
        "fixed top-0 left-0 h-full z-40 md:hidden transition-transform duration-300",
        mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <Sidebar
          activeItem={activeItem}
          onItemClick={(id) => { setActiveItem(id); setMobileSidebarOpen(false); }}
          collapsed={false}
          onToggle={() => setMobileSidebarOpen(false)}
        />
      </div>

      <div className="flex flex-col flex-1 min-w-0">
        <div className="md:hidden flex items-center gap-3 px-4 py-3 glass-card border-b border-border">
          <button onClick={() => setMobileSidebarOpen(true)} className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
            <Menu size={18} />
          </button>
          <span className="font-bold text-primary text-lg">Zentaritas Admin</span>
          <span className="text-muted-foreground text-sm ml-1">/ {pageTitle}</span>
        </div>

        <Navbar darkMode={darkMode} onToggleDark={toggleDark} />

        <main className="flex-1 overflow-auto p-4 md:p-6">
          {PageComponent ? <PageComponent /> : <DashboardOverview />}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
