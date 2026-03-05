import { Plus, Calendar, MapPin, Users, Clock } from "lucide-react";

const events = [
  { title: "Annual Sports Day", date: "Feb 25, 2025", time: "9:00 AM", venue: "Main Ground", attendees: 320, maxAttendees: 500, status: "Open", type: "Sports" },
  { title: "Media Showcase 2025", date: "Mar 2, 2025", time: "2:00 PM", venue: "Auditorium B", attendees: 180, maxAttendees: 250, status: "Open", type: "Media" },
  { title: "Admin Orientation", date: "Mar 8, 2025", time: "10:00 AM", venue: "Conference Room 1", attendees: 45, maxAttendees: 60, status: "Closed", type: "Admin" },
  { title: "Science Fair Exhibition", date: "Mar 15, 2025", time: "8:00 AM", venue: "Science Block", attendees: 200, maxAttendees: 400, status: "Open", type: "Academic" },
  { title: "Cultural Night", date: "Mar 22, 2025", time: "6:00 PM", venue: "Main Auditorium", attendees: 0, maxAttendees: 800, status: "Planning", type: "Cultural" },
];

const typeColor: Record<string, string> = {
  Sports: "bg-success/10 text-success border-success/20",
  Media: "bg-info/10 text-info border-info/20",
  Admin: "bg-primary/10 text-primary border-primary/20",
  Academic: "bg-warning/10 text-warning-foreground border-warning/20",
  Cultural: "bg-accent-red/10 text-accent-red border-accent-red/20",
};

export const EventManagementPage = () => (
  <div className="space-y-5 animate-fade-in">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Event Management</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Create and manage all university events</p>
      </div>
      <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-warning text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-md">
        <Plus size={16} /> Create Event
      </button>
    </div>

    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[
        { label: "Total Events", value: 28, color: "text-primary" },
        { label: "Registration Open", value: 18, color: "text-success" },
        { label: "Upcoming This Week", value: 4, color: "text-info" },
        { label: "Total Attendees", value: "2.4K", color: "text-accent-red" },
      ].map(s => (
        <div key={s.label} className="bg-card rounded-xl p-4 border border-border shadow-card">
          <p className="text-xs text-muted-foreground">{s.label}</p>
          <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
        </div>
      ))}
    </div>

    <div className="bg-card rounded-2xl border border-border shadow-card">
      <div className="p-5 border-b border-border">
        <h3 className="font-semibold text-foreground">All Events</h3>
      </div>
      <div className="divide-y divide-border">
        {events.map((e, i) => (
          <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 hover:bg-muted/20 transition-colors">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center text-white flex-shrink-0">
              <Calendar size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-semibold text-foreground">{e.title}</p>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${typeColor[e.type]}`}>{e.type}</span>
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1"><Clock size={10} />{e.date} · {e.time}</span>
                <span className="flex items-center gap-1"><MapPin size={10} />{e.venue}</span>
                <span className="flex items-center gap-1"><Users size={10} />{e.attendees}/{e.maxAttendees}</span>
              </div>
              {/* Capacity bar */}
              <div className="mt-2 w-full max-w-xs bg-muted rounded-full h-1.5">
                <div
                  className="h-1.5 rounded-full gradient-primary"
                  style={{ width: `${Math.min(100, (e.attendees / e.maxAttendees) * 100)}%` }}
                />
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`text-[10px] px-2.5 py-1 rounded-lg font-semibold border ${
                e.status === "Open" ? "bg-success/10 text-success border-success/20" :
                e.status === "Closed" ? "bg-destructive/10 text-destructive border-destructive/20" :
                "bg-muted text-muted-foreground border-border"
              }`}>{e.status}</span>
              <button className="text-xs text-primary font-medium hover:underline">Manage</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);
