import { Trophy, Plus, Search, Users, Calendar, ChevronRight } from "lucide-react";

const teams = [
  { name: "Football Team A", sport: "Football", members: 22, coach: "Mr. Harris", status: "Active", wins: 8, losses: 2 },
  { name: "Basketball Squad", sport: "Basketball", members: 15, coach: "Ms. Parker", status: "Active", wins: 6, losses: 4 },
  { name: "Swimming Club", sport: "Swimming", members: 18, coach: "Mr. Chen", status: "Active", wins: 5, losses: 1 },
  { name: "Cricket Team", sport: "Cricket", members: 16, coach: "Mr. Singh", status: "Inactive", wins: 3, losses: 6 },
];

const tournaments = [
  { name: "Inter-Faculty Football Cup", sport: "Football", date: "Mar 10", teams: 8, status: "Registration Open" },
  { name: "Annual Swimming Meet", sport: "Swimming", date: "Mar 20", teams: 12, status: "Upcoming" },
  { name: "Basketball League 2025", sport: "Basketball", date: "Apr 05", teams: 6, status: "Planning" },
];

export const SportsManagementPage = () => (
  <div className="space-y-5 animate-fade-in">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Sports Management</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage teams, tournaments and registrations</p>
      </div>
      <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-md">
        <Plus size={16} /> Create Tournament
      </button>
    </div>

    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[
        { label: "Total Teams", value: 12, color: "text-primary" },
        { label: "Active Players", value: 284, color: "text-success" },
        { label: "Tournaments", value: 3, color: "text-info" },
        { label: "Registrations", value: 1204, color: "text-accent-red" },
      ].map(s => (
        <div key={s.label} className="bg-card rounded-xl p-4 border border-border shadow-card">
          <p className="text-xs text-muted-foreground">{s.label}</p>
          <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value.toLocaleString()}</p>
        </div>
      ))}
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="bg-card rounded-2xl border border-border shadow-card">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="font-semibold text-foreground">Teams</h3>
          <button className="text-xs text-primary font-medium">+ Add Team</button>
        </div>
        <div className="divide-y divide-border">
          {teams.map((t, i) => (
            <div key={i} className="flex items-center gap-4 p-4 hover:bg-muted/20 transition-colors">
              <div className="w-10 h-10 rounded-xl gradient-success flex items-center justify-center text-white flex-shrink-0">
                <Trophy size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.coach} · {t.members} members</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs font-semibold text-success">{t.wins}W <span className="text-destructive">{t.losses}L</span></p>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${t.status === "Active" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>{t.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-card">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="font-semibold text-foreground">Upcoming Tournaments</h3>
          <button className="text-xs text-primary font-medium">View All</button>
        </div>
        <div className="divide-y divide-border">
          {tournaments.map((t, i) => (
            <div key={i} className="flex items-center gap-4 p-4 hover:bg-muted/20 transition-colors">
              <div className="w-10 h-10 rounded-xl gradient-warning flex items-center justify-center text-white flex-shrink-0">
                <Calendar size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.date} · {t.teams} teams</p>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                t.status === "Registration Open" ? "bg-success/10 text-success border border-success/20" :
                t.status === "Upcoming" ? "bg-info/10 text-info border border-info/20" :
                "bg-muted text-muted-foreground border border-border"
              }`}>{t.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);
