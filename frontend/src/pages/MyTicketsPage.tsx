import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  AlertCircle,
  BadgeCheck,
  Clock3,
  LifeBuoy,
  MessageSquareText,
  RefreshCcw,
  ShieldCheck,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import ticketService, { type TicketResponse, type TicketStatus } from "@/services/ticketService";

const statusOptions: Array<{ value: TicketStatus | "ALL"; label: string }> = [
  { value: "ALL", label: "All Statuses" },
  { value: "OPEN", label: "Open" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "RESOLVED", label: "Resolved" },
];

const statusClasses: Record<TicketStatus, string> = {
  OPEN: "bg-primary/10 text-primary border-primary/30",
  IN_PROGRESS: "bg-warning/15 text-warning-foreground border-warning/30",
  RESOLVED: "bg-success/10 text-success border-success/30",
};

const pretty = (value?: string) => {
  if (!value) return "-";
  return value.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (ch) => ch.toUpperCase());
};

const dateTime = (value?: string) => {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
};

const MyTicketsPage = () => {
  const [tickets, setTickets] = useState<TicketResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "ALL">("ALL");

  const loadTickets = async (showPrimaryLoader = true) => {
    if (showPrimaryLoader) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      const response = await ticketService.getMyTickets();
      setTickets(response.data.data || []);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to load your tickets");
    } finally {
      if (showPrimaryLoader) {
        setLoading(false);
      } else {
        setRefreshing(false);
      }
    }
  };

  useEffect(() => {
    void loadTickets();
  }, []);

  const stats = useMemo(
    () => ({
      total: tickets.length,
      open: tickets.filter((ticket) => ticket.status === "OPEN").length,
      inProgress: tickets.filter((ticket) => ticket.status === "IN_PROGRESS").length,
      resolved: tickets.filter((ticket) => ticket.status === "RESOLVED").length,
    }),
    [tickets]
  );

  const filteredTickets = useMemo(() => {
    const query = search.trim().toLowerCase();

    return tickets.filter((ticket) => {
      const matchesStatus = statusFilter === "ALL" || ticket.status === statusFilter;

      if (!query) {
        return matchesStatus;
      }

      const searchableText = [
        ticket.ticketNumber,
        ticket.subject,
        ticket.description,
        ticket.assignedStaffName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesStatus && searchableText.includes(query);
    });
  }, [search, statusFilter, tickets]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="pt-24 pb-12 bg-gradient-to-br from-primary via-primary/95 to-primary/80">
        <div className="container mx-auto px-4 py-12">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-4xl font-bold text-primary-foreground"
          >
            My Support Tickets
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-3 max-w-3xl text-primary-foreground/85"
          >
            Track every issue you submitted from first report to final resolution.
          </motion.p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Link to="/contact">Create New Ticket</Link>
            </Button>
            <Button
              variant="outline"
              onClick={() => void loadTickets(false)}
              disabled={refreshing}
              className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
            >
              <RefreshCcw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>
      </section>

      <main className="container mx-auto px-4 py-10 space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { label: "Total", value: stats.total, icon: LifeBuoy },
            { label: "Open", value: stats.open, icon: AlertCircle },
            { label: "In Progress", value: stats.inProgress, icon: Clock3 },
            { label: "Resolved", value: stats.resolved, icon: ShieldCheck },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-border bg-card p-4 shadow-card">
              <item.icon className="h-5 w-5 text-primary" />
              <p className="mt-3 text-2xl font-bold text-foreground">{item.value}</p>
              <p className="text-sm text-muted-foreground">{item.label}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
          <div className="grid gap-3 md:grid-cols-[1fr,220px]">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by ticket code, subject, or details"
              className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"
            />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as TicketStatus | "ALL")}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground">
            Loading your ticket history...
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
            <MessageSquareText className="mx-auto h-10 w-10 text-muted-foreground/70" />
            <h3 className="mt-4 text-lg font-semibold text-foreground">No tickets found</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {search || statusFilter !== "ALL"
                ? "Try changing search text or filter options."
                : "Create your first support ticket from the contact page."}
            </p>
            {!search && statusFilter === "ALL" && (
              <Button asChild className="mt-5">
                <Link to="/contact">Open Contact Page</Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTickets.map((ticket) => (
              <motion.article
                key={ticket.id}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="rounded-2xl border border-border bg-card p-5 shadow-card"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-muted px-2 py-1 text-xs font-mono text-muted-foreground">
                        {ticket.ticketNumber}
                      </span>
                      <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusClasses[ticket.status]}`}>
                        {pretty(ticket.status)}
                      </span>
                      <span className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground">
                        {pretty(ticket.priority)}
                      </span>
                    </div>

                    <h3 className="text-lg font-semibold text-foreground">{ticket.subject}</h3>
                    <p className="text-sm leading-6 text-muted-foreground whitespace-pre-line">{ticket.description}</p>
                    <p className="text-xs text-muted-foreground">
                      Category: {pretty(ticket.category)} | Audience: {pretty(ticket.audience)}
                    </p>
                  </div>

                  <div className="min-w-[240px] space-y-2 rounded-xl border border-border bg-muted/20 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Tracking</p>
                    <p className="text-sm text-foreground">
                      Assigned: {ticket.assignedStaffName || "Pending assignment"}
                    </p>
                    <p className="text-xs text-muted-foreground">Created: {dateTime(ticket.createdAt)}</p>
                    <p className="text-xs text-muted-foreground">Updated: {dateTime(ticket.updatedAt)}</p>
                    {ticket.resolvedAt && (
                      <p className="flex items-center gap-1 text-xs text-success">
                        <BadgeCheck className="h-3.5 w-3.5" />
                        Resolved: {dateTime(ticket.resolvedAt)}
                      </p>
                    )}
                  </div>
                </div>

                {ticket.resolutionNote && (
                  <div className="mt-4 rounded-xl border border-success/30 bg-success/5 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Resolution Note</p>
                    <p className="mt-2 text-sm leading-6 text-foreground whitespace-pre-line">{ticket.resolutionNote}</p>
                  </div>
                )}
              </motion.article>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default MyTicketsPage;
