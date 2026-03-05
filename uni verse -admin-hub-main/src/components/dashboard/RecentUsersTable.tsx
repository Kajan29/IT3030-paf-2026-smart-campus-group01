import { useState } from "react";
import { Search, ChevronLeft, ChevronRight, Eye, Pencil, Trash2, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { mockUsers } from "@/data/mockData";
import type { User } from "@/types/dashboard";

const ROLES = ["All", "Admin", "Student", "Staff", "Faculty"];
const PAGE_SIZE = 5;

const statusStyles: Record<User["status"], string> = {
  Active: "bg-success/10 text-success border-success/20",
  Blocked: "bg-destructive/10 text-destructive border-destructive/20",
  Pending: "bg-warning/10 text-warning-foreground border-warning/20",
};

const roleStyles: Record<User["role"], string> = {
  Admin: "bg-primary/10 text-primary",
  Student: "bg-info/10 text-info",
  Staff: "bg-accent-red/10 text-accent-red",
  Faculty: "bg-success/10 text-success",
};

const avatarColors = [
  "gradient-primary", "gradient-red", "gradient-info", "gradient-success", "gradient-warning",
];

export const RecentUsersTable = () => {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [showFilter, setShowFilter] = useState(false);

  const filtered = mockUsers.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "All" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="bg-card rounded-2xl shadow-card border border-border animate-fade-in" style={{ animationDelay: "500ms" }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-5 border-b border-border">
        <div>
          <h3 className="font-semibold text-foreground">Recent Users</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{filtered.length} total members</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Search */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-muted/50 flex-1 sm:w-56">
            <Search size={14} className="text-muted-foreground flex-shrink-0" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground w-full"
            />
          </div>
          {/* Filter */}
          <div className="relative">
            <button
              onClick={() => setShowFilter(!showFilter)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-muted/50 text-sm text-foreground hover:bg-muted transition-colors"
            >
              <Filter size={14} />
              <span className="hidden sm:inline">{roleFilter}</span>
            </button>
            {showFilter && (
              <div className="absolute right-0 top-10 w-36 bg-card border border-border rounded-xl shadow-card-hover z-20 overflow-hidden animate-scale-in">
                {ROLES.map((role) => (
                  <button
                    key={role}
                    onClick={() => { setRoleFilter(role); setPage(1); setShowFilter(false); }}
                    className={cn(
                      "w-full text-left px-3 py-2 text-sm transition-colors hover:bg-muted",
                      roleFilter === role ? "text-primary font-semibold bg-primary/5" : "text-foreground"
                    )}
                  >
                    {role}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {["User", "Role", "Status", "Joined", "Actions"].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Search size={32} className="opacity-30" />
                    <p className="text-sm font-medium">No users found</p>
                    <p className="text-xs">Try adjusting your search or filters</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginated.map((user, i) => (
                <tr
                  key={user.id}
                  className="hover:bg-muted/30 transition-colors group"
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0",
                          avatarColors[i % avatarColors.length]
                        )}
                      >
                        {user.avatar}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full", roleStyles[user.role])}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={cn(
                        "text-xs font-semibold px-2.5 py-1 rounded-full border",
                        statusStyles[user.status]
                      )}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-muted-foreground whitespace-nowrap">
                    {new Date(user.joinedDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button className="w-7 h-7 rounded-lg bg-primary/10 hover:bg-primary text-primary hover:text-white flex items-center justify-center transition-all duration-200" title="View">
                        <Eye size={13} />
                      </button>
                      <button className="w-7 h-7 rounded-lg bg-info/10 hover:bg-info text-info hover:text-white flex items-center justify-center transition-all duration-200" title="Edit">
                        <Pencil size={13} />
                      </button>
                      <button className="w-7 h-7 rounded-lg bg-destructive/10 hover:bg-destructive text-destructive hover:text-white flex items-center justify-center transition-all duration-200" title="Delete">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Showing {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-7 h-7 rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center text-muted-foreground disabled:opacity-40 transition-all"
            >
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i + 1}
                onClick={() => setPage(i + 1)}
                className={cn(
                  "w-7 h-7 rounded-lg text-xs font-semibold transition-all",
                  page === i + 1
                    ? "gradient-primary text-white"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="w-7 h-7 rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center text-muted-foreground disabled:opacity-40 transition-all"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Click outside filter */}
      {showFilter && <div className="fixed inset-0 z-10" onClick={() => setShowFilter(false)} />}
    </div>
  );
};
