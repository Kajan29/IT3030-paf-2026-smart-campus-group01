import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  Users,
  DoorOpen,
  BookOpen,
  Calendar,
  Clock,
  CheckCircle2,
  Loader2,
  Bell,
  Ticket,
} from "lucide-react";
import facilityService from "@/services/facilityService";
import adminUserService, { type UserResponse } from "@/services/admin/adminUserService";
import bookingService from "@/services/bookingService";
import ticketService, { type TicketResponse } from "@/services/ticketService";
import notificationService from "@/services/notificationService";
import type { Building, Room } from "@/types/campusManagement";

type DashboardBooking = {
  id: number;
  status?: string;
  purpose?: string;
  createdAt?: string;
  startTime?: string;
  room?: {
    name?: string;
    code?: string;
  };
};

type ActivityType = "booking" | "ticket" | "user";

type ActivityItem = {
  id: string;
  action: string;
  details: string;
  timestamp: number;
  type: ActivityType;
};

const colorPalette = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-violet-500",
  "bg-amber-500",
  "bg-pink-500",
  "bg-cyan-500",
  "bg-orange-500",
  "bg-gray-500",
];

const normalizeStatus = (value?: string) => (value || "").trim().toLowerCase();

const toTimestamp = (value?: string) => {
  if (!value) return 0;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
};

const isSameDay = (value?: string) => {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
};

const timeAgo = (timestamp: number) => {
  if (!timestamp) return "Unknown";

  const diffMinutes = Math.max(1, Math.floor((Date.now() - timestamp) / 60000));
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

const getBuildingOccupancy = (rooms: Room[]) => {
  if (rooms.length === 0) return 0;

  const busyCount = rooms.filter((room) => {
    const status = normalizeStatus(room.status);
    return status === "occupied" || status === "under maintenance";
  }).length;

  return Math.round((busyCount / rooms.length) * 100);
};

const parseBookingsResponse = (payload: any): DashboardBooking[] => {
  if (Array.isArray(payload)) {
    return payload as DashboardBooking[];
  }
  if (Array.isArray(payload?.content)) {
    return payload.content as DashboardBooking[];
  }
  if (Array.isArray(payload?.data)) {
    return payload.data as DashboardBooking[];
  }
  return [];
};

export const DashboardOverview = () => {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [bookings, setBookings] = useState<DashboardBooking[]>([]);
  const [tickets, setTickets] = useState<TicketResponse[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadDashboardData = async () => {
      setLoading(true);
      setError(null);

      const [facilityResult, usersResult, bookingsResult, ticketsResult, notificationsResult] =
        await Promise.allSettled([
          facilityService.getFacilitySnapshot(),
          adminUserService.getAllUsers(),
          bookingService.getAllBookings(),
          ticketService.getAllAdminTickets(),
          notificationService.getUnreadCount(),
        ]);

      if (!mounted) return;

      let hasAtLeastOneSuccess = false;

      if (facilityResult.status === "fulfilled") {
        hasAtLeastOneSuccess = true;
        setBuildings(facilityResult.value.buildings || []);
        setRooms(facilityResult.value.rooms || []);
      }

      if (usersResult.status === "fulfilled") {
        hasAtLeastOneSuccess = true;
        setUsers(usersResult.value.data?.data || []);
      }

      if (bookingsResult.status === "fulfilled") {
        hasAtLeastOneSuccess = true;
        setBookings(parseBookingsResponse(bookingsResult.value));
      }

      if (ticketsResult.status === "fulfilled") {
        hasAtLeastOneSuccess = true;
        setTickets(ticketsResult.value.data?.data || []);
      }

      if (notificationsResult.status === "fulfilled") {
        hasAtLeastOneSuccess = true;
        setUnreadNotifications(Number(notificationsResult.value || 0));
      }

      if (!hasAtLeastOneSuccess) {
        setError("Unable to load live dashboard data. Check backend connection.");
      }

      setLoading(false);
    };

    void loadDashboardData();

    return () => {
      mounted = false;
    };
  }, []);

  const activeUsers = useMemo(
    () => users.filter((user) => user.isActive).length,
    [users]
  );

  const todayBookings = useMemo(
    () => bookings.filter((booking) => isSameDay(booking.startTime || booking.createdAt)).length,
    [bookings]
  );

  const availableRooms = useMemo(
    () =>
      rooms.filter((room) => {
        const status = normalizeStatus(room.status);
        return status === "available";
      }).length,
    [rooms]
  );

  const pendingBookings = useMemo(
    () => bookings.filter((booking) => normalizeStatus(booking.status) === "pending").length,
    [bookings]
  );

  const openTickets = useMemo(
    () =>
      tickets.filter((ticket) => {
        const status = normalizeStatus(ticket.status);
        return status === "open" || status === "in_progress";
      }).length,
    [tickets]
  );

  const buildingSummary = useMemo(() => {
    return buildings
      .map((building) => {
        const buildingRooms = rooms.filter((room) => room.buildingId === building.id);
        const occupancy = getBuildingOccupancy(buildingRooms);
        return {
          id: building.id,
          name: building.name,
          code: building.code,
          rooms: buildingRooms.length,
          occupancy,
          status: building.status,
        };
      })
      .sort((a, b) => b.rooms - a.rooms)
      .slice(0, 6);
  }, [buildings, rooms]);

  const roomTypeDistribution = useMemo(() => {
    const buckets = new Map<string, number>();
    rooms.forEach((room) => {
      const key = room.type || "Other";
      buckets.set(key, (buckets.get(key) || 0) + 1);
    });

    return Array.from(buckets.entries())
      .map(([type, count], index) => ({
        type,
        count,
        color: colorPalette[index % colorPalette.length],
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [rooms]);

  const totalRoomTypes = useMemo(
    () => roomTypeDistribution.reduce((sum, item) => sum + item.count, 0),
    [roomTypeDistribution]
  );

  const recentActivities = useMemo(() => {
    const bookingActivities: ActivityItem[] = bookings
      .filter((booking) => toTimestamp(booking.createdAt) > 0)
      .map((booking) => ({
        id: `booking-${booking.id}`,
        action: "New booking request",
        details: `${booking.room?.code || "Room"} ${booking.room?.name || ""}`.trim(),
        timestamp: toTimestamp(booking.createdAt),
        type: "booking",
      }));

    const ticketActivities: ActivityItem[] = tickets
      .filter((ticket) => toTimestamp(ticket.createdAt) > 0)
      .map((ticket) => ({
        id: `ticket-${ticket.id}`,
        action: "New support ticket",
        details: `${ticket.ticketNumber} - ${ticket.subject}`,
        timestamp: toTimestamp(ticket.createdAt),
        type: "ticket",
      }));

    const userActivities: ActivityItem[] = users
      .filter((user) => toTimestamp(user.createdAt) > 0)
      .map((user) => ({
        id: `user-${user.id}`,
        action: "User registered",
        details: `${user.firstName} ${user.lastName} (${user.role})`,
        timestamp: toTimestamp(user.createdAt),
        type: "user",
      }));

    return [...bookingActivities, ...ticketActivities, ...userActivities]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 6);
  }, [bookings, tickets, users]);

  const statsData = [
    {
      title: "Total Buildings",
      value: buildings.length,
      icon: Building2,
      color: "primary",
      description: "Live facilities count",
    },
    {
      title: "Total Rooms",
      value: rooms.length,
      icon: DoorOpen,
      color: "success",
      description: "Across all buildings",
    },
    {
      title: "Active Users",
      value: activeUsers,
      icon: Users,
      color: "info",
      description: "Students, staff, and admins",
    },
    {
      title: "Today's Bookings",
      value: todayBookings,
      icon: BookOpen,
      color: "warning",
      description: "Based on booking start date",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Section */}
      <div className="glass-card rounded-2xl p-6 border border-border bg-gradient-to-r from-primary/5 to-primary/10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Welcome to Zentaritas Admin</h1>
            <p className="text-muted-foreground mt-1">
              University Operations Management Dashboard
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar size={16} />
            <span>{new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsData.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className="glass-card rounded-2xl p-5 border border-border hover:shadow-xl transition-all hover:border-primary/30"
            >
              <div className="flex items-start justify-between">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    stat.color === "primary"
                      ? "bg-primary/10"
                      : stat.color === "success"
                      ? "bg-success/10"
                      : stat.color === "info"
                      ? "bg-info/10"
                      : "bg-warning/10"
                  }`}
                >
                  <Icon
                    className={
                      stat.color === "primary"
                        ? "text-primary"
                        : stat.color === "success"
                        ? "text-success"
                        : stat.color === "info"
                        ? "text-info"
                        : "text-warning"
                    }
                    size={24}
                  />
                </div>
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                  Live
                </span>
              </div>
              <div className="mt-4">
                <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm font-medium text-foreground mt-1">{stat.title}</p>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Building Summary */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-6 border border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Building Summary</h2>
            <span className="text-xs text-muted-foreground">Live</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Building</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Code</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Rooms</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Occupancy</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {buildingSummary.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                      No building data available.
                    </td>
                  </tr>
                )}

                {buildingSummary.map((building) => (
                  <tr key={building.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Building2 size={16} className="text-primary" />
                        </div>
                        <span className="font-medium text-foreground text-sm">{building.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <span className="px-2 py-1 rounded-md bg-muted text-xs font-medium text-muted-foreground">
                        {building.code}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-sm text-foreground">{building.rooms}</td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-success rounded-full"
                            style={{ width: building.occupancy }}
                          />
                        </div>
                        <span className="text-sm text-foreground">{building.occupancy}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <span className="px-2 py-1 rounded-full bg-success/10 text-success text-xs font-medium">
                        {building.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Room Type Distribution */}
        <div className="glass-card rounded-2xl p-6 border border-border">
          <h2 className="text-lg font-semibold text-foreground mb-4">Room Types</h2>
          <div className="space-y-3">
            {roomTypeDistribution.length === 0 && !loading && (
              <p className="text-sm text-muted-foreground">No room type data available.</p>
            )}

            {roomTypeDistribution.map((room) => (
              <div key={room.type}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-muted-foreground">{room.type}</span>
                  <span className="font-medium text-foreground">{room.count}</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full ${room.color} rounded-full transition-all`}
                    style={{ width: `${(room.count / totalRoomTypes) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Rooms</span>
              <span className="text-lg font-bold text-foreground">{totalRoomTypes}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="glass-card rounded-2xl p-6 border border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Recent Activity</h2>
            <span className="text-xs text-muted-foreground">Latest records</span>
          </div>
          <div className="space-y-3">
            {recentActivities.length === 0 && !loading && (
              <p className="text-sm text-muted-foreground">No recent activity data available.</p>
            )}

            {recentActivities.map((activity, index) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted/30 transition-colors"
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    activity.type === "booking"
                      ? "bg-primary/10"
                      : activity.type === "ticket"
                      ? "bg-warning/10"
                      : "bg-success/10"
                  }`}
                >
                  {activity.type === "booking" ? (
                    <BookOpen size={16} className="text-primary" />
                  ) : activity.type === "ticket" ? (
                    <Ticket size={16} className="text-warning" />
                  ) : (
                    <CheckCircle2 size={16} className="text-success" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm">{activity.action}</p>
                  <p className="text-xs text-muted-foreground truncate">{activity.details}</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                  <Clock size={12} />
                  {timeAgo(activity.timestamp)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="glass-card rounded-2xl p-6 border border-border">
          <h2 className="text-lg font-semibold text-foreground mb-4">System Overview</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-muted/30 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Building2 size={18} className="text-primary" />
                <span className="text-sm font-medium text-foreground">Buildings</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{buildings.length}</p>
              <p className="text-xs text-muted-foreground">Database records</p>
            </div>
            <div className="p-4 rounded-xl bg-muted/30 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <DoorOpen size={18} className="text-success" />
                <span className="text-sm font-medium text-foreground">Available Rooms</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{availableRooms}</p>
              <p className="text-xs text-muted-foreground">Rooms currently marked available</p>
            </div>
            <div className="p-4 rounded-xl bg-muted/30 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Ticket size={18} className="text-info" />
                <span className="text-sm font-medium text-foreground">Open Tickets</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{openTickets}</p>
              <p className="text-xs text-muted-foreground">Open and in-progress tickets</p>
            </div>
            <div className="p-4 rounded-xl bg-muted/30 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Bell size={18} className="text-warning" />
                <span className="text-sm font-medium text-foreground">Pending Alerts</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{unreadNotifications + pendingBookings}</p>
              <p className="text-xs text-muted-foreground">
                {unreadNotifications} unread notifications, {pendingBookings} pending bookings
              </p>
            </div>
          </div>
        </div>
      </div>

      {loading && (
        <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading live dashboard data...
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}
    </div>
  );
};
