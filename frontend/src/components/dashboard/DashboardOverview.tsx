import {
  Building2,
  Users,
  DoorOpen,
  BookOpen,
  TrendingUp,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

const statsData = [
  {
    title: "Total Buildings",
    value: "6",
    change: "+1",
    changeType: "increase" as const,
    icon: Building2,
    color: "primary",
    description: "University buildings",
  },
  {
    title: "Total Rooms",
    value: "284",
    change: "+12",
    changeType: "increase" as const,
    icon: DoorOpen,
    color: "success",
    description: "Across all buildings",
  },
  {
    title: "Active Users",
    value: "1,247",
    change: "+89",
    changeType: "increase" as const,
    icon: Users,
    color: "info",
    description: "Students & Staff",
  },
  {
    title: "Today's Bookings",
    value: "156",
    change: "-8",
    changeType: "decrease" as const,
    icon: BookOpen,
    color: "warning",
    description: "Room reservations",
  },
];

const buildingSummary = [
  { name: "Main Academic Block", code: "MAB", rooms: 75, occupancy: "91%", status: "Active" },
  { name: "Science & Technology Center", code: "STC", rooms: 52, occupancy: "92%", status: "Active" },
  { name: "Engineering Complex", code: "ENG", rooms: 84, occupancy: "90%", status: "Active" },
  { name: "Library & Learning Center", code: "LIB", rooms: 28, occupancy: "93%", status: "Active" },
  { name: "Administrative Building", code: "ADM", rooms: 45, occupancy: "93%", status: "Active" },
];

const recentActivities = [
  { action: "New room added", details: "Computer Lab 3 - Engineering Complex", time: "2 mins ago", type: "add" },
  { action: "Building updated", details: "Main Academic Block - Floor plan modified", time: "15 mins ago", type: "update" },
  { action: "Maintenance scheduled", details: "Multi-Purpose Hall A", time: "1 hour ago", type: "maintenance" },
  { action: "Room booking", details: "Einstein Lecture Hall - CS101 Class", time: "2 hours ago", type: "booking" },
  { action: "New user registered", details: "Dr. Sarah Johnson - Faculty", time: "3 hours ago", type: "user" },
];

const roomTypeDistribution = [
  { type: "Lecture Hall", count: 45, color: "bg-blue-500" },
  { type: "Laboratory", count: 38, color: "bg-purple-500" },
  { type: "Office", count: 56, color: "bg-sky-500" },
  { type: "Staff Room", count: 24, color: "bg-pink-500" },
  { type: "Computer Lab", count: 22, color: "bg-violet-500" },
  { type: "Conference Room", count: 18, color: "bg-orange-500" },
  { type: "Others", count: 81, color: "bg-gray-500" },
];

export const DashboardOverview = () => {
  const totalRoomTypes = roomTypeDistribution.reduce((sum, r) => sum + r.count, 0);

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
                <div
                  className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                    stat.changeType === "increase"
                      ? "bg-success/10 text-success"
                      : "bg-destructive/10 text-destructive"
                  }`}
                >
                  {stat.changeType === "increase" ? (
                    <ArrowUpRight size={12} />
                  ) : (
                    <ArrowDownRight size={12} />
                  )}
                  {stat.change}
                </div>
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
            <button className="text-sm text-primary hover:underline flex items-center gap-1">
              View All <ArrowUpRight size={14} />
            </button>
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
                {buildingSummary.map((building) => (
                  <tr key={building.code} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
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
                        <span className="text-sm text-foreground">{building.occupancy}</span>
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
            <button className="text-sm text-primary hover:underline">View All</button>
          </div>
          <div className="space-y-3">
            {recentActivities.map((activity, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted/30 transition-colors"
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    activity.type === "add"
                      ? "bg-success/10"
                      : activity.type === "update"
                      ? "bg-info/10"
                      : activity.type === "maintenance"
                      ? "bg-warning/10"
                      : activity.type === "booking"
                      ? "bg-primary/10"
                      : "bg-purple-500/10"
                  }`}
                >
                  {activity.type === "add" ? (
                    <CheckCircle2 size={16} className="text-success" />
                  ) : activity.type === "maintenance" ? (
                    <AlertTriangle size={16} className="text-warning" />
                  ) : activity.type === "booking" ? (
                    <BookOpen size={16} className="text-primary" />
                  ) : activity.type === "user" ? (
                    <Users size={16} className="text-purple-500" />
                  ) : (
                    <TrendingUp size={16} className="text-info" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm">{activity.action}</p>
                  <p className="text-xs text-muted-foreground truncate">{activity.details}</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                  <Clock size={12} />
                  {activity.time}
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
              <p className="text-2xl font-bold text-foreground">6</p>
              <p className="text-xs text-muted-foreground">5 Active, 1 Under Construction</p>
            </div>
            <div className="p-4 rounded-xl bg-muted/30 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <DoorOpen size={18} className="text-success" />
                <span className="text-sm font-medium text-foreground">Available Rooms</span>
              </div>
              <p className="text-2xl font-bold text-foreground">127</p>
              <p className="text-xs text-muted-foreground">Ready for booking</p>
            </div>
            <div className="p-4 rounded-xl bg-muted/30 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Users size={18} className="text-info" />
                <span className="text-sm font-medium text-foreground">Total Users</span>
              </div>
              <p className="text-2xl font-bold text-foreground">3,456</p>
              <p className="text-xs text-muted-foreground">Students, Staff, Faculty</p>
            </div>
            <div className="p-4 rounded-xl bg-muted/30 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={18} className="text-warning" />
                <span className="text-sm font-medium text-foreground">Maintenance</span>
              </div>
              <p className="text-2xl font-bold text-foreground">8</p>
              <p className="text-xs text-muted-foreground">Rooms under maintenance</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
