import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRightLeft,
  CheckCheck,
  ClipboardList,
  Filter,
  Loader2,
  RefreshCcw,
  Search,
  ShieldCheck,
} from "lucide-react";
import { toast } from "react-toastify";
import ticketService, {
  type AssignableStaff,
  type TicketAudience,
  type TicketCategory,
  type TicketResponse,
  type TicketStatus,
} from "@/services/ticketService";

const statusOptions: Array<{ value: TicketStatus | "ALL"; label: string }> = [
  { value: "ALL", label: "All Tickets" },
  { value: "OPEN", label: "Open" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "CLOSED", label: "Closed" },
  { value: "REJECTED", label: "Rejected" },
];

const audienceOptions: Array<{ value: TicketAudience | "ALL"; label: string }> = [
  { value: "ALL", label: "All Audiences" },
  { value: "STUDENT", label: "Student Support" },
  { value: "STAFF", label: "Staff Support" },
];

const categoryOptions: Array<{ value: TicketCategory | "ALL"; label: string }> = [
  { value: "ALL", label: "All Categories" },
  { value: "IT_SUPPORT", label: "IT Support" },
  { value: "FACILITIES", label: "Facilities" },
  { value: "ACADEMIC", label: "Academic" },
  { value: "ROOM_BOOKING", label: "Room Booking" },
  { value: "GENERAL_INQUIRY", label: "General Inquiry" },
];

const statusClass: Record<TicketStatus, string> = {
  OPEN: "bg-primary/10 text-primary border-primary/30",
  IN_PROGRESS: "bg-warning/15 text-warning-foreground border-warning/30",
  RESOLVED: "bg-success/10 text-success border-success/30",
  CLOSED: "bg-muted text-foreground border-border",
  REJECTED: "bg-destructive/10 text-destructive border-destructive/30",
};

const pretty = (value?: string) => {
  if (!value) return "-";
  return value.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (ch) => ch.toUpperCase());
};

const formatDateTime = (value?: string) => {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
};

export const TicketManagementPage = () => {
  const [activeAdminAction, setActiveAdminAction] = useState<"TRANSFER" | "RESOLVE" | "REJECT" | null>(null);
  const [tickets, setTickets] = useState<TicketResponse[]>([]);
  const [staff, setStaff] = useState<AssignableStaff[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [filters, setFilters] = useState<{
    search: string;
    status: TicketStatus | "ALL";
    audience: TicketAudience | "ALL";
    category: TicketCategory | "ALL";
  }>({
    search: "",
    status: "ALL",
    audience: "ALL",
    category: "ALL",
  });
  const [actionForm, setActionForm] = useState<{ assignedStaffId: string; resolutionNote: string; rejectionReason: string }>({
    assignedStaffId: "",
    resolutionNote: "",
    rejectionReason: "",
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [workingTicketId, setWorkingTicketId] = useState<number | null>(null);

  const loadData = async (showPrimaryLoader = true) => {
    if (showPrimaryLoader) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      const [ticketRes, staffRes] = await Promise.all([
        ticketService.getAllAdminTickets(),
        ticketService.getAssignableStaff(),
      ]);

      setTickets(ticketRes.data.data || []);
      setStaff(staffRes.data.data || []);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to load tickets");
    } finally {
      if (showPrimaryLoader) {
        setLoading(false);
      } else {
        setRefreshing(false);
      }
    }
  };

  const filteredTickets = useMemo(() => {
    const query = filters.search.trim().toLowerCase();

    return tickets.filter((ticket) => {
      const matchesStatus = filters.status === "ALL" || ticket.status === filters.status;
      const matchesAudience = filters.audience === "ALL" || ticket.audience === filters.audience;
      const matchesCategory = filters.category === "ALL" || ticket.category === filters.category;

      if (!query) {
        return matchesStatus && matchesAudience && matchesCategory;
      }

      const searchable = [
        ticket.ticketNumber,
        ticket.subject,
        ticket.requesterName,
        ticket.requesterEmail,
        ticket.assignedStaffName,
        ticket.assignedStaffEmail,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesStatus && matchesAudience && matchesCategory && searchable.includes(query);
    });
  }, [filters.audience, filters.category, filters.search, filters.status, tickets]);

  const selectedTicket = useMemo(
    () => filteredTickets.find((ticket) => ticket.id === selectedId) ?? null,
    [filteredTickets, selectedId]
  );

  const isTransferredToStaff = Boolean(selectedTicket?.assignedStaffId);
  const isTicketFinalized =
    selectedTicket?.status === "RESOLVED" ||
    selectedTicket?.status === "CLOSED" ||
    selectedTicket?.status === "REJECTED";

  const flowStages = useMemo(() => {
    if (!selectedTicket) {
      return [];
    }

    return [
      {
        key: "submitted",
        title: "Submitted",
        happenedAt: selectedTicket.createdAt,
        detail: `${selectedTicket.requesterName} (${selectedTicket.requesterEmail})`,
        complete: true,
      },
      {
        key: "assigned",
        title: "Transferred To Staff",
        happenedAt: selectedTicket.assignedAt,
        detail: selectedTicket.assignedStaffName
          ? `${selectedTicket.assignedStaffName}${selectedTicket.assignedStaffEmail ? ` (${selectedTicket.assignedStaffEmail})` : ""}`
          : "Pending assignment",
        complete: Boolean(selectedTicket.assignedStaffId),
      },
      {
        key: "resolved",
        title: "Resolved",
        happenedAt: selectedTicket.resolvedAt,
        detail: selectedTicket.resolvedByName || "Pending resolution",
        complete: selectedTicket.status === "RESOLVED" || selectedTicket.status === "CLOSED",
      },
      {
        key: "closed",
        title: "Closed",
        happenedAt: selectedTicket.closedAt,
        detail: selectedTicket.closedByName || "Pending closure",
        complete: selectedTicket.status === "CLOSED",
      },
    ];
  }, [selectedTicket]);

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (filteredTickets.length === 0) {
      setSelectedId(null);
      return;
    }

    if (!selectedTicket) {
      setSelectedId(filteredTickets[0].id);
    }
  }, [filteredTickets, selectedTicket]);

  useEffect(() => {
    if (!selectedTicket) {
      setActiveAdminAction(null);
      setActionForm({ assignedStaffId: "", resolutionNote: "", rejectionReason: "" });
      return;
    }

    setActiveAdminAction(null);
    setActionForm({
      assignedStaffId: selectedTicket.assignedStaffId ? String(selectedTicket.assignedStaffId) : "",
      resolutionNote: selectedTicket.resolutionNote || "",
      rejectionReason: selectedTicket.rejectionReason || "",
    });
  }, [selectedTicket]);

  const stats = useMemo(() => {
    return {
      total: tickets.length,
      open: tickets.filter((t) => t.status === "OPEN").length,
      progress: tickets.filter((t) => t.status === "IN_PROGRESS").length,
      resolved: tickets.filter((t) => t.status === "RESOLVED").length,
      closed: tickets.filter((t) => t.status === "CLOSED").length,
      rejected: tickets.filter((t) => t.status === "REJECTED").length,
      unassigned: tickets.filter((t) => !t.assignedStaffId && t.status !== "RESOLVED" && t.status !== "CLOSED" && t.status !== "REJECTED").length,
    };
  }, [tickets]);

  const handleAssign = async (ticketId: number) => {
    if (isTransferredToStaff) {
      toast.info("This ticket is already transferred to staff. Admin actions are disabled.");
      return;
    }

    const staffId = Number(actionForm.assignedStaffId);
    if (!staffId) {
      toast.warning("Please choose a staff member first");
      return;
    }

    if (selectedTicket?.assignedStaffId === staffId) {
      toast.info("This ticket is already assigned to the selected staff member");
      return;
    }

    setWorkingTicketId(ticketId);
    try {
      await ticketService.assignTicket(ticketId, staffId);
      toast.success("Ticket transferred successfully");
      await loadData(false);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to assign ticket");
    } finally {
      setWorkingTicketId(null);
    }
  };

  const handleResolve = async (ticketId: number) => {
    if (isTransferredToStaff) {
      toast.info("Only the assigned staff member can resolve this transferred ticket.");
      return;
    }

    setWorkingTicketId(ticketId);
    try {
      const resolutionNote = actionForm.resolutionNote.trim();
      await ticketService.resolveTicketByAdmin(ticketId, resolutionNote || undefined);
      toast.success("Ticket marked as resolved");
      await loadData(false);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to resolve ticket");
    } finally {
      setWorkingTicketId(null);
    }
  };

  const handleReject = async (ticketId: number) => {
    const reason = actionForm.rejectionReason.trim();
    if (!reason) {
      toast.warning("Rejection reason is required");
      return;
    }

    setWorkingTicketId(ticketId);
    try {
      await ticketService.rejectTicketByAdmin(ticketId, reason);
      toast.success("Ticket rejected");
      await loadData(false);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to reject ticket");
    } finally {
      setWorkingTicketId(null);
    }
  };

  const handleClose = async (ticketId: number) => {
    setWorkingTicketId(ticketId);
    try {
      await ticketService.closeTicketByAdmin(ticketId);
      toast.success("Ticket closed successfully");
      await loadData(false);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to close ticket");
    } finally {
      setWorkingTicketId(null);
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">
        {[
          { label: "Total", value: stats.total, icon: ClipboardList },
          { label: "Open", value: stats.open, icon: AlertCircle },
          { label: "In Progress", value: stats.progress, icon: Loader2 },
          { label: "Resolved", value: stats.resolved, icon: CheckCheck },
            { label: "Closed", value: stats.closed, icon: ShieldCheck },
            { label: "Rejected", value: stats.rejected, icon: AlertCircle },
          { label: "Unassigned", value: stats.unassigned, icon: ShieldCheck },
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
            <p className="text-sm text-muted-foreground">
              Review, assign, and resolve support issues with a focused admin workflow.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadData(false)}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-foreground hover:bg-muted/60 disabled:opacity-60"
          >
            <RefreshCcw size={14} className={refreshing ? "animate-spin" : ""} />
            Refresh Queue
          </button>
        </div>

        <div className="rounded-xl border border-border bg-muted/20 p-3 mb-5">
          <div className="grid gap-3 lg:grid-cols-[1.4fr,repeat(3,minmax(0,0.75fr))]">
            <label className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={filters.search}
                onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
                placeholder="Search by ticket code, subject, requester, or assignee"
                className="h-10 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground"
              />
            </label>

            <select
              value={filters.status}
              onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value as TicketStatus | "ALL" }))}
              className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              value={filters.audience}
              onChange={(event) => setFilters((prev) => ({ ...prev, audience: event.target.value as TicketAudience | "ALL" }))}
              className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground"
            >
              {audienceOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              value={filters.category}
              onChange={(event) => setFilters((prev) => ({ ...prev, category: event.target.value as TicketCategory | "ALL" }))}
              className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground"
            >
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <Filter size={12} />
            Showing {filteredTickets.length} ticket{filteredTickets.length === 1 ? "" : "s"}
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1fr,1.3fr]">
          <div className="rounded-xl border border-border">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground">Incoming Queue</h3>
              <p className="text-xs text-muted-foreground mt-1">Select a ticket to inspect requester details and actions.</p>
            </div>
            <div className="max-h-[620px] overflow-y-auto">
              {loading ? (
                <div className="px-4 py-8 text-sm text-center text-muted-foreground">Loading tickets...</div>
              ) : filteredTickets.length === 0 ? (
                <div className="px-4 py-8 text-sm text-center text-muted-foreground">No tickets matched the current filters.</div>
              ) : (
                filteredTickets.map((ticket) => (
                  <button
                    key={ticket.id}
                    type="button"
                    onClick={() => setSelectedId(ticket.id)}
                    className={`w-full border-b border-border px-4 py-4 text-left transition-colors last:border-b-0 ${
                      selectedId === ticket.id ? "bg-primary/5" : "hover:bg-muted/30"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-mono text-muted-foreground">{ticket.ticketNumber}</p>
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${statusClass[ticket.status]}`}>
                        {pretty(ticket.status)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-foreground line-clamp-1">{ticket.subject}</p>
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
                      {ticket.requesterName} - {ticket.requesterEmail}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground line-clamp-1">
                      {ticket.assignedStaffName
                        ? `Assigned to ${ticket.assignedStaffName}`
                        : "Awaiting staff assignment"}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-background">
            {!selectedTicket ? (
              <div className="min-h-[360px] flex items-center justify-center px-6 text-center text-sm text-muted-foreground">
                Choose a ticket from the queue to view full details and perform actions.
              </div>
            ) : (
              <div className="flex h-full flex-col">
                <div className="border-b border-border px-5 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground">{selectedTicket.ticketNumber}</span>
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${statusClass[selectedTicket.status]}`}>
                      {pretty(selectedTicket.status)}
                    </span>
                  </div>
                  <h3 className="mt-2 text-lg font-semibold text-foreground">{selectedTicket.subject}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">Created {formatDateTime(selectedTicket.createdAt)}</p>
                </div>

                <div className="grid gap-4 p-5 lg:grid-cols-2">
                  <div className="space-y-2 rounded-xl border border-border p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Requester</p>
                    <p className="text-sm text-foreground">{selectedTicket.requesterName}</p>
                    <p className="text-sm text-muted-foreground">{selectedTicket.requesterEmail}</p>
                    <p className="text-xs text-muted-foreground">Audience: {pretty(selectedTicket.audience)}</p>
                  </div>

                  <div className="space-y-2 rounded-xl border border-border p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Ticket Info</p>
                    <p className="text-sm text-foreground">Category: {pretty(selectedTicket.category)}</p>
                    <p className="text-sm text-foreground">Priority: {pretty(selectedTicket.priority)}</p>
                    <p className="text-sm text-foreground">
                      Assigned: {selectedTicket.assignedStaffName || "Not assigned yet"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Last transfer: {formatDateTime(selectedTicket.assignedAt)}
                    </p>
                  </div>

                  <div className="space-y-3 rounded-xl border border-border p-4 lg:col-span-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Flow Timeline</p>
                    <div className="space-y-3">
                      {flowStages.map((stage) => (
                        <div key={stage.key} className="flex items-start gap-3">
                          <span
                            className={`mt-1 h-2.5 w-2.5 rounded-full ${stage.complete ? "bg-primary" : "bg-muted-foreground/40"}`}
                          />
                          <div>
                            <p className="text-sm font-medium text-foreground">{stage.title}</p>
                            <p className="text-xs text-muted-foreground">{stage.detail}</p>
                            <p className="text-xs text-muted-foreground">{formatDateTime(stage.happenedAt)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2 rounded-xl border border-border p-4 lg:col-span-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Issue Description</p>
                    <p className="text-sm text-foreground whitespace-pre-line leading-6">{selectedTicket.description}</p>
                  </div>

                  {!!selectedTicket.attachments?.length && (
                    <div className="space-y-2 rounded-xl border border-border p-4 lg:col-span-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Evidence Attachments</p>
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {selectedTicket.attachments.map((attachment) => (
                          <a
                            key={attachment.id}
                            href={attachment.imageUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="block overflow-hidden rounded-lg border border-border hover:opacity-90"
                          >
                            <img
                              src={attachment.imageUrl}
                              alt={attachment.originalFileName || "Ticket evidence"}
                              className="h-32 w-full object-cover"
                            />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2 rounded-xl border border-success/30 bg-success/5 p-4 lg:col-span-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Ticket Reply Note</p>
                    <p className="text-sm text-foreground whitespace-pre-line leading-6">
                      {selectedTicket.resolutionNote || "No ticket reply note has been recorded yet."}
                    </p>
                  </div>

                  <div className="space-y-2 rounded-xl border border-destructive/30 bg-destructive/5 p-4 lg:col-span-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Rejection Reason</p>
                    <p className="text-sm text-foreground whitespace-pre-line leading-6">
                      {selectedTicket.rejectionReason || "No rejection reason recorded."}
                    </p>
                  </div>
                </div>

                <div className="border-t border-border p-5 space-y-4">
                  <h4 className="text-sm font-semibold text-foreground">Admin Action</h4>
                  {isTransferredToStaff ? (
                    <div className="rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-foreground">
                      This ticket is transferred to {selectedTicket.assignedStaffName || "assigned staff"}. Admin assign/resolve actions are hidden until staff resolves it.
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Transfer this ticket to the relevant non-academic staff member and track progress here.
                    </p>
                  )}

                  {!isTransferredToStaff && (
                    <>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          disabled={workingTicketId === selectedTicket.id || isTicketFinalized || staff.length === 0}
                          onClick={() => setActiveAdminAction("TRANSFER")}
                          className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors disabled:opacity-60 ${
                            activeAdminAction === "TRANSFER"
                              ? "border-primary/40 bg-primary/15 text-primary"
                              : "border-primary/30 bg-primary/10 text-primary hover:bg-primary/20"
                          }`}
                        >
                          <ArrowRightLeft size={14} />
                          Transfer To Staff
                        </button>
                        <button
                          type="button"
                          disabled={workingTicketId === selectedTicket.id || isTicketFinalized}
                          onClick={() => setActiveAdminAction("RESOLVE")}
                          className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors disabled:opacity-60 ${
                            activeAdminAction === "RESOLVE"
                              ? "border-success/40 bg-success/15 text-success"
                              : "border-success/30 bg-success/10 text-success hover:bg-success/20"
                          }`}
                        >
                          <CheckCheck size={14} />
                          Resolve Ticket
                        </button>
                        <button
                          type="button"
                          disabled={workingTicketId === selectedTicket.id || isTicketFinalized}
                          onClick={() => setActiveAdminAction("REJECT")}
                          className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors disabled:opacity-60 ${
                            activeAdminAction === "REJECT"
                              ? "border-destructive/40 bg-destructive/15 text-destructive"
                              : "border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20"
                          }`}
                        >
                          Reject Ticket
                        </button>
                      </div>

                      {activeAdminAction === "TRANSFER" && (
                        <div className="space-y-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
                          <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                            Assign Staff
                          </label>
                          <select
                            value={actionForm.assignedStaffId}
                            onChange={(event) => setActionForm((prev) => ({ ...prev, assignedStaffId: event.target.value }))}
                            disabled={isTicketFinalized}
                            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground disabled:opacity-70"
                          >
                            <option value="">Select non-academic staff</option>
                            {staff.map((member) => (
                              <option key={member.id} value={member.id}>
                                {`${member.firstName || ""} ${member.lastName || ""}`.trim() || member.email}
                              </option>
                            ))}
                          </select>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              disabled={workingTicketId === selectedTicket.id || isTicketFinalized || staff.length === 0}
                              onClick={() => void handleAssign(selectedTicket.id)}
                              className="inline-flex items-center gap-2 rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary hover:bg-primary/20 disabled:opacity-60"
                            >
                              <ArrowRightLeft size={14} />
                              Transfer To Staff
                            </button>
                          </div>
                        </div>
                      )}

                      {activeAdminAction === "RESOLVE" && (
                        <div className="space-y-3 rounded-lg border border-success/20 bg-success/5 p-3">
                          <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                            Ticket Reply Note
                          </label>
                          <textarea
                            rows={4}
                            value={actionForm.resolutionNote}
                            onChange={(event) => setActionForm((prev) => ({ ...prev, resolutionNote: event.target.value }))}
                            placeholder="Add a clear ticket reply note for this case"
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                          />

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              disabled={workingTicketId === selectedTicket.id || isTicketFinalized}
                              onClick={() => void handleResolve(selectedTicket.id)}
                              className="inline-flex items-center gap-2 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success hover:bg-success/20 disabled:opacity-60"
                            >
                              {workingTicketId === selectedTicket.id ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <CheckCheck size={14} />
                              )}
                              Resolve Ticket
                            </button>
                          </div>
                        </div>
                      )}

                      {activeAdminAction === "REJECT" && (
                        <div className="space-y-3 rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                          <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                            Reject Reason
                          </label>
                          <textarea
                            rows={3}
                            value={actionForm.rejectionReason}
                            onChange={(event) => setActionForm((prev) => ({ ...prev, rejectionReason: event.target.value }))}
                            placeholder="If rejecting, provide the reason"
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                          />

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              disabled={workingTicketId === selectedTicket.id || isTicketFinalized}
                              onClick={() => void handleReject(selectedTicket.id)}
                              className="inline-flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive hover:bg-destructive/20 disabled:opacity-60"
                            >
                              Reject Ticket
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {selectedTicket.status === "RESOLVED" && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={workingTicketId === selectedTicket.id}
                        onClick={() => void handleClose(selectedTicket.id)}
                        className="inline-flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-foreground hover:bg-muted/60 disabled:opacity-60"
                      >
                        Close Ticket
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
