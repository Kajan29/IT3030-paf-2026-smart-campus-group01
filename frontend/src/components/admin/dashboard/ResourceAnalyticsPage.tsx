import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  Layers,
  DoorOpen,
  Armchair,
  TrendingUp,
  AlertTriangle,
  Download,
  Filter,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Loader2,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Wrench,
  Wifi,
  Monitor,
  Thermometer,
  Accessibility,
  CheckCircle2,
  XCircle,
  Laptop,
  Projector,
  FlaskConical,
  Zap,
  FileText,
  FileSpreadsheet,
  type LucideIcon,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  CartesianGrid,
  XAxis,
  YAxis,
  AreaChart,
  Area,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";
import { facilityService } from "@/services/facilityService";
import resourceManagementService from "@/services/resourceManagementService";
import type { Building, Floor, Room } from "@/types/campusManagement";
import type { RoomResource } from "@/types/resourceManagement";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ResourcesByRoom {
  roomId: string;
  roomName: string;
  roomCode: string;
  buildingId: string;
  floorId: string;
  resources: RoomResource[];
}

/* ------------------------------------------------------------------ */
/*  Report Generation Utilities                                        */
/* ------------------------------------------------------------------ */

const escapeCsvCell = (value: string | number | boolean | null | undefined): string => {
  const str = String(value ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const toCsv = (headers: string[], rows: (string | number | boolean | null | undefined)[][]): string => {
  const headerLine = headers.map(escapeCsvCell).join(",");
  const bodyLines = rows.map((row) => row.map(escapeCsvCell).join(","));
  return [headerLine, ...bodyLines].join("\n");
};

const downloadCsv = (csv: string, filename: string) => {
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const generateTimestamp = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}_${String(d.getHours()).padStart(2, "0")}${String(d.getMinutes()).padStart(2, "0")}`;
};

type ReportType = "buildings" | "floors" | "rooms" | "resources" | "equipment" | "full";

interface ReportOption {
  id: ReportType;
  label: string;
  description: string;
  icon: LucideIcon;
}

const reportOptions: ReportOption[] = [
  { id: "full", label: "Full Report", description: "Complete analytics report with all data", icon: FileSpreadsheet },
  { id: "buildings", label: "Buildings Report", description: "Building details, status & capacity", icon: Building2 },
  { id: "floors", label: "Floors Report", description: "Floor details & accessibility data", icon: Layers },
  { id: "rooms", label: "Rooms Report", description: "Room inventory, capacity & facilities", icon: DoorOpen },
  { id: "resources", label: "Resources Report", description: "Resource inventory per room", icon: Armchair },
  { id: "equipment", label: "Equipment Summary", description: "Chairs, tables & equipment counts", icon: Monitor },
];

/* ------------------------------------------------------------------ */
/*  Chart theme                                                        */
/* ------------------------------------------------------------------ */

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--info))",
  "hsl(var(--success))",
  "hsl(var(--warning))",
  "hsl(var(--destructive))",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#6366f1",
];

const PIE_COLORS = [
  "#6366f1", "#8b5cf6", "#a855f7", "#d946ef",
  "#ec4899", "#f43f5e", "#ef4444", "#f97316",
  "#eab308", "#22c55e", "#14b8a6", "#06b6d4",
];

/* ------------------------------------------------------------------ */
/*  Shared UI                                                          */
/* ------------------------------------------------------------------ */

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border/80 bg-card/95 px-3 py-2 shadow-card-hover backdrop-blur-sm">
      {label && <p className="text-xs font-semibold text-foreground mb-1">{label}</p>}
      {payload.map((entry: any) => (
        <p key={entry.name} className="text-xs" style={{ color: entry.color }}>
          {entry.name}: {typeof entry.value === "number" ? entry.value.toLocaleString() : entry.value}
        </p>
      ))}
    </div>
  );
};

const SectionCard = ({
  title,
  subtitle,
  icon: Icon,
  children,
  className,
  action,
}: {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}) => (
  <div className={cn("bg-card rounded-2xl border border-border shadow-card", className)}>
    <div className="p-5 border-b border-border flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        {Icon && (
          <div className="w-8 h-8 rounded-xl gradient-primary flex items-center justify-center">
            <Icon size={15} className="text-white" />
          </div>
        )}
        <div>
          <h3 className="font-semibold text-foreground text-sm">{title}</h3>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
    <div className="p-5">{children}</div>
  </div>
);

const StatMini = ({
  label,
  value,
  icon: Icon,
  gradient,
  sub,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  gradient: string;
  sub?: string;
}) => (
  <div className="bg-card rounded-2xl p-4 border border-border shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-0.5 group">
    <div className="flex items-start justify-between mb-2">
      <p className="text-xs text-muted-foreground font-medium">{label}</p>
      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform", gradient)}>
        <Icon size={16} className="text-white" />
      </div>
    </div>
    <p className="text-2xl font-bold text-foreground tabular-nums">{typeof value === "number" ? value.toLocaleString() : value}</p>
    {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
  </div>
);

const Badge = ({ children, variant = "default" }: { children: React.ReactNode; variant?: "default" | "success" | "warning" | "destructive" | "info" }) => {
  const styles: Record<string, string> = {
    default: "bg-muted text-muted-foreground",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    destructive: "bg-destructive/10 text-destructive",
    info: "bg-info/10 text-info",
  };
  return <span className={cn("px-2 py-0.5 rounded-full text-xs font-semibold", styles[variant])}>{children}</span>;
};

const statusVariant = (status: string): "success" | "warning" | "destructive" | "info" | "default" => {
  const s = status.toLowerCase();
  if (s === "available" || s === "active" || s === "operational" || s === "excellent") return "success";
  if (s === "occupied" || s === "scheduled" || s === "fair" || s === "partial") return "warning";
  if (s === "under maintenance" || s === "inactive" || s === "critical" || s === "needs repair" || s === "not accessible") return "destructive";
  return "info";
};

/* ------------------------------------------------------------------ */
/*  Tabs                                                               */
/* ------------------------------------------------------------------ */

type TabId = "overview" | "buildings" | "floors" | "rooms" | "resources";

const tabs: { id: TabId; label: string; icon: LucideIcon }[] = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "buildings", label: "Buildings", icon: Building2 },
  { id: "floors", label: "Floors", icon: Layers },
  { id: "rooms", label: "Rooms", icon: DoorOpen },
  { id: "resources", label: "Resources", icon: Armchair },
];

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export const ResourceAnalyticsPage = () => {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [resourcesByRoom, setResourcesByRoom] = useState<ResourcesByRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAll = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const [blds, flrs, rms] = await Promise.all([
        facilityService.getBuildings(),
        facilityService.getFloors(),
        facilityService.getRooms(),
      ]);
      setBuildings(blds);
      setFloors(flrs);
      setRooms(rms);

      // Fetch resources for each room in parallel (limit concurrency)
      const BATCH = 6;
      const roomResourceResults: ResourcesByRoom[] = [];
      for (let i = 0; i < rms.length; i += BATCH) {
        const batch = rms.slice(i, i + BATCH);
        const results = await Promise.all(
          batch.map(async (room) => {
            try {
              const resources = await resourceManagementService.getResources(room.id);
              return {
                roomId: room.id,
                roomName: room.name,
                roomCode: room.code,
                buildingId: room.buildingId,
                floorId: room.floorId,
                resources,
              };
            } catch {
              return {
                roomId: room.id,
                roomName: room.name,
                roomCode: room.code,
                buildingId: room.buildingId,
                floorId: room.floorId,
                resources: [],
              };
            }
          })
        );
        roomResourceResults.push(...results);
      }
      setResourcesByRoom(roomResourceResults);
    } catch (error) {
      console.error("Failed to load analytics data", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  /* ---------- derived analytics ---------- */

  const allResources = useMemo(
    () => resourcesByRoom.flatMap((r) => r.resources),
    [resourcesByRoom]
  );

  const totalResourceQty = useMemo(
    () => allResources.reduce((sum, r) => sum + r.quantity, 0),
    [allResources]
  );

  // Buildings analytics
  const buildingStatusDist = useMemo(() => {
    const map = new Map<string, number>();
    buildings.forEach((b) => map.set(b.status, (map.get(b.status) || 0) + 1));
    return Array.from(map, ([name, value]) => ({ name, value }));
  }, [buildings]);

  const buildingsByType = useMemo(() => {
    const map = new Map<string, number>();
    buildings.forEach((b) => map.set(b.type || "Other", (map.get(b.type || "Other") || 0) + 1));
    return Array.from(map, ([name, value]) => ({ name, value }));
  }, [buildings]);

  const buildingsByCampus = useMemo(() => {
    const map = new Map<string, number>();
    buildings.forEach((b) => map.set(b.campus || "N/A", (map.get(b.campus || "N/A") || 0) + 1));
    return Array.from(map, ([name, value]) => ({ name, value }));
  }, [buildings]);

  // Floors analytics
  const floorAccessibility = useMemo(() => {
    const map = new Map<string, number>();
    floors.forEach((f) => map.set(f.accessibility, (map.get(f.accessibility) || 0) + 1));
    return Array.from(map, ([name, value]) => ({ name, value }));
  }, [floors]);

  const floorsPerBuilding = useMemo(() => {
    const map = new Map<string, number>();
    floors.forEach((f) => {
      const bld = buildings.find((b) => b.id === f.buildingId);
      const name = bld ? bld.name : `Building ${f.buildingId}`;
      map.set(name, (map.get(name) || 0) + 1);
    });
    return Array.from(map, ([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }, [floors, buildings]);

  // Rooms analytics
  const roomStatusDist = useMemo(() => {
    const map = new Map<string, number>();
    rooms.forEach((r) => map.set(r.status, (map.get(r.status) || 0) + 1));
    return Array.from(map, ([name, value]) => ({ name, value }));
  }, [rooms]);

  const roomTypeDist = useMemo(() => {
    const map = new Map<string, number>();
    rooms.forEach((r) => map.set(r.type, (map.get(r.type) || 0) + 1));
    return Array.from(map, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [rooms]);

  const roomConditionDist = useMemo(() => {
    const map = new Map<string, number>();
    rooms.forEach((r) => map.set(r.condition, (map.get(r.condition) || 0) + 1));
    return Array.from(map, ([name, value]) => ({ name, value }));
  }, [rooms]);

  const roomMaintenanceDist = useMemo(() => {
    const map = new Map<string, number>();
    rooms.forEach((r) => map.set(r.maintenanceStatus, (map.get(r.maintenanceStatus) || 0) + 1));
    return Array.from(map, ([name, value]) => ({ name, value }));
  }, [rooms]);

  const roomFacilitiesRadar = useMemo(() => {
    if (!rooms.length) return [];
    const smart = rooms.filter((r) => r.smartClassroomEnabled).length;
    const projector = rooms.filter((r) => r.projectorAvailable).length;
    const internet = rooms.filter((r) => r.internetAvailable).length;
    const ac = rooms.filter((r) => r.climateControl === "AC").length;
    const lab = rooms.filter((r) => r.labEquipmentAvailable).length;
    const power = rooms.filter((r) => r.powerBackupAvailable).length;
    const accessibility = rooms.filter((r) => r.accessibilitySupport).length;
    const booking = rooms.filter((r) => r.bookingAvailable).length;
    const total = rooms.length;
    return [
      { feature: "Smart Class", pct: Math.round((smart / total) * 100) },
      { feature: "Projector", pct: Math.round((projector / total) * 100) },
      { feature: "Internet", pct: Math.round((internet / total) * 100) },
      { feature: "AC", pct: Math.round((ac / total) * 100) },
      { feature: "Lab Equip", pct: Math.round((lab / total) * 100) },
      { feature: "Power Backup", pct: Math.round((power / total) * 100) },
      { feature: "Accessible", pct: Math.round((accessibility / total) * 100) },
      { feature: "Bookable", pct: Math.round((booking / total) * 100) },
    ];
  }, [rooms]);

  const totalCapacity = useMemo(() => rooms.reduce((sum, r) => sum + (r.seatingCapacity || 0), 0), [rooms]);
  const totalArea = useMemo(() => rooms.reduce((sum, r) => sum + (r.areaSqMeters || 0), 0), [rooms]);

  // Furniture & equipment totals — chairs/tables come from RoomResource data, not room fields
  const isType = (type: string, ...keywords: string[]) => {
    const t = type.toLowerCase();
    return keywords.some((k) => t.includes(k));
  };

  const totalChairs = useMemo(
    () => allResources.filter((r) => isType(r.type, "chair", "seat")).reduce((sum, r) => sum + r.quantity, 0),
    [allResources]
  );
  const totalTables = useMemo(
    () => allResources.filter((r) => isType(r.type, "table", "desk")).reduce((sum, r) => sum + r.quantity, 0),
    [allResources]
  );
  const totalWhiteboards = useMemo(
    () => allResources.filter((r) => isType(r.type, "whiteboard", "board")).reduce((sum, r) => sum + r.quantity, 0),
    [allResources]
  );
  const totalMonitors = useMemo(
    () => allResources.filter((r) => isType(r.type, "monitor", "screen", "display", "tv")).reduce((sum, r) => sum + r.quantity, 0),
    [allResources]
  );
  const totalProjectors = useMemo(() => rooms.filter((r) => r.projectorAvailable).length, [rooms]);
  const totalSmartBoards = useMemo(() => rooms.filter((r) => r.smartClassroomEnabled).length, [rooms]);
  const totalLabEquipped = useMemo(() => rooms.filter((r) => r.labEquipmentAvailable).length, [rooms]);
  const totalPowerBackup = useMemo(() => rooms.filter((r) => r.powerBackupAvailable).length, [rooms]);
  const totalInternet = useMemo(() => rooms.filter((r) => r.internetAvailable).length, [rooms]);
  const totalAC = useMemo(() => rooms.filter((r) => r.climateControl === "AC").length, [rooms]);

  const furnitureByBuilding = useMemo(() => {
    const map = new Map<string, { chairs: number; tables: number; whiteboards: number; monitors: number }>();
    // Init from buildings
    buildings.forEach((b) => map.set(b.name, { chairs: 0, tables: 0, whiteboards: 0, monitors: 0 }));
    // Aggregate from resources per room
    resourcesByRoom.forEach((rr) => {
      const bld = buildings.find((b) => b.id === rr.buildingId);
      const name = bld ? bld.name : `Building ${rr.buildingId}`;
      const prev = map.get(name) || { chairs: 0, tables: 0, whiteboards: 0, monitors: 0 };
      rr.resources.forEach((res) => {
        if (isType(res.type, "chair", "seat")) prev.chairs += res.quantity;
        else if (isType(res.type, "table", "desk")) prev.tables += res.quantity;
        else if (isType(res.type, "whiteboard", "board")) prev.whiteboards += res.quantity;
        else if (isType(res.type, "monitor", "screen", "display", "tv")) prev.monitors += res.quantity;
      });
      map.set(name, prev);
    });
    return Array.from(map, ([name, data]) => ({ name, ...data }))
      .filter((d) => d.chairs + d.tables + d.whiteboards + d.monitors > 0)
      .sort((a, b) => (b.chairs + b.tables) - (a.chairs + a.tables));
  }, [resourcesByRoom, buildings]);

  const equipmentSummary = useMemo(() => [
    { name: "Chairs", count: totalChairs, icon: Armchair, gradient: "gradient-primary" },
    { name: "Tables", count: totalTables, icon: DoorOpen, gradient: "gradient-info" },
    { name: "Whiteboards", count: totalWhiteboards, icon: Monitor, gradient: "gradient-success" },
    { name: "Monitors/Screens", count: totalMonitors, icon: Laptop, gradient: "gradient-warning" },
    { name: "Projector Rooms", count: totalProjectors, icon: Projector, gradient: "gradient-destructive" },
    { name: "Smart Classrooms", count: totalSmartBoards, icon: Monitor, gradient: "gradient-primary" },
    { name: "Lab Equipped", count: totalLabEquipped, icon: FlaskConical, gradient: "gradient-info" },
    { name: "Power Backup", count: totalPowerBackup, icon: Zap, gradient: "gradient-success" },
    { name: "Internet Rooms", count: totalInternet, icon: Wifi, gradient: "gradient-warning" },
    { name: "AC Rooms", count: totalAC, icon: Thermometer, gradient: "gradient-destructive" },
  ], [totalChairs, totalTables, totalWhiteboards, totalMonitors, totalProjectors, totalSmartBoards, totalLabEquipped, totalPowerBackup, totalInternet, totalAC]);

  const capacityByBuilding = useMemo(() => {
    const map = new Map<string, { capacity: number; area: number; rooms: number }>();
    rooms.forEach((r) => {
      const bld = buildings.find((b) => b.id === r.buildingId);
      const name = bld ? bld.name : `Building ${r.buildingId}`;
      const prev = map.get(name) || { capacity: 0, area: 0, rooms: 0 };
      map.set(name, {
        capacity: prev.capacity + (r.seatingCapacity || 0),
        area: prev.area + (r.areaSqMeters || 0),
        rooms: prev.rooms + 1,
      });
    });
    return Array.from(map, ([name, data]) => ({ name, ...data })).sort((a, b) => b.capacity - a.capacity);
  }, [rooms, buildings]);

  // Resources analytics
  const resourcesByType = useMemo(() => {
    const map = new Map<string, { count: number; totalQty: number }>();
    allResources.forEach((r) => {
      const prev = map.get(r.type) || { count: 0, totalQty: 0 };
      map.set(r.type, { count: prev.count + 1, totalQty: prev.totalQty + r.quantity });
    });
    return Array.from(map, ([name, data]) => ({ name, ...data })).sort((a, b) => b.totalQty - a.totalQty);
  }, [allResources]);

  const resourcesByBuilding = useMemo(() => {
    const map = new Map<string, number>();
    resourcesByRoom.forEach((rr) => {
      const bld = buildings.find((b) => b.id === rr.buildingId);
      const name = bld ? bld.name : `Building ${rr.buildingId}`;
      const totalQty = rr.resources.reduce((s, r) => s + r.quantity, 0);
      map.set(name, (map.get(name) || 0) + totalQty);
    });
    return Array.from(map, ([name, quantity]) => ({ name, quantity })).sort((a, b) => b.quantity - a.quantity);
  }, [resourcesByRoom, buildings]);

  const topResourcedRooms = useMemo(() => {
    return [...resourcesByRoom]
      .map((rr) => ({
        name: rr.roomName || rr.roomCode,
        totalQty: rr.resources.reduce((s, r) => s + r.quantity, 0),
        types: rr.resources.length,
      }))
      .sort((a, b) => b.totalQty - a.totalQty)
      .slice(0, 10);
  }, [resourcesByRoom]);

  /* ---------- Report Generation ---------- */

  const [reportMenuOpen, setReportMenuOpen] = useState(false);

  const generateBuildingsReport = (): string => {
    const headers = ["Name", "Code", "Campus", "Type", "Location", "Status", "Total Floors", "Rooms", "Seating Capacity", "Area (m²)", "Manager", "Year Established"];
    const rows = buildings.map((b) => {
      const bFloors = floors.filter((f) => f.buildingId === b.id).length;
      const bRooms = rooms.filter((r) => r.buildingId === b.id);
      const cap = bRooms.reduce((s, r) => s + (r.seatingCapacity || 0), 0);
      const area = bRooms.reduce((s, r) => s + (r.areaSqMeters || 0), 0);
      return [b.name, b.code, b.campus, b.type, b.location, b.status, bFloors, bRooms.length, cap, Math.round(area), b.manager, b.yearEstablished];
    });
    return toCsv(headers, rows);
  };

  const generateFloorsReport = (): string => {
    const headers = ["Floor Name", "Building", "Floor Number", "Accessibility", "Rooms", "Total Capacity", "Total Area (m²)"];
    const rows = floors.map((f) => {
      const bld = buildings.find((b) => b.id === f.buildingId);
      const floorRooms = rooms.filter((r) => r.floorId === f.id);
      const cap = floorRooms.reduce((s, r) => s + (r.seatingCapacity || 0), 0);
      const area = floorRooms.reduce((s, r) => s + (r.areaSqMeters || 0), 0);
      return [f.floorName, bld?.name || "", f.floorNumber, f.accessibility, floorRooms.length, cap, Math.round(area)];
    });
    return toCsv(headers, rows);
  };

  const generateRoomsReport = (): string => {
    const headers = [
      "Name", "Code", "Building", "Floor", "Type", "Status", "Condition",
      "Seating Capacity", "Area (m²)", "Climate Control", "Maintenance Status",
      "Smart Classroom", "Projector", "Internet", "Lab Equipment",
      "Power Backup", "Accessibility", "Bookable",
    ];
    const rows = rooms.map((r) => {
      const bld = buildings.find((b) => b.id === r.buildingId);
      const flr = floors.find((f) => f.id === r.floorId);
      return [
        r.name, r.code, bld?.name || "", flr?.floorName || "", r.type, r.status, r.condition,
        r.seatingCapacity, Math.round(r.areaSqMeters || 0), r.climateControl, r.maintenanceStatus,
        r.smartClassroomEnabled ? "Yes" : "No", r.projectorAvailable ? "Yes" : "No",
        r.internetAvailable ? "Yes" : "No", r.labEquipmentAvailable ? "Yes" : "No",
        r.powerBackupAvailable ? "Yes" : "No", r.accessibilitySupport ? "Yes" : "No",
        r.bookingAvailable ? "Yes" : "No",
      ];
    });
    return toCsv(headers, rows);
  };

  const generateResourcesReport = (): string => {
    const headers = ["Resource Name", "Type", "Quantity", "Room", "Room Code", "Building", "Floor"];
    const rows: (string | number)[][] = [];
    resourcesByRoom.forEach((rr) => {
      const bld = buildings.find((b) => b.id === rr.buildingId);
      const flr = floors.find((f) => f.id === rr.floorId);
      rr.resources.forEach((res) => {
        rows.push([res.name, res.type, res.quantity, rr.roomName, rr.roomCode, bld?.name || "", flr?.floorName || ""]);
      });
    });
    return toCsv(headers, rows);
  };

  const generateEquipmentReport = (): string => {
    const headers = ["Building", "Chairs", "Tables", "Whiteboards", "Monitors", "Projector Rooms", "Smart Classrooms", "Lab Rooms", "AC Rooms", "Internet Rooms", "Power Backup Rooms"];
    const rows = buildings.map((b) => {
      const bRooms = rooms.filter((r) => r.buildingId === b.id);
      const bResources = resourcesByRoom.filter((rr) => rr.buildingId === b.id);
      let chairs = 0, tables = 0, whiteboards = 0, monitors = 0;
      bResources.forEach((rr) => {
        rr.resources.forEach((res) => {
          const t = res.type.toLowerCase();
          if (t.includes("chair") || t.includes("seat")) chairs += res.quantity;
          else if (t.includes("table") || t.includes("desk")) tables += res.quantity;
          else if (t.includes("whiteboard") || t.includes("board")) whiteboards += res.quantity;
          else if (t.includes("monitor") || t.includes("screen") || t.includes("display") || t.includes("tv")) monitors += res.quantity;
        });
      });
      return [
        b.name, chairs, tables, whiteboards, monitors,
        bRooms.filter((r) => r.projectorAvailable).length,
        bRooms.filter((r) => r.smartClassroomEnabled).length,
        bRooms.filter((r) => r.labEquipmentAvailable).length,
        bRooms.filter((r) => r.climateControl === "AC").length,
        bRooms.filter((r) => r.internetAvailable).length,
        bRooms.filter((r) => r.powerBackupAvailable).length,
      ];
    });
    // Add totals row
    const totals = ["TOTAL"];
    for (let c = 1; c < headers.length; c++) {
      totals.push(String(rows.reduce((s, r) => s + Number(r[c]), 0)));
    }
    rows.push(totals);
    return toCsv(headers, rows);
  };

  const handleGenerateReport = (type: ReportType) => {
    setReportMenuOpen(false);
    const ts = generateTimestamp();

    if (type === "full") {
      const sections = [
        "=== ZENTARITAS RESOURCE ANALYTICS REPORT ===",
        `Generated: ${new Date().toLocaleString()}`,
        `Buildings: ${buildings.length} | Floors: ${floors.length} | Rooms: ${rooms.length} | Resources: ${allResources.length}`,
        "",
        "=== BUILDINGS ===",
        generateBuildingsReport(),
        "",
        "=== FLOORS ===",
        generateFloorsReport(),
        "",
        "=== ROOMS ===",
        generateRoomsReport(),
        "",
        "=== RESOURCES ===",
        generateResourcesReport(),
        "",
        "=== EQUIPMENT SUMMARY BY BUILDING ===",
        generateEquipmentReport(),
      ];
      downloadCsv(sections.join("\n"), `resource-analytics-full-report_${ts}.csv`);
      return;
    }

    const generators: Record<ReportType, { fn: () => string; name: string }> = {
      buildings: { fn: generateBuildingsReport, name: "buildings-report" },
      floors: { fn: generateFloorsReport, name: "floors-report" },
      rooms: { fn: generateRoomsReport, name: "rooms-report" },
      resources: { fn: generateResourcesReport, name: "resources-report" },
      equipment: { fn: generateEquipmentReport, name: "equipment-summary" },
      full: { fn: () => "", name: "" },
    };

    const gen = generators[type];
    downloadCsv(gen.fn(), `${gen.name}_${ts}.csv`);
  };

  /* ---------- Render ---------- */

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 animate-fade-in">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={36} className="animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading resource analytics…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Resource Analytics</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Comprehensive analytics across buildings, floors, rooms & resources
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchAll(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={cn(refreshing && "animate-spin")} />
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>

          {/* Generate Report Dropdown */}
          <div className="relative">
            <button
              onClick={() => setReportMenuOpen((v) => !v)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-md"
            >
              <Download size={14} />
              Generate Report
              <ChevronDown size={12} className={cn("transition-transform", reportMenuOpen && "rotate-180")} />
            </button>
            {reportMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setReportMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-2 w-80 z-50 bg-card rounded-2xl border border-border shadow-card-hover p-2 animate-fade-in">
                  <div className="px-3 py-2 mb-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Download Reports</p>
                  </div>
                  {reportOptions.map((opt) => {
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => handleGenerateReport(opt.id)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/60 transition-colors group text-left"
                      >
                        <div className={cn(
                          "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm transition-transform group-hover:scale-110",
                          opt.id === "full" ? "gradient-primary" : "bg-muted"
                        )}>
                          <Icon size={15} className={opt.id === "full" ? "text-white" : "text-muted-foreground group-hover:text-foreground"} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={cn("text-sm font-semibold", opt.id === "full" ? "text-primary" : "text-foreground")}>{opt.label}</p>
                          <p className="text-xs text-muted-foreground truncate">{opt.description}</p>
                        </div>
                        <FileText size={13} className="text-muted-foreground flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    );
                  })}
                  <div className="border-t border-border mt-1 pt-2 px-3 pb-1">
                    <p className="text-[10px] text-muted-foreground">Reports are exported as CSV files</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-xl border border-border overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                activeTab === tab.id
                  ? "bg-card text-foreground shadow-sm border border-border"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content by active tab */}
      {activeTab === "overview" && (
        <OverviewTab
          buildings={buildings}
          floors={floors}
          rooms={rooms}
          totalResourceQty={totalResourceQty}
          allResources={allResources}
          totalCapacity={totalCapacity}
          totalArea={totalArea}
          buildingStatusDist={buildingStatusDist}
          roomStatusDist={roomStatusDist}
          roomTypeDist={roomTypeDist}
          resourcesByType={resourcesByType}
          roomFacilitiesRadar={roomFacilitiesRadar}
          capacityByBuilding={capacityByBuilding}
          equipmentSummary={equipmentSummary}
          furnitureByBuilding={furnitureByBuilding}
        />
      )}
      {activeTab === "buildings" && (
        <BuildingsTab
          buildings={buildings}
          floors={floors}
          rooms={rooms}
          buildingStatusDist={buildingStatusDist}
          buildingsByType={buildingsByType}
          buildingsByCampus={buildingsByCampus}
          capacityByBuilding={capacityByBuilding}
          floorsPerBuilding={floorsPerBuilding}
        />
      )}
      {activeTab === "floors" && (
        <FloorsTab
          buildings={buildings}
          floors={floors}
          rooms={rooms}
          floorAccessibility={floorAccessibility}
          floorsPerBuilding={floorsPerBuilding}
        />
      )}
      {activeTab === "rooms" && (
        <RoomsTab
          rooms={rooms}
          buildings={buildings}
          roomStatusDist={roomStatusDist}
          roomTypeDist={roomTypeDist}
          roomConditionDist={roomConditionDist}
          roomMaintenanceDist={roomMaintenanceDist}
          roomFacilitiesRadar={roomFacilitiesRadar}
          capacityByBuilding={capacityByBuilding}
          totalCapacity={totalCapacity}
          totalArea={totalArea}
          equipmentSummary={equipmentSummary}
          furnitureByBuilding={furnitureByBuilding}
          totalChairs={totalChairs}
          totalTables={totalTables}
        />
      )}
      {activeTab === "resources" && (
        <ResourcesTab
          allResources={allResources}
          totalResourceQty={totalResourceQty}
          resourcesByType={resourcesByType}
          resourcesByBuilding={resourcesByBuilding}
          topResourcedRooms={topResourcedRooms}
          resourcesByRoom={resourcesByRoom}
          buildings={buildings}
        />
      )}
    </div>
  );
};

/* ================================================================== */
/*  OVERVIEW TAB                                                       */
/* ================================================================== */

const OverviewTab = ({
  buildings, floors, rooms, totalResourceQty, allResources,
  totalCapacity, totalArea, buildingStatusDist, roomStatusDist,
  roomTypeDist, resourcesByType, roomFacilitiesRadar, capacityByBuilding,
  equipmentSummary, furnitureByBuilding,
}: {
  buildings: Building[];
  floors: Floor[];
  rooms: Room[];
  totalResourceQty: number;
  allResources: RoomResource[];
  totalCapacity: number;
  totalArea: number;
  buildingStatusDist: { name: string; value: number }[];
  roomStatusDist: { name: string; value: number }[];
  roomTypeDist: { name: string; value: number }[];
  resourcesByType: { name: string; count: number; totalQty: number }[];
  roomFacilitiesRadar: { feature: string; pct: number }[];
  capacityByBuilding: { name: string; capacity: number; area: number; rooms: number }[];
  equipmentSummary: { name: string; count: number; icon: LucideIcon; gradient: string }[];
  furnitureByBuilding: { name: string; chairs: number; tables: number; whiteboards: number; monitors: number }[];
}) => (
  <div className="space-y-5">
    {/* KPI Cards */}
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
      <StatMini label="Buildings" value={buildings.length} icon={Building2} gradient="gradient-primary" sub={`${buildings.filter((b) => b.status === "Active").length} active`} />
      <StatMini label="Floors" value={floors.length} icon={Layers} gradient="gradient-info" sub={`Across ${buildings.length} buildings`} />
      <StatMini label="Rooms" value={rooms.length} icon={DoorOpen} gradient="gradient-success" sub={`${rooms.filter((r) => r.status === "Available").length} available`} />
      <StatMini label="Resources" value={totalResourceQty} icon={Armchair} gradient="gradient-warning" sub={`${allResources.length} unique items`} />
      <StatMini label="Total Capacity" value={totalCapacity.toLocaleString()} icon={TrendingUp} gradient="gradient-primary" sub="Seating capacity" />
      <StatMini label="Total Area" value={`${Math.round(totalArea).toLocaleString()} m²`} icon={Activity} gradient="gradient-info" />
    </div>

    {/* Furniture & Equipment Inventory */}
    <SectionCard title="Furniture & Equipment Inventory" subtitle="Total counts across all rooms" icon={Armchair}>
      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3">
        {equipmentSummary.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.name} className="relative overflow-hidden rounded-xl border border-border p-3 hover:shadow-card-hover transition-all duration-300 hover:-translate-y-0.5 group">
              <div className={cn("absolute top-0 right-0 w-16 h-16 rounded-full opacity-[0.07] -translate-y-4 translate-x-4", item.gradient)} />
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mb-2 shadow-sm", item.gradient)}>
                <Icon size={14} className="text-white" />
              </div>
              <p className="text-2xl font-bold text-foreground tabular-nums">{item.count.toLocaleString()}</p>
              <p className="text-[11px] text-muted-foreground font-medium mt-0.5">{item.name}</p>
            </div>
          );
        })}
      </div>
    </SectionCard>

    {/* Furniture by Building */}
    <SectionCard title="Chairs & Tables by Building" subtitle="Furniture distribution across buildings" icon={Building2}>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={furnitureByBuilding.slice(0, 10)} margin={{ top: 4, right: 12, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="4 4" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} angle={-20} textAnchor="end" height={55} />
          <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
          <Tooltip content={<ChartTooltip />} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
          <Bar dataKey="chairs" name="Chairs" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          <Bar dataKey="tables" name="Tables" fill="hsl(var(--info))" radius={[4, 4, 0, 0]} />
          <Bar dataKey="whiteboards" name="Whiteboards" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
          <Bar dataKey="monitors" name="Monitors" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </SectionCard>

    {/* Charts Row 1 */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <SectionCard title="Building Status" subtitle="Active vs inactive" icon={Building2} className="lg:col-span-1">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={buildingStatusDist} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
              {buildingStatusDist.map((_, i) => (
                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
          </PieChart>
        </ResponsiveContainer>
      </SectionCard>

      <SectionCard title="Room Type Distribution" subtitle="Breakdown by room category" icon={DoorOpen} className="lg:col-span-2">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={roomTypeDist.slice(0, 10)} margin={{ top: 4, right: 12, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="4 4" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} angle={-30} textAnchor="end" height={60} />
            <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTooltip />} />
            <Bar dataKey="value" name="Rooms" radius={[6, 6, 0, 0]}>
              {roomTypeDist.slice(0, 10).map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </SectionCard>
    </div>

    {/* Charts Row 2 */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <SectionCard title="Room Facilities Radar" subtitle="% of rooms with each feature" icon={PieChartIcon}>
        <ResponsiveContainer width="100%" height={280}>
          <RadarChart data={roomFacilitiesRadar} cx="50%" cy="50%" outerRadius="70%">
            <PolarGrid stroke="hsl(var(--border))" />
            <PolarAngleAxis dataKey="feature" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
            <Radar name="Coverage %" dataKey="pct" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.25} strokeWidth={2} />
            <Tooltip content={<ChartTooltip />} />
          </RadarChart>
        </ResponsiveContainer>
      </SectionCard>

      <SectionCard title="Capacity by Building" subtitle="Seating capacity & area per building" icon={Building2}>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={capacityByBuilding.slice(0, 8)} margin={{ top: 4, right: 12, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="4 4" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} angle={-20} textAnchor="end" height={55} />
            <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTooltip />} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
            <Bar dataKey="capacity" name="Capacity" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            <Bar dataKey="rooms" name="Rooms" fill="hsl(var(--info))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </SectionCard>
    </div>

    {/* Resource types */}
    <SectionCard title="Resource Distribution by Type" subtitle="Top resource categories" icon={Armchair}>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={resourcesByType.slice(0, 12)} margin={{ top: 4, right: 12, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="4 4" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} angle={-25} textAnchor="end" height={60} />
          <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
          <Tooltip content={<ChartTooltip />} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
          <Bar dataKey="totalQty" name="Total Quantity" fill="hsl(var(--success))" radius={[6, 6, 0, 0]} />
          <Bar dataKey="count" name="Distinct Items" fill="hsl(var(--info))" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </SectionCard>
  </div>
);

/* ================================================================== */
/*  BUILDINGS TAB                                                      */
/* ================================================================== */

const BuildingsTab = ({
  buildings, floors, rooms, buildingStatusDist, buildingsByType,
  buildingsByCampus, capacityByBuilding, floorsPerBuilding,
}: {
  buildings: Building[];
  floors: Floor[];
  rooms: Room[];
  buildingStatusDist: { name: string; value: number }[];
  buildingsByType: { name: string; value: number }[];
  buildingsByCampus: { name: string; value: number }[];
  capacityByBuilding: { name: string; capacity: number; area: number; rooms: number }[];
  floorsPerBuilding: { name: string; count: number }[];
}) => (
  <div className="space-y-5">
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <StatMini label="Total Buildings" value={buildings.length} icon={Building2} gradient="gradient-primary" />
      <StatMini label="Active" value={buildings.filter((b) => b.status === "Active").length} icon={CheckCircle2} gradient="gradient-success" />
      <StatMini label="Under Maintenance" value={buildings.filter((b) => b.status === "Under Maintenance").length} icon={Wrench} gradient="gradient-warning" />
      <StatMini label="Inactive" value={buildings.filter((b) => b.status === "Inactive").length} icon={XCircle} gradient="gradient-destructive" />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <SectionCard title="Status Distribution" icon={Building2}>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={buildingStatusDist} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={4}>
              {buildingStatusDist.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
          </PieChart>
        </ResponsiveContainer>
      </SectionCard>

      <SectionCard title="By Type" icon={Building2}>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={buildingsByType} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} paddingAngle={3}>
              {buildingsByType.map((_, i) => <Cell key={i} fill={PIE_COLORS[(i + 3) % PIE_COLORS.length]} />)}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
          </PieChart>
        </ResponsiveContainer>
      </SectionCard>

      <SectionCard title="By Campus" icon={Building2}>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={buildingsByCampus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} paddingAngle={3}>
              {buildingsByCampus.map((_, i) => <Cell key={i} fill={PIE_COLORS[(i + 6) % PIE_COLORS.length]} />)}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
          </PieChart>
        </ResponsiveContainer>
      </SectionCard>
    </div>

    <SectionCard title="Floors per Building" subtitle="Number of floors in each building" icon={Layers}>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={floorsPerBuilding} margin={{ top: 4, right: 12, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="4 4" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} angle={-20} textAnchor="end" height={55} />
          <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
          <Tooltip content={<ChartTooltip />} />
          <Bar dataKey="count" name="Floors" fill="hsl(var(--info))" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </SectionCard>

    {/* Detailed building table */}
    <SectionCard title="Building Details" subtitle="Full inventory of all buildings" icon={Building2}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Name</th>
              <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Code</th>
              <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Campus</th>
              <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Type</th>
              <th className="text-center py-2 px-3 text-xs font-semibold text-muted-foreground">Floors</th>
              <th className="text-center py-2 px-3 text-xs font-semibold text-muted-foreground">Rooms</th>
              <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Status</th>
              <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Manager</th>
            </tr>
          </thead>
          <tbody>
            {buildings.map((b) => {
              const bFloors = floors.filter((f) => f.buildingId === b.id).length;
              const bRooms = rooms.filter((r) => r.buildingId === b.id).length;
              return (
                <tr key={b.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="py-2.5 px-3 font-medium text-foreground">{b.name}</td>
                  <td className="py-2.5 px-3 text-muted-foreground">{b.code}</td>
                  <td className="py-2.5 px-3 text-muted-foreground">{b.campus}</td>
                  <td className="py-2.5 px-3 text-muted-foreground">{b.type}</td>
                  <td className="py-2.5 px-3 text-center tabular-nums">{bFloors}</td>
                  <td className="py-2.5 px-3 text-center tabular-nums">{bRooms}</td>
                  <td className="py-2.5 px-3"><Badge variant={statusVariant(b.status)}>{b.status}</Badge></td>
                  <td className="py-2.5 px-3 text-muted-foreground">{b.manager || "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {buildings.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">No buildings found</p>}
      </div>
    </SectionCard>
  </div>
);

/* ================================================================== */
/*  FLOORS TAB                                                         */
/* ================================================================== */

const FloorsTab = ({
  buildings, floors, rooms, floorAccessibility, floorsPerBuilding,
}: {
  buildings: Building[];
  floors: Floor[];
  rooms: Room[];
  floorAccessibility: { name: string; value: number }[];
  floorsPerBuilding: { name: string; count: number }[];
}) => {
  const roomsPerFloor = useMemo(() => {
    const map = new Map<string, { floorName: string; buildingName: string; count: number }>();
    floors.forEach((f) => {
      const bld = buildings.find((b) => b.id === f.buildingId);
      const floorRooms = rooms.filter((r) => r.floorId === f.id).length;
      map.set(f.id, {
        floorName: f.floorName,
        buildingName: bld?.name || `Building ${f.buildingId}`,
        count: floorRooms,
      });
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [floors, rooms, buildings]);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatMini label="Total Floors" value={floors.length} icon={Layers} gradient="gradient-info" />
        <StatMini label="Accessible" value={floors.filter((f) => f.accessibility === "Accessible").length} icon={Accessibility} gradient="gradient-success" />
        <StatMini label="Partial Access" value={floors.filter((f) => f.accessibility === "Partial").length} icon={AlertTriangle} gradient="gradient-warning" />
        <StatMini label="Not Accessible" value={floors.filter((f) => f.accessibility === "Not Accessible").length} icon={XCircle} gradient="gradient-destructive" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard title="Accessibility Distribution" icon={Accessibility}>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={floorAccessibility} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4}>
                {floorAccessibility.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
            </PieChart>
          </ResponsiveContainer>
        </SectionCard>

        <SectionCard title="Floors per Building" icon={Building2}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={floorsPerBuilding} margin={{ top: 4, right: 12, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="4 4" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} angle={-20} textAnchor="end" height={55} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="count" name="Floors" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>
      </div>

      {/* Detailed floor table */}
      <SectionCard title="Floor Details" subtitle="All floors with room counts" icon={Layers}>
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-card">
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Floor Name</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Building</th>
                <th className="text-center py-2 px-3 text-xs font-semibold text-muted-foreground">Floor #</th>
                <th className="text-center py-2 px-3 text-xs font-semibold text-muted-foreground">Rooms</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Accessibility</th>
              </tr>
            </thead>
            <tbody>
              {floors.map((f) => {
                const bld = buildings.find((b) => b.id === f.buildingId);
                const floorRooms = rooms.filter((r) => r.floorId === f.id).length;
                return (
                  <tr key={f.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-2.5 px-3 font-medium text-foreground">{f.floorName}</td>
                    <td className="py-2.5 px-3 text-muted-foreground">{bld?.name || "—"}</td>
                    <td className="py-2.5 px-3 text-center tabular-nums">{f.floorNumber}</td>
                    <td className="py-2.5 px-3 text-center tabular-nums">{floorRooms}</td>
                    <td className="py-2.5 px-3"><Badge variant={statusVariant(f.accessibility)}>{f.accessibility}</Badge></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {floors.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">No floors found</p>}
        </div>
      </SectionCard>
    </div>
  );
};

/* ================================================================== */
/*  ROOMS TAB                                                          */
/* ================================================================== */

const RoomsTab = ({
  rooms, buildings, roomStatusDist, roomTypeDist, roomConditionDist,
  roomMaintenanceDist, roomFacilitiesRadar, capacityByBuilding, totalCapacity, totalArea,
  equipmentSummary, furnitureByBuilding, totalChairs, totalTables,
}: {
  rooms: Room[];
  buildings: Building[];
  roomStatusDist: { name: string; value: number }[];
  roomTypeDist: { name: string; value: number }[];
  roomConditionDist: { name: string; value: number }[];
  roomMaintenanceDist: { name: string; value: number }[];
  roomFacilitiesRadar: { feature: string; pct: number }[];
  capacityByBuilding: { name: string; capacity: number; area: number; rooms: number }[];
  totalCapacity: number;
  totalArea: number;
  equipmentSummary: { name: string; count: number; icon: LucideIcon; gradient: string }[];
  furnitureByBuilding: { name: string; chairs: number; tables: number; whiteboards: number; monitors: number }[];
  totalChairs: number;
  totalTables: number;
}) => (
  <div className="space-y-5">
    <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3">
      <StatMini label="Total Rooms" value={rooms.length} icon={DoorOpen} gradient="gradient-primary" />
      <StatMini label="Available" value={rooms.filter((r) => r.status === "Available").length} icon={CheckCircle2} gradient="gradient-success" />
      <StatMini label="Occupied" value={rooms.filter((r) => r.status === "Occupied").length} icon={Activity} gradient="gradient-info" />
      <StatMini label="Under Maint." value={rooms.filter((r) => r.status === "Under Maintenance").length} icon={Wrench} gradient="gradient-warning" />
      <StatMini label="Total Chairs" value={totalChairs.toLocaleString()} icon={Armchair} gradient="gradient-primary" />
      <StatMini label="Total Tables" value={totalTables.toLocaleString()} icon={DoorOpen} gradient="gradient-info" />
      <StatMini label="Total Capacity" value={totalCapacity.toLocaleString()} icon={TrendingUp} gradient="gradient-success" />
      <StatMini label="Total Area" value={`${Math.round(totalArea).toLocaleString()} m²`} icon={Activity} gradient="gradient-warning" />
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <SectionCard title="Status" icon={DoorOpen}>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie data={roomStatusDist} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3}>
              {roomStatusDist.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
            <Legend iconType="circle" iconSize={6} wrapperStyle={{ fontSize: "10px" }} />
          </PieChart>
        </ResponsiveContainer>
      </SectionCard>

      <SectionCard title="Condition" icon={AlertTriangle}>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie data={roomConditionDist} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3}>
              {roomConditionDist.map((_, i) => <Cell key={i} fill={PIE_COLORS[(i + 4) % PIE_COLORS.length]} />)}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
            <Legend iconType="circle" iconSize={6} wrapperStyle={{ fontSize: "10px" }} />
          </PieChart>
        </ResponsiveContainer>
      </SectionCard>

      <SectionCard title="Maintenance" icon={Wrench}>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie data={roomMaintenanceDist} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3}>
              {roomMaintenanceDist.map((_, i) => <Cell key={i} fill={PIE_COLORS[(i + 8) % PIE_COLORS.length]} />)}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
            <Legend iconType="circle" iconSize={6} wrapperStyle={{ fontSize: "10px" }} />
          </PieChart>
        </ResponsiveContainer>
      </SectionCard>

      <SectionCard title="Facilities Radar" icon={Monitor}>
        <ResponsiveContainer width="100%" height={200}>
          <RadarChart data={roomFacilitiesRadar} cx="50%" cy="50%" outerRadius="65%">
            <PolarGrid stroke="hsl(var(--border))" />
            <PolarAngleAxis dataKey="feature" tick={{ fontSize: 8, fill: "hsl(var(--muted-foreground))" }} />
            <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
            <Radar dataKey="pct" fill="hsl(var(--primary))" fillOpacity={0.3} stroke="hsl(var(--primary))" strokeWidth={2} />
          </RadarChart>
        </ResponsiveContainer>
      </SectionCard>
    </div>

    <SectionCard title="Room Types Breakdown" subtitle="Number of rooms by type" icon={DoorOpen}>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={roomTypeDist} margin={{ top: 4, right: 12, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="4 4" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} angle={-30} textAnchor="end" height={70} />
          <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
          <Tooltip content={<ChartTooltip />} />
          <Bar dataKey="value" name="Rooms" radius={[6, 6, 0, 0]}>
            {roomTypeDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </SectionCard>

    <SectionCard title="Capacity & Area by Building" icon={Building2}>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={capacityByBuilding.slice(0, 10)} margin={{ top: 4, right: 12, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="4 4" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} angle={-20} textAnchor="end" height={55} />
          <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
          <Tooltip content={<ChartTooltip />} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
          <Bar dataKey="capacity" name="Seating Capacity" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          <Bar dataKey="area" name="Area (m²)" fill="hsl(var(--info))" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </SectionCard>

    {/* Furniture & Equipment Inventory */}
    <SectionCard title="Furniture & Equipment Inventory" subtitle="Chair, table, and equipment counts across all rooms" icon={Armchair}>
      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3">
        {equipmentSummary.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.name} className="relative overflow-hidden rounded-xl border border-border p-3 hover:shadow-card-hover transition-all duration-300 hover:-translate-y-0.5 group">
              <div className={cn("absolute top-0 right-0 w-16 h-16 rounded-full opacity-[0.07] -translate-y-4 translate-x-4", item.gradient)} />
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mb-2 shadow-sm", item.gradient)}>
                <Icon size={14} className="text-white" />
              </div>
              <p className="text-2xl font-bold text-foreground tabular-nums">{item.count.toLocaleString()}</p>
              <p className="text-[11px] text-muted-foreground font-medium mt-0.5">{item.name}</p>
            </div>
          );
        })}
      </div>
    </SectionCard>

    {/* Chairs & Tables by Building */}
    <SectionCard title="Chairs & Tables by Building" subtitle="Furniture distribution per building" icon={Building2}>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={furnitureByBuilding.slice(0, 10)} margin={{ top: 4, right: 12, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="4 4" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} angle={-20} textAnchor="end" height={55} />
          <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
          <Tooltip content={<ChartTooltip />} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
          <Bar dataKey="chairs" name="Chairs" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          <Bar dataKey="tables" name="Tables" fill="hsl(var(--info))" radius={[4, 4, 0, 0]} />
          <Bar dataKey="whiteboards" name="Whiteboards" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
          <Bar dataKey="monitors" name="Monitors" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </SectionCard>

    {/* Facilities breakdown table */}
    <SectionCard title="Room Facilities Summary" subtitle="Quick feature availability snapshot" icon={Monitor}>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {roomFacilitiesRadar.map((item) => (
          <div key={item.feature} className="rounded-xl border border-border p-3">
            <p className="text-xs text-muted-foreground">{item.feature}</p>
            <p className="text-lg font-bold text-foreground mt-1">{item.pct}%</p>
            <div className="w-full h-1.5 rounded-full bg-muted mt-2">
              <div className="h-1.5 rounded-full bg-primary transition-all" style={{ width: `${item.pct}%` }} />
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  </div>
);

/* ================================================================== */
/*  RESOURCES TAB                                                      */
/* ================================================================== */

const ResourcesTab = ({
  allResources, totalResourceQty, resourcesByType,
  resourcesByBuilding, topResourcedRooms, resourcesByRoom, buildings,
}: {
  allResources: RoomResource[];
  totalResourceQty: number;
  resourcesByType: { name: string; count: number; totalQty: number }[];
  resourcesByBuilding: { name: string; quantity: number }[];
  topResourcedRooms: { name: string; totalQty: number; types: number }[];
  resourcesByRoom: ResourcesByRoom[];
  buildings: Building[];
}) => {
  const roomsWithResources = resourcesByRoom.filter((r) => r.resources.length > 0).length;
  const roomsWithoutResources = resourcesByRoom.length - roomsWithResources;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatMini label="Total Quantity" value={totalResourceQty} icon={Armchair} gradient="gradient-primary" />
        <StatMini label="Unique Items" value={allResources.length} icon={Activity} gradient="gradient-info" />
        <StatMini label="Resource Types" value={resourcesByType.length} icon={BarChart3} gradient="gradient-success" />
        <StatMini label="Rooms w/ Resources" value={roomsWithResources} icon={DoorOpen} gradient="gradient-warning" sub={`${roomsWithoutResources} without`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard title="Resources by Type" subtitle="Total quantity per category" icon={Armchair}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={resourcesByType.slice(0, 10)} layout="vertical" margin={{ top: 4, right: 12, left: 4, bottom: 0 }}>
              <CartesianGrid strokeDasharray="4 4" stroke="hsl(var(--border))" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={90} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="totalQty" name="Quantity" radius={[0, 6, 6, 0]}>
                {resourcesByType.slice(0, 10).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>

        <SectionCard title="Resources by Building" subtitle="Total quantity per building" icon={Building2}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={resourcesByBuilding.slice(0, 10)} margin={{ top: 4, right: 12, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="4 4" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} angle={-20} textAnchor="end" height={55} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="quantity" name="Resources" fill="hsl(var(--success))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>
      </div>

      <SectionCard title="Top Resourced Rooms" subtitle="Rooms with the most resources" icon={DoorOpen}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={topResourcedRooms} margin={{ top: 4, right: 12, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="4 4" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} angle={-25} textAnchor="end" height={65} />
            <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTooltip />} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
            <Bar dataKey="totalQty" name="Total Quantity" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            <Bar dataKey="types" name="Resource Types" fill="hsl(var(--warning))" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </SectionCard>

      {/* Resource type distribution pie */}
      <SectionCard title="Resource Type Proportions" subtitle="Overall distribution of resource quantities" icon={PieChartIcon}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-center">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={resourcesByType.slice(0, 8)} dataKey="totalQty" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={3}>
                {resourcesByType.slice(0, 8).map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2">
            {resourcesByType.map((rt, i) => (
              <div key={rt.name} className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-foreground truncate">{rt.name}</p>
                    <p className="text-xs tabular-nums text-muted-foreground ml-2">{rt.totalQty}</p>
                  </div>
                  <div className="w-full h-1 rounded-full bg-muted mt-1">
                    <div
                      className="h-1 rounded-full transition-all"
                      style={{
                        width: `${totalResourceQty > 0 ? (rt.totalQty / totalResourceQty) * 100 : 0}%`,
                        backgroundColor: PIE_COLORS[i % PIE_COLORS.length],
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </SectionCard>
    </div>
  );
};
