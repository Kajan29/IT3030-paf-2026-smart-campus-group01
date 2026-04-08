import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCheck, ClipboardList, Loader2, UserPlus } from "lucide-react";
import { toast } from "react-toastify";
import ticketService, {
  type AssignableStaff,
  type TicketResponse,
  type TicketStatus,
} from "@/services/ticketService";

const statusOptions: Array<{ value: TicketStatus | "ALL"; label: string }> = [
  { value: "ALL", label: "All Tickets" },
  { value: "OPEN", label: "Open" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "RESOLVED", label: "Resolved" },
];

const statusClass: Record<TicketStatus, string> = {
  OPEN: "bg-warning/15 text-warning-foreground border-warning/30",
  IN_PROGRESS: "bg-info/15 text-info border-info/30",
  RESOLVED: "bg-success/10 text-success border-success/30",
};

const pretty = (value?: string) => {
  if (!value) return "-";
  return value.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (ch) => ch.toUpperCase());
};

export const TicketManagementPage = () => {
  const [tickets, setTickets] = useState<TicketResponse[]>([]);
  const [staff, setStaff] = useState<AssignableStaff[]>([]);
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "ALL">("ALL");
  const [loading, setLoading] = useState(true);
  const [savingTicketId, setSavingTicketId] = useState<number | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ticketRes, staffRes] = await Promise.all([
        ticketService.getAllAdminTickets(statusFilter === "ALL" ? undefined : statusFilter),
        ticketService.getAssignableStaff(),
      ]);
      setTickets(ticketRes.data.data || []);
      setStaff(staffRes.data.data || []);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const stats = useMemo(() => {
    return {
      total: tickets.length,
      open: tickets.filter((t) => t.status === "OPEN").length,
      progress: tickets.filter((t) => t.status === "IN_PROGRESS").length,
      resolved: tickets.filter((t) => t.status === "RESOLVED").length,
    };
  }, [tickets]);

  const handleAssign = async (ticketId: number, staffIdValue: string) => {
    const staffId = Number(staffIdValue);
    if (!staffId) return;
    setSavingTicketId(ticketId);
    try {
      await ticketService.assignTicket(ticketId, staffId);
      toast.success("Ticket assigned");
      await loadData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to assign ticket");
    } finally {
      setSavingTicketId(null);
    }
  };

  const handleResolve = async (ticketId: number) => {
    const note = window.prompt("Add an optional resolution note:") || undefined;
    setSavingTicketId(ticketId);
    try {
      await ticketService.resolveTicketByAdmin(ticketId, note);
      toast.success("Ticket marked as resolved");
      await loadData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to resolve ticket");
    } finally {
      setSavingTicketId(null);
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total", value: stats.total, icon: ClipboardList },
          { label: "Open", value: stats.open, icon: AlertCircle },
          { label: "In Progress", value: stats.progress, icon: Loader2 },
          { label: "Resolved", value: stats.resolved, icon: CheckCheck },
        ].map((item) => (
          <div key={item.label} className="glass-card rounded-xl border border-border p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{item.label}</p>
              <item.icon size={16} className="text-primary" />
            </div>
            <p className="text-2xl font-bold text-foreground mt-2">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="glass-card rounded-2xl border border-border p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">University Ticket Operations</h2>
            <p className="text-sm text-muted-foreground">Assign tickets to non-academic staff and close resolved cases.</p>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as TicketStatus | "ALL")}
            className="px-3 py-2 rounded-lg border border-border bg-muted/40 text-sm"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px]">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-2 text-xs uppercase tracking-wide text-muted-foreground">Ticket</th>
                <th className="text-left py-3 px-2 text-xs uppercase tracking-wide text-muted-foreground">Requester</th>
                <th className="text-left py-3 px-2 text-xs uppercase tracking-wide text-muted-foreground">Audience</th>
                <th className="text-left py-3 px-2 text-xs uppercase tracking-wide text-muted-foreground">Category</th>
                <th className="text-left py-3 px-2 text-xs uppercase tracking-wide text-muted-foreground">Status</th>
                <th className="text-left py-3 px-2 text-xs uppercase tracking-wide text-muted-foreground">Assigned Staff</th>
                <th className="text-left py-3 px-2 text-xs uppercase tracking-wide text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="py-8 text-center text-muted-foreground" colSpan={7}>Loading tickets...</td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td className="py-8 text-center text-muted-foreground" colSpan={7}>No tickets found for this filter.</td>
                </tr>
              ) : (
                tickets.map((ticket) => (
                  <tr key={ticket.id} className="border-b border-border/50 hover:bg-muted/25 transition-colors">
                    <td className="py-3 px-2">
                      <p className="font-semibold text-foreground text-sm">{ticket.subject}</p>
                      <p className="text-xs text-muted-foreground font-mono">{ticket.ticketNumber}</p>
                    </td>
                    <td className="py-3 px-2 text-sm">
                      <p className="text-foreground">{ticket.requesterName}</p>
                      <p className="text-muted-foreground text-xs">{ticket.requesterEmail}</p>
                    </td>
                    <td className="py-3 px-2 text-sm text-foreground">{pretty(ticket.audience)}</td>
                    <td className="py-3 px-2 text-sm text-foreground">{pretty(ticket.category)}</td>
                    <td className="py-3 px-2">
                      <span className={`px-2 py-1 text-xs rounded-full border ${statusClass[ticket.status]}`}>
                        {pretty(ticket.status)}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-sm">
                      {ticket.assignedStaffName ? (
                        <div>
                          <p className="text-foreground">{ticket.assignedStaffName}</p>
                          <p className="text-xs text-muted-foreground">{ticket.assignedStaffEmail}</p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <select
                          defaultValue=""
                          disabled={savingTicketId === ticket.id || ticket.status === "RESOLVED"}
                          onChange={(e) => handleAssign(ticket.id, e.target.value)}
                          className="px-2 py-1.5 rounded-md border border-border bg-muted/50 text-xs"
                        >
                          <option value="">Assign to...</option>
                          {staff.map((member) => (
                            <option key={member.id} value={member.id}>
                                {`${member.firstName || ""} ${member.lastName || ""}`.trim() || member.email}
                            </option>
                          ))}
                        </select>
                        <button
                          disabled={savingTicketId === ticket.id || ticket.status === "RESOLVED"}
                          onClick={() => handleResolve(ticket.id)}
                          className="inline-flex items-center gap-1 px-2 py-1.5 text-xs rounded-md bg-success/10 text-success border border-success/30 hover:bg-success/20 disabled:opacity-50"
                        >
                          <UserPlus size={12} />
                          Resolve
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
