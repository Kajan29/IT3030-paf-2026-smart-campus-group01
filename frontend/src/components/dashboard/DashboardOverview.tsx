import {
  Users, Calendar, Trophy, FileImage, AlertTriangle, Activity, Clock, ArrowRight, CheckCircle2
} from "lucide-react";
import { mockStats } from "@/data/mockData";
import { ChartsSection } from "./ChartsSection";
import { QuickActions } from "./QuickActions";
import { cn } from "@/lib/utils";

const iconMap: Record<string, React.ElementType> = {
  Users,
  Calendar,
  Trophy,
  FileImage,
  AlertTriangle,
};

const focusItems = [
  "Approve pending faculty event proposals",
  "Resolve 2 venue overlap conflicts",
  "Finalize week-3 media publishing plan",
];

const scheduleItems = [
  { time: "09:00", title: "Dean coordination briefing", place: "Admin Board Room" },
  { time: "11:30", title: "Sports committee sync", place: "Ground Office" },
  { time: "14:00", title: "Infrastructure update review", place: "Ops Center" },
  { time: "16:30", title: "Student services check-in", place: "Conference Room 1" },
];

export const DashboardOverview = () => {
  return (
    <div className="space-y-5 animate-fade-in">
      <section className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        <div className="xl:col-span-3 rounded-3xl p-6 md:p-7 bg-card text-foreground shadow-elevated border border-border/70 relative overflow-hidden">

          <div className="relative z-10">
            <p className="text-muted-foreground text-xs uppercase tracking-[0.18em]">
              University Operations Dashboard
            </p>
            <h1 className="text-3xl md:text-4xl font-bold mt-2">Campus Control Hub</h1>
            <p className="max-w-xl text-sm md:text-base text-muted-foreground mt-2">
              Centralized monitoring for students, facilities, events, and departments with real-time operational visibility.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity">
                Generate Daily Brief
              </button>
              <button className="px-4 py-2 rounded-xl bg-transparent border border-border text-foreground text-sm font-semibold hover:bg-muted/70 transition-colors">
                View Pending Tasks
              </button>
            </div>
          </div>
        </div>

        <div className="xl:col-span-2 glass-card rounded-3xl p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Today Priority Queue</h3>
            <span className="text-xs text-muted-foreground">{new Date().toLocaleDateString()}</span>
          </div>
          <div className="mt-4 space-y-2.5">
            {focusItems.map((item) => (
              <div key={item} className="flex items-start gap-2.5 rounded-xl bg-muted/40 px-3 py-2.5">
                <CheckCircle2 size={15} className="text-success mt-0.5" />
                <p className="text-sm text-foreground">{item}</p>
              </div>
            ))}
          </div>
          <button className="mt-4 w-full rounded-xl border border-border px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted transition-colors flex items-center justify-center gap-1.5">
            Open Workflow Board <ArrowRight size={14} />
          </button>
        </div>
      </section>

      <section className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {mockStats.map((stat) => {
          const Icon = iconMap[stat.icon] || Activity;
          return (
            <article key={stat.id} className="glass-card rounded-2xl p-4 hover:-translate-y-0.5 transition-transform">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">{stat.title}</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{stat.value.toLocaleString()}</p>
                </div>
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center text-white", stat.gradient)}>
                  <Icon size={16} />
                </div>
              </div>
              <p className={cn("text-xs mt-2 font-semibold", stat.growth >= 0 ? "text-success" : "text-destructive")}>
                {stat.growth >= 0 ? "+" : ""}{stat.growth}% vs last month
              </p>
            </article>
          );
        })}
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2">
          <ChartsSection />
        </div>

        <div className="space-y-4">
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Operations Schedule</h3>
              <Clock size={14} className="text-muted-foreground" />
            </div>
            <div className="space-y-3">
              {scheduleItems.map((item) => (
                <div key={`${item.time}-${item.title}`} className="rounded-xl border border-border/70 bg-muted/30 px-3 py-2.5">
                  <p className="text-xs font-semibold text-primary">{item.time}</p>
                  <p className="text-sm font-semibold text-foreground mt-0.5">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.place}</p>
                </div>
              ))}
            </div>
          </div>

          <QuickActions />
        </div>
      </section>
    </div>
  );
};
