import { useState } from "react";
import {
  UserPlus, Search, Filter, Eye, Pencil, Trash2,
  ChevronLeft, ChevronRight, X, CheckCircle2, XCircle, Clock,
  ShieldCheck, GraduationCap, Briefcase, Users
} from "lucide-react";
import { cn } from "@/lib/utils";
import { mockUsers } from "@/data/mockData";
import type { User } from "@/types/dashboard";

const ROLES = ["All", "Admin", "Student", "Staff", "Faculty"];
const STATUSES = ["All", "Active", "Blocked", "Pending"];
const PAGE_SIZE = 8;

const statusConfig: Record<User["status"], { label: string; icon: React.ElementType; className: string }> = {
  Active: { label: "Active", icon: CheckCircle2, className: "bg-success/10 text-success border border-success/20" },
  Blocked: { label: "Blocked", icon: XCircle, className: "bg-destructive/10 text-destructive border border-destructive/20" },
  Pending: { label: "Pending", icon: Clock, className: "bg-warning/10 text-warning-foreground border border-warning/20" },
};

const roleConfig: Record<User["role"], { icon: React.ElementType; className: string }> = {
  Admin: { icon: ShieldCheck, className: "bg-primary/10 text-primary border border-primary/20" },
  Student: { icon: GraduationCap, className: "bg-info/10 text-info border border-info/20" },
  Staff: { icon: Briefcase, className: "bg-accent-red/10 text-accent-red border border-accent-red/20" },
  Faculty: { icon: Users, className: "bg-success/10 text-success border border-success/20" },
};

const avatarGradients = [
  "gradient-primary", "gradient-red", "gradient-info", "gradient-success", "gradient-warning",
];

interface AddUserModalProps {
  onClose: () => void;
}

const AddUserModal = ({ onClose }: AddUserModalProps) => {
  const [form, setForm] = useState({ name: "", email: "", role: "Student", status: "Active" });
  return (
    <div className="fixed inset-0 bg-foreground/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl shadow-card-hover border border-border w-full max-w-md animate-scale-in">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="font-bold text-foreground text-lg">Add New User</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Register a new university member</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {[
            { label: "Full Name", key: "name", placeholder: "e.g. John Smith", type: "text" },
            { label: "Email Address", key: "email", placeholder: "e.g. john@unihub.edu", type: "email" },
          ].map(({ label, key, placeholder, type }) => (
            <div key={key}>
              <label className="text-sm font-medium text-foreground block mb-1.5">{label}</label>
              <input
                type={type}
                placeholder={placeholder}
                value={form[key as keyof typeof form]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/50 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
              />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Role</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/50 text-sm text-foreground outline-none focus:border-primary transition-all"
              >
                {["Admin", "Student", "Staff", "Faculty"].map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/50 text-sm text-foreground outline-none focus:border-primary transition-all"
              >
                {["Active", "Blocked", "Pending"].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div className="flex gap-3 p-6 pt-0">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors">
            Cancel
          </button>
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl gradient-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-md">
            Add User
          </button>
        </div>
      </div>
    </div>
  );
};

export const UserManagementPage = () => {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const filtered = mockUsers.filter((u) => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "All" || u.role === roleFilter;
    const matchStatus = statusFilter === "All" || u.status === statusFilter;
    return matchSearch && matchRole && matchStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const stats = [
    { label: "Total Users", value: mockUsers.length, color: "text-primary" },
    { label: "Active", value: mockUsers.filter(u => u.status === "Active").length, color: "text-success" },
    { label: "Blocked", value: mockUsers.filter(u => u.status === "Blocked").length, color: "text-destructive" },
    { label: "Pending", value: mockUsers.filter(u => u.status === "Pending").length, color: "text-warning" },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">User Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage all university members and their roles</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-md"
        >
          <UserPlus size={16} />
          Add New User
        </button>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="bg-card rounded-xl p-4 border border-border shadow-card">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={cn("text-2xl font-bold mt-1", s.color)}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-card rounded-2xl border border-border shadow-card">
        <div className="flex flex-col md:flex-row gap-3 p-4 border-b border-border">
          {/* Search */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-muted/50 flex-1">
            <Search size={15} className="text-muted-foreground flex-shrink-0" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground w-full"
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-muted-foreground hover:text-foreground">
                <X size={14} />
              </button>
            )}
          </div>
          {/* Role filter */}
          <div className="flex gap-1.5 flex-wrap">
            {ROLES.map((r) => (
              <button
                key={r}
                onClick={() => { setRoleFilter(r); setPage(1); }}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border",
                  roleFilter === r
                    ? "gradient-primary text-white border-transparent"
                    : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                )}
              >
                {r}
              </button>
            ))}
          </div>
          {/* Status filter */}
          <div className="flex gap-1.5 flex-wrap">
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => { setStatusFilter(s); setPage(1); }}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border",
                  statusFilter === s
                    ? "bg-foreground text-background border-transparent"
                    : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/30">
                {["#", "User", "Role", "Status", "Joined Date", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider first:pl-5">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                        <Users size={28} className="opacity-40" />
                      </div>
                      <p className="font-semibold">No users found</p>
                      <p className="text-sm">Try adjusting your search or filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map((user, i) => {
                  const StatusIcon = statusConfig[user.status].icon;
                  const RoleIcon = roleConfig[user.role].icon;
                  return (
                    <tr key={user.id} className="hover:bg-muted/20 transition-colors group">
                      <td className="pl-5 pr-2 py-3.5 text-xs text-muted-foreground font-mono">
                        {String((page - 1) * PAGE_SIZE + i + 1).padStart(2, "0")}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0", avatarGradients[i % avatarGradients.length])}>
                            {user.avatar}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">{user.name}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={cn("inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg", roleConfig[user.role].className)}>
                          <RoleIcon size={11} />
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={cn("inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg", statusConfig[user.status].className)}>
                          <StatusIcon size={11} />
                          {user.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-muted-foreground whitespace-nowrap">
                        {new Date(user.joinedDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setSelectedUser(user)}
                            className="px-2.5 py-1.5 rounded-lg bg-primary/10 hover:bg-primary text-primary hover:text-white text-xs font-medium flex items-center gap-1 transition-all duration-200"
                          >
                            <Eye size={12} /> View
                          </button>
                          <button className="px-2.5 py-1.5 rounded-lg bg-info/10 hover:bg-info text-info hover:text-white text-xs font-medium flex items-center gap-1 transition-all duration-200">
                            <Pencil size={12} /> Edit
                          </button>
                          <button className="px-2.5 py-1.5 rounded-lg bg-destructive/10 hover:bg-destructive text-destructive hover:text-white text-xs font-medium flex items-center gap-1 transition-all duration-200">
                            <Trash2 size={12} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-border">
          <p className="text-xs text-muted-foreground">
            {filtered.length === 0 ? "No results" : `Showing ${Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–${Math.min(page * PAGE_SIZE, filtered.length)} of ${filtered.length} users`}
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center text-muted-foreground disabled:opacity-40 hover:bg-muted/80 transition-all">
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={cn("w-8 h-8 rounded-xl text-xs font-semibold transition-all", page === i + 1 ? "gradient-primary text-white" : "bg-muted text-muted-foreground hover:bg-muted/80")}
              >
                {i + 1}
              </button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center text-muted-foreground disabled:opacity-40 hover:bg-muted/80 transition-all">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-foreground/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl shadow-card-hover border border-border w-full max-w-sm animate-scale-in">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="font-bold text-foreground">User Details</h2>
              <button onClick={() => setSelectedUser(null)} className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground">
                <X size={16} />
              </button>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-4 mb-5">
                <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center text-white text-xl font-bold">
                  {selectedUser.avatar}
                </div>
                <div>
                  <p className="font-bold text-foreground text-lg">{selectedUser.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                </div>
              </div>
              <div className="space-y-3">
                {[
                  { label: "Role", value: selectedUser.role },
                  { label: "Status", value: selectedUser.status },
                  { label: "Joined", value: new Date(selectedUser.joinedDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) },
                  { label: "User ID", value: `#UH-00${selectedUser.id}` },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <span className="text-sm text-muted-foreground">{label}</span>
                    <span className="text-sm font-semibold text-foreground">{value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-2 p-5 pt-0">
              <button className="flex-1 px-3 py-2 rounded-xl bg-info/10 text-info text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-info hover:text-white transition-all">
                <Pencil size={13} /> Edit User
              </button>
              <button className="flex-1 px-3 py-2 rounded-xl bg-destructive/10 text-destructive text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-destructive hover:text-white transition-all">
                <Trash2 size={13} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddModal && <AddUserModal onClose={() => setShowAddModal(false)} />}
    </div>
  );
};
