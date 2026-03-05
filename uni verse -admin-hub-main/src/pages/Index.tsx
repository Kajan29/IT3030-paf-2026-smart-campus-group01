import { useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Navbar } from "@/components/dashboard/Navbar";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { UserManagementPage } from "@/components/dashboard/UserManagementPage";
import { SportsManagementPage } from "@/components/dashboard/SportsManagementPage";
import { MediaClubPage } from "@/components/dashboard/MediaClubPage";
import { EventManagementPage } from "@/components/dashboard/EventManagementPage";
import { BookingsPage } from "@/components/dashboard/BookingsPage";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";

const pageComponents: Record<string, React.ComponentType> = {
  dashboard: DashboardOverview,
  users: UserManagementPage,
  sports: SportsManagementPage,
  media: MediaClubPage,
  events: EventManagementPage,
  bookings: BookingsPage,
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

const ComingSoon = ({ title }: { title: string }) => (
  <div className="flex flex-col items-center justify-center h-96 text-center animate-fade-in">
    <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mb-4">
      <span className="text-3xl">🚧</span>
    </div>
    <h2 className="text-xl font-bold text-foreground mb-2">{title}</h2>
    <p className="text-muted-foreground text-sm max-w-xs">This section is under construction. Check back soon for the full feature.</p>
  </div>
);

const Index = () => {
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
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 bg-foreground/40 z-30 md:hidden" onClick={() => setMobileSidebarOpen(false)} />
      )}

      {/* Sidebar — desktop */}
      <div className="hidden md:flex">
        <Sidebar
          activeItem={activeItem}
          onItemClick={setActiveItem}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((c) => !c)}
        />
      </div>

      {/* Sidebar — mobile */}
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

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Mobile header */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-card border-b border-border">
          <button onClick={() => setMobileSidebarOpen(true)} className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
            <Menu size={18} />
          </button>
          <span className="font-bold text-primary text-lg">UniHub</span>
          <span className="text-muted-foreground text-sm ml-1">/ {pageTitle}</span>
        </div>

        {/* Navbar */}
        <Navbar darkMode={darkMode} onToggleDark={toggleDark} />

        {/* Breadcrumb */}
        <div className="hidden md:flex items-center gap-2 px-6 py-2.5 bg-card border-b border-border text-xs text-muted-foreground">
          <span className="text-primary font-medium">UniHub</span>
          <span>/</span>
          <span className="text-foreground font-medium">{pageTitle}</span>
        </div>

        {/* Page body */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {PageComponent ? (
            <PageComponent />
          ) : (
            <ComingSoon title={pageTitle} />
          )}
        </main>
      </div>
    </div>
  );
};

export default Index;
