import {
  Users, Calendar, Star, Trophy, FileImage, AlertTriangle,
  TrendingUp, TrendingDown, Activity, Bell, Clock, CheckCircle2,
  type LucideIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { mockStats } from "@/data/mockData";
import { ChartsSection } from "./ChartsSection";
import { QuickActions } from "./QuickActions";

const iconMap: Record<string, LucideIcon> = {
  Users, Calendar, Star, Trophy, FileImage, AlertTriangle,
};

const gradientMap: Record<string, string> = {
  "gradient-primary": "from-primary to-primary-light",
  "gradient-red": "from-accent-red to-red-400",
  "gradient-info": "from-info to-blue-400",
  "gradient-success": "from-success to-emerald-400",
  "gradient-warning": "from-warning to-amber-400",
};

const recentActivity = [
  { id: 1, action: "New student registered", user: "Marcus Lee", time: "2 min ago", type: "success" },
  { id: 2, action: "Booking conflict detected", user: "Hall A – Friday", time: "15 min ago", type: "warning" },
  { id: 3, action: "Event published", user: "Annual Sports Day", time: "1 hr ago", type: "info" },
  { id: 4, action: "User account blocked", user: "David Lee", time: "3 hr ago", type: "error" },
  { id: 5, action: "Report generated", user: "Q1 Analytics", time: "5 hr ago", type: "success" },
  { id: 6, action: "Tournament created", user: "Football League 2025", time: "Yesterday", type: "info" },
];

const activityDot: Record<string, string> = {
  success: "bg-success",
  warning: "bg-warning",
  info: "bg-info",
  error: "bg-destructive",
};

const upcomingEvents = [
  { title: "Annual Sports Day", date: "Feb 25", venue: "Main Ground", attendees: 320 },
  { title: "Media Showcase", date: "Mar 02", venue: "Auditorium B", attendees: 180 },
  { title: "Admin Orientation", date: "Mar 08", venue: "Conference Room 1", attendees: 45 },
];

export const DashboardOverview = () => {
  return (
    <div className="space-y-5 animate-fade-in">
      {/* Welcome banner */}
      <div className="gradient-hero rounded-2xl p-5 md:p-7 text-white relative overflow-hidden shadow-card">
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/5" />
        <div className="absolute -bottom-16 right-8 w-64 h-64 rounded-full bg-white/5" />
        <div className="absolute top-6 right-28 w-24 h-24 rounded-full bg-accent-red/15" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-white/60 text-sm font-medium mb-1">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            </p>
            <h1 className="text-2xl md:text-3xl font-bold mb-1.5">Welcome to Zentaritas Admin 👋</h1>
            <p className="text-white/70 text-sm md:text-base max-w-lg">
              Manage your entire university platform from here. You have <span className="text-white font-semibold">3 alerts</span>, <span className="text-white font-semibold">7 pending approvals</span>, and <span className="text-white font-semibold">28 upcoming events</span>.
            </p>
          </div>
          <div className="flex gap-3 flex-shrink-0">
            {[
              { label: "Online Now", value: "142", icon: Activity },
              { label: "New Today", value: "38", icon: Users },
              { label: "Pending", value: "7", icon: Clock },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="bg-white/10 rounded-xl px-4 py-3 backdrop-blur-sm text-center min-w-[72px] border border-white/10">
                <Icon size={14} className="text-white/60 mx-auto mb-1" />
                <p className="text-white font-bold text-xl leading-none">{value}</p>
                <p className="text-white/60 text-[10px] mt-1 whitespace-nowrap">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {mockStats.map((stat, i) => {
          const Icon = iconMap[stat.icon];
          const isPos = stat.growth >= 0;
          return (
            <div
              key={stat.id}
              className="bg-card rounded-2xl p-4 shadow-card hover:shadow-card-hover border border-border transition-all duration-300 hover:-translate-y-1 cursor-pointer group"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3 shadow-md transition-transform duration-300 group-hover:scale-110", stat.gradient)}>
                {Icon && <Icon size={18} className="text-white" />}
              </div>
              <p className="text-xs text-muted-foreground font-medium leading-tight mb-1">{stat.title}</p>
              <p className="text-2xl font-bold text-foreground tabular-nums">{stat.value.toLocaleString()}</p>
              <div className={cn("flex items-center gap-1 mt-1.5 text-[11px] font-semibold", isPos ? "text-success" : "text-destructive")}>
                {isPos ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                {isPos ? "+" : ""}{stat.growth}%
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts + sidebar panels */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Charts take 2 cols */}
        <div className="xl:col-span-2 space-y-4">
          <ChartsSection />
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Upcoming Events */}
          <div className="bg-card rounded-2xl p-5 border border-border shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground text-sm">Upcoming Events</h3>
              <button className="text-xs text-primary font-medium hover:underline">View all</button>
            </div>
            <div className="space-y-3">
              {upcomingEvents.map((e, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/60 transition-colors">
                  <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0 text-white text-[10px] font-bold text-center leading-tight">
                    {e.date.split(" ")[0]}<br />{e.date.split(" ")[1]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{e.title}</p>
                    <p className="text-xs text-muted-foreground">{e.venue}</p>
                  </div>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                    {e.attendees}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-card rounded-2xl p-5 border border-border shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground text-sm">Recent Activity</h3>
              <Bell size={14} className="text-muted-foreground" />
            </div>
            <div className="space-y-3">
              {recentActivity.map((a) => (
                <div key={a.id} className="flex items-start gap-3">
                  <div className={cn("w-2 h-2 rounded-full mt-1.5 flex-shrink-0", activityDot[a.type])} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground">{a.action}</p>
                    <p className="text-xs text-muted-foreground truncate">{a.user}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">{a.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <QuickActions />
        </div>
      </div>
    </div>
  );
};
