import { CheckCircle2, XCircle, Clock, User, Calendar } from "lucide-react";

const bookings = [
  { id: "BK001", venue: "Sports Hall A", user: "Alice Johnson", date: "Apr 11", time: "10:00-12:00", status: "Confirmed", purpose: "Football Training" },
  { id: "BK002", venue: "Conference Room 1", user: "Dr. Smith", date: "Apr 12", time: "2:00-4:00", status: "Pending", purpose: "Faculty Meeting" },
  { id: "BK003", venue: "Auditorium B", user: "Media Club", date: "Apr 12", time: "9:00-5:00", status: "Confirmed", purpose: "Media Showcase Setup" },
  { id: "BK004", venue: "Lab 3B", user: "Prof. Chen", date: "Apr 13", time: "8:00-10:00", status: "Cancelled", purpose: "Lab Session" },
  { id: "BK005", venue: "Swimming Pool", user: "Swimming Club", date: "Apr 14", time: "6:00-8:00", status: "Confirmed", purpose: "Practice Session" },
];

const statusStyle: Record<string, { className: string; icon: React.ElementType }> = {
  Confirmed: { className: "bg-success/10 text-success border-success/20", icon: CheckCircle2 },
  Pending: { className: "bg-warning/10 text-warning-foreground border-warning/20", icon: Clock },
  Cancelled: { className: "bg-destructive/10 text-destructive border-destructive/20", icon: XCircle },
};

export const BookingsPage = () => (
  <div className="space-y-5 animate-fade-in">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Bookings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage all venue and facility bookings</p>
      </div>
    </div>

    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[
        { label: "Total Bookings", value: 418, color: "text-primary" },
        { label: "Confirmed", value: 333, color: "text-success" },
        { label: "Pending", value: 63, color: "text-warning" },
        { label: "Cancelled", value: 22, color: "text-destructive" },
      ].map((s) => (
        <div key={s.label} className="bg-card rounded-xl p-4 border border-border shadow-card">
          <p className="text-xs text-muted-foreground">{s.label}</p>
          <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
        </div>
      ))}
    </div>

    <div className="bg-card rounded-2xl border border-border shadow-card">
      <div className="p-5 border-b border-border">
        <h3 className="font-semibold text-foreground">Recent Bookings</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-muted/30">
              {["ID", "Venue", "Booked By", "Date & Time", "Purpose", "Status", "Actions"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider first:pl-5">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {bookings.map((booking) => {
              const { className, icon: Icon } = statusStyle[booking.status];
              return (
                <tr key={booking.id} className="hover:bg-muted/20 transition-colors">
                  <td className="pl-5 pr-4 py-3.5 text-xs text-muted-foreground font-mono">{booking.id}</td>
                  <td className="px-4 py-3.5">
                    <p className="text-sm font-medium text-foreground">{booking.venue}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5 text-sm text-foreground">
                      <User size={12} className="text-muted-foreground" />
                      {booking.user}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-sm text-muted-foreground whitespace-nowrap">
                    <div className="flex items-center gap-1"><Calendar size={11} />{booking.date}</div>
                    <div className="flex items-center gap-1 mt-0.5 text-xs"><Clock size={11} />{booking.time}</div>
                  </td>
                  <td className="px-4 py-3.5 text-sm text-muted-foreground">{booking.purpose}</td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg border ${className}`}>
                      <Icon size={11} />{booking.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex gap-1.5">
                      {booking.status === "Pending" && (
                        <>
                          <button className="px-2 py-1 rounded-lg bg-success/10 hover:bg-success text-success hover:text-white text-xs transition-all">Approve</button>
                          <button className="px-2 py-1 rounded-lg bg-destructive/10 hover:bg-destructive text-destructive hover:text-white text-xs transition-all">Reject</button>
                        </>
                      )}
                      {booking.status !== "Pending" && (
                        <button className="px-2 py-1 rounded-lg bg-muted text-muted-foreground text-xs hover:bg-muted/80 transition-all">View</button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);
