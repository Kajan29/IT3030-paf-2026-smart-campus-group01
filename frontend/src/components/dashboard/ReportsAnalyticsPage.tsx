import { Download, FileText, TrendingUp, Users, CalendarDays, AlertTriangle } from "lucide-react";

const reportCards = [
  { label: "Building Utilization", value: "82%", delta: "+4.2%", tone: "text-success", icon: Users },
  { label: "Room Occupancy", value: "76%", delta: "+2.1%", tone: "text-info", icon: CalendarDays },
  { label: "Booking Completion", value: "91%", delta: "+5.0%", tone: "text-primary", icon: TrendingUp },
  { label: "Maintenance Alerts", value: "9", delta: "-2.0%", tone: "text-destructive", icon: AlertTriangle },
];

const topReports = [
  { name: "Building Capacity by Campus", updated: "2 hours ago", format: "PDF" },
  { name: "Room Booking Heatmap", updated: "Today", format: "CSV" },
  { name: "Floor Accessibility Compliance", updated: "Yesterday", format: "XLSX" },
  { name: "Maintenance Backlog by Building", updated: "2 days ago", format: "PDF" },
];

const compliance = [
  { metric: "Building safety checklist completion", value: 93 },
  { metric: "Accessibility standards compliance", value: 89 },
  { metric: "Room metadata completeness", value: 96 },
  { metric: "Booking approval SLA", value: 84 },
];

export const ReportsAnalyticsPage = () => (
  <div className="space-y-5 animate-fade-in">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Reports & Analytics</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Track building, floor, and room operations with compliance insights</p>
      </div>
      <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-md">
        <Download size={16} /> Export Monthly Pack
      </button>
    </div>

    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {reportCards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.label} className="bg-card rounded-xl p-4 border border-border shadow-card">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{card.label}</p>
              <Icon size={14} className="text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold mt-1 text-foreground">{card.value}</p>
            <p className={`text-xs font-semibold mt-1 ${card.tone}`}>{card.delta} vs last month</p>
          </div>
        );
      })}
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 bg-card rounded-2xl border border-border shadow-card">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Top Reports</h3>
          <button className="text-xs text-primary font-medium hover:underline">Open report center</button>
        </div>
        <div className="divide-y divide-border">
          {topReports.map((report) => (
            <div key={report.name} className="flex items-center justify-between gap-3 p-4 hover:bg-muted/20 transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl gradient-info text-white flex items-center justify-center flex-shrink-0">
                  <FileText size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{report.name}</p>
                  <p className="text-xs text-muted-foreground">Updated {report.updated}</p>
                </div>
              </div>
              <button className="px-3 py-1.5 text-xs rounded-lg border border-border hover:bg-muted transition-colors">
                Download {report.format}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-card p-5">
        <h3 className="font-semibold text-foreground mb-4">Operational Compliance</h3>
        <div className="space-y-4">
          {compliance.map((item) => (
            <div key={item.metric}>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs text-muted-foreground">{item.metric}</p>
                <p className="text-xs font-semibold text-foreground">{item.value}%</p>
              </div>
              <div className="w-full h-2 rounded-full bg-muted">
                <div className="h-2 rounded-full gradient-success" style={{ width: `${item.value}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);
