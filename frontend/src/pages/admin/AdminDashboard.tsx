import { useEffect, useState } from "react";
import { Sidebar } from "@/components/admin/dashboard/Sidebar";
import { Navbar } from "@/components/admin/dashboard/Navbar";
import { DashboardOverview } from "@/components/admin/dashboard/DashboardOverview";
import { UserManagementPage } from "@/components/admin/dashboard/UserManagementPage";
import { BuildingManagementPage } from "@/components/admin/dashboard/BuildingManagementPage";
import { FloorManagementPage } from "@/components/admin/dashboard/FloorManagementPage";
import { RoomManagementPage } from "@/components/admin/dashboard/RoomManagementPage";
import { BuildingDetailsPage } from "@/components/admin/dashboard/BuildingDetailsPage";
import { RoomDetailsPage } from "@/components/admin/dashboard/RoomDetailsPage";
import RoomAvailabilityManagementPage from "@/components/admin/dashboard/RoomAvailabilityManagementPage";
import { BookingsPage } from "@/components/admin/dashboard/BookingsPage";
import { ReportsAnalyticsPage } from "@/components/admin/dashboard/ReportsAnalyticsPage";
import { SettingsPage } from "@/components/admin/dashboard/SettingsPage";
import { ResourceManagementPage } from "@/components/admin/dashboard/ResourceManagementPage";
import { SwapRequestManagementPage } from "@/pages/admin/SwapRequestManagementPage";
import { NotificationsPage } from "@/pages/admin/NotificationsPage";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";

const pageTitles: Record<string, string> = {
  dashboard: "Dashboard",
  users: "User Management",
  buildings: "Building Management",
  floors: "Floor Management",
  rooms: "Room Management",
  resources: "Resource Management",
  availability: "Room Availability",
  buildingDetails: "Building Details",
  roomDetails: "Room Details",
  bookings: "Bookings",
  swapRequests: "Staff Override Requests",
  notifications: "Notifications",
  reports: "Reports & Analytics",
  settings: "Settings",
};

const AdminDashboard = () => {
  const [activeItem, setActiveItem] = useState("dashboard");
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);
  const [selectedFloorId, setSelectedFloorId] = useState<string | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const toggleDark = () => {
    setDarkMode((d) => {
      document.documentElement.classList.toggle("dark", !d);
      return !d;
    });
  };

  const openBuildingDetails = (buildingId: string) => {
    setSelectedBuildingId(buildingId);
    setActiveItem("buildingDetails");
  };

  const openFloorManagement = (buildingId?: string) => {
    if (buildingId) {
      setSelectedBuildingId(buildingId);
    }
    setActiveItem("floors");
  };

  const openRoomManagement = (buildingId?: string, floorId?: string) => {
    if (buildingId) {
      setSelectedBuildingId(buildingId);
    }
    if (floorId) {
      setSelectedFloorId(floorId);
    }
    setActiveItem("rooms");
  };

  const openRoomDetails = (roomId: string) => {
    setSelectedRoomId(roomId);
    setActiveItem("roomDetails");
  };

  const selectRoomFromAvailability = (roomId: string) => {
    setSelectedRoomId(roomId);
    setActiveItem("availability");
  };

  const renderPage = () => {
    switch (activeItem) {
      case "dashboard":
        return <DashboardOverview />;
      case "users":
        return <UserManagementPage />;
      case "buildings":
        return (
          <BuildingManagementPage
            onOpenBuildingDetails={openBuildingDetails}
            onOpenFloorManagement={openFloorManagement}
            onOpenRoomManagement={openRoomManagement}
          />
        );
      case "floors":
        return (
          <FloorManagementPage
            selectedBuildingId={selectedBuildingId}
            onOpenBuildingDetails={openBuildingDetails}
            onOpenRoomManagement={openRoomManagement}
          />
        );
      case "rooms":
        return (
          <RoomManagementPage
            selectedBuildingId={selectedBuildingId}
            selectedFloorId={selectedFloorId}
            onOpenRoomDetails={openRoomDetails}
          />
        );
      case "resources":
        return <ResourceManagementPage />;
      case "availability":
        return <RoomAvailabilityManagementPage selectedRoomId={selectedRoomId} onOpenRoomDetails={selectRoomFromAvailability} onClearRoomSelection={() => setSelectedRoomId(null)} />;
      case "buildingDetails":
        return (
          <BuildingDetailsPage
            buildingId={selectedBuildingId}
            onOpenFloorManagement={openFloorManagement}
            onOpenRoomDetails={openRoomDetails}
          />
        );
      case "roomDetails":
        return <RoomDetailsPage roomId={selectedRoomId} onBack={() => setActiveItem("availability")} />;
      case "bookings":
        return <BookingsPage />;
      case "swapRequests":
        return <SwapRequestManagementPage />;
      case "notifications":
        return <NotificationsPage />;
      case "reports":
        return <ReportsAnalyticsPage />;
      case "settings":
        return <SettingsPage />;
      default:
        return <DashboardOverview />;
    }
  };

  const navActiveItem =
    activeItem === "buildingDetails" ? "buildings" : activeItem === "roomDetails" ? "rooms" : activeItem;

  const pageTitle = pageTitles[activeItem] || activeItem;

  return (
    <div className="admin-theme flex h-screen dashboard-surface overflow-hidden">
      {mobileSidebarOpen && (
        <div className="fixed inset-0 bg-foreground/40 z-30 md:hidden" onClick={() => setMobileSidebarOpen(false)} />
      )}

      <div className="hidden md:flex">
        <Sidebar
          activeItem={navActiveItem}
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
          activeItem={navActiveItem}
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
          {renderPage()}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;

