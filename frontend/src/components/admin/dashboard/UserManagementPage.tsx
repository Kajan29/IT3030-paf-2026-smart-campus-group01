import { useState, useEffect } from "react";
import {
  UserPlus, Search, Download, Upload,
  ChevronLeft, ChevronRight, X, CheckCircle2, XCircle,
  ShieldCheck, GraduationCap, Briefcase, Users, Ban, CheckCircle, FileSpreadsheet
} from "lucide-react";
import { cn } from "@/lib/utils";
import { adminUserService, type UserResponse, type CreateStaffRequest } from "@/services/admin/adminUserService";

const ROLES = ["All", "STUDENT", "ACADEMIC_STAFF", "NON_ACADEMIC_STAFF", "ADMIN"];
const STATUSES = ["All", "Active", "Blocked"];
const PAGE_SIZE = 10;

const getRoleDisplay = (role: string) => {
  const roleMap: Record<string, string> = {
    STUDENT: "Student",
    ACADEMIC_STAFF: "Academic Staff",
    NON_ACADEMIC_STAFF: "Non-Academic Staff",
    ADMIN: "Admin"
  };
  return roleMap[role] || role;
};

const roleConfig: Record<string, { icon: React.ElementType; className: string }> = {
  ADMIN: { icon: ShieldCheck, className: "bg-primary/10 text-primary border border-primary/20" },
  STUDENT: { icon: GraduationCap, className: "bg-info/10 text-info border border-info/20" },
  ACADEMIC_STAFF: { icon: Briefcase, className: "bg-success/10 text-success border border-success/20" },
  NON_ACADEMIC_STAFF: { icon: Users, className: "bg-warning/10 text-warning-foreground border border-warning/20" },
};

const avatarGradients = [
  "gradient-primary", "gradient-red", "gradient-info", "gradient-success", "gradient-warning",
];

interface AddStaffModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const AddStaffModal = ({ onClose, onSuccess }: AddStaffModalProps) => {
  const [form, setForm] = useState<CreateStaffRequest>({ 
    email: "", 
    firstName: "", 
    lastName: "", 
    role: "ACADEMIC_STAFF",
    sendEmail: true 
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{ message?: string; emailSent: boolean } | null>(null);

  const handleSubmit = async () => {
    if (!form.email || !form.firstName || !form.lastName) {
      setError("All fields are required");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await adminUserService.createStaffAccount(form);
      console.log("Staff created:", response.data);
      setSuccess({ 
        message: response.data.data.message,
        emailSent: response.data.data.emailSent 
      });
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 4000);
    } catch (err: any) {
      console.error("Failed to create staff:", err);
      setError(err.response?.data?.message || "Failed to create staff account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-foreground/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl shadow-elevated border border-border w-full max-w-lg animate-fade-in">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="font-bold text-foreground text-lg">Add Staff Account</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Create a new staff member account</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
            <X size={16} />
          </button>
        </div>

        {success ? (
          <div className="p-6">
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-4">
                <CheckCircle className="text-success" size={32} />
              </div>
              <h3 className="font-bold text-foreground text-lg mb-2">Account Created!</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {success.message || "Staff account has been created successfully."}
              </p>
              <div className="bg-muted p-4 rounded-xl w-full space-y-2">
                <p className="text-sm font-medium text-foreground">
                  {success.emailSent
                    ? "Credentials email has been sent to the staff member."
                    : "Credentials email could not be sent automatically."}
                </p>
                <p className="text-xs text-muted-foreground">
                  For security, the default password is not shown here.
                  {!success.emailSent && " Ask the staff member to reset their password via the login page."}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="p-6 space-y-4">
              {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">First Name *</label>
                  <input
                    type="text"
                    placeholder="John"
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/50 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">Last Name *</label>
                  <input
                    type="text"
                    placeholder="Doe"
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/50 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">Email Address *</label>
                <input
                  type="email"
                  placeholder="john.doe@university.edu"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/50 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">Staff Type *</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as any })}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/50 text-sm text-foreground outline-none focus:border-primary transition-all"
                >
                  <option value="ACADEMIC_STAFF">Academic Staff</option>
                  <option value="NON_ACADEMIC_STAFF">Non-Academic Staff</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="sendEmail"
                  checked={form.sendEmail}
                  onChange={(e) => setForm({ ...form, sendEmail: e.target.checked })}
                  className="w-4 h-4 rounded border-border"
                />
                <label htmlFor="sendEmail" className="text-sm text-foreground">
                  Send credentials email to staff member
                </label>
              </div>
            </div>

            <div className="flex gap-3 p-6 pt-0">
              <button 
                onClick={onClose} 
                disabled={loading}
                className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 px-4 py-2.5 rounded-xl gradient-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-md disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create Account"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

interface ImportExcelModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const ImportExcelModal = ({ onClose, onSuccess }: ImportExcelModalProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<any[] | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        setError("Please upload a CSV file");
        return;
      }
      setFile(selectedFile);
      setError("");
    }
  };

  const handleImport = async () => {
    if (!file) {
      setError("Please select a file");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await adminUserService.importStaffFromExcel(file);
      setResults(response.data.data);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to import staff");
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = "email,firstName,lastName,role\njohn.doe@example.com,John,Doe,ACADEMIC_STAFF\njane.smith@example.com,Jane,Smith,NON_ACADEMIC_STAFF";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'staff_import_template.csv';
    a.click();
  };

  return (
    <div className="fixed inset-0 bg-foreground/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl shadow-elevated border border-border w-full max-w-lg animate-fade-in">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="font-bold text-foreground text-lg">Import Staff from Excel</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Upload CSV file to create multiple staff accounts</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
            <X size={16} />
          </button>
        </div>

        {results ? (
          <div className="p-6">
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-4">
                <CheckCircle className="text-success" size={32} />
              </div>
              <h3 className="font-bold text-foreground text-lg mb-2">Import Complete!</h3>
              <p className="text-sm text-muted-foreground">
                {results.length} staff accounts created successfully.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="p-6 space-y-4">
              {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="bg-info/10 border border-info/20 rounded-xl p-4">
                <p className="text-sm font-medium text-info mb-2">CSV Format:</p>
                <p className="text-xs text-muted-foreground mb-3">
                  email, firstName, lastName, role (ACADEMIC_STAFF or NON_ACADEMIC_STAFF)
                </p>
                <button
                  onClick={downloadTemplate}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-info/10 border border-info/30 text-info text-xs font-medium hover:bg-info/20 transition-colors"
                >
                  <Download size={14} />
                  Download Template
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Upload File</label>
                <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/50 transition-colors">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <FileSpreadsheet size={32} className="mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm font-medium text-foreground">
                      {file ? file.name : "Click to upload CSV file"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">or drag and drop</p>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-3 p-6 pt-0">
              <button 
                onClick={onClose} 
                disabled={loading}
                className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleImport}
                disabled={loading || !file}
                className="flex-1 px-4 py-2.5 rounded-xl gradient-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-md disabled:opacity-50"
              >
                {loading ? "Importing..." : "Import Staff"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export const UserManagementPage = () => {
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await adminUserService.getAllUsers();
      console.log("API Response:", response.data);
      setUsers(response.data.data || []);
    } catch (error: any) {
      console.error("Failed to fetch users:", error);
      console.error("Error details:", error.response?.data);
      const errorMsg = error.response?.data?.message || error.message || "Failed to load users";
      setError(errorMsg);
      // Show error message to user
      if (error.response?.status === 401) {
        setError("Unauthorized: Please ensure you are logged in as an admin");
      } else if (error.response?.status === 403) {
        setError("Forbidden: You don't have permission to access this resource");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleBlockUser = async (userId: number, currentStatus: boolean) => {
    try {
      await adminUserService.updateUserStatus(userId, { 
        isActive: !currentStatus,
        reason: currentStatus ? "Blocked by admin" : "Unblocked by admin"
      });
      await fetchUsers();
    } catch (error: any) {
      console.error("Failed to update user status:", error);
      alert(`Failed to update user: ${error.response?.data?.message || error.message}`);
    }
  };

  const filtered = users.filter((u) => {
    const matchSearch = 
      (u.firstName?.toLowerCase() || "").includes(search.toLowerCase()) || 
      (u.lastName?.toLowerCase() || "").includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "All" || u.role === roleFilter;
    const matchStatus = statusFilter === "All" || 
      (statusFilter === "Active" ? u.isActive : !u.isActive);
    return matchSearch && matchRole && matchStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const stats = [
    { label: "Total Users", value: users.length, color: "text-primary" },
    { label: "Active", value: users.filter(u => u.isActive).length, color: "text-success" },
    { label: "Blocked", value: users.filter(u => !u.isActive).length, color: "text-destructive" },
    { label: "Students", value: users.filter(u => u.role === "STUDENT").length, color: "text-info" },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">User Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage students, staff, and administrators</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card text-sm font-semibold hover:bg-muted transition-colors"
          >
            <Upload size={16} />
            Import Excel
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-md"
          >
            <UserPlus size={16} />
            Add Staff
          </button>
        </div>
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
        {error && (
          <div className="m-4 bg-destructive/10 border border-destructive/20 rounded-xl p-4">
            <p className="text-destructive font-semibold text-sm mb-1">Error Loading Users</p>
            <p className="text-destructive text-xs">{error}</p>
            <button 
              onClick={fetchUsers}
              className="mt-3 px-3 py-1.5 rounded-lg bg-destructive/20 hover:bg-destructive/30 text-destructive text-xs font-medium transition-colors"
            >
              Retry
            </button>
          </div>
        )}
        
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
                {r === "All" ? "All" : getRoleDisplay(r)}
              </button>
            ))}
          </div>
          {/* Status filter */}
          <div className="flex gap-1.5">
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
          {loading ? (
            <div className="py-20 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-4 text-sm text-muted-foreground">Loading users...</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-muted/30">
                  {["#", "User", "Role", "Status", "Joined", "Actions"].map((h) => (
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
                    const RoleIcon = roleConfig[user.role]?.icon || Users;
                    const initials = `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase() || "U";
                    return (
                      <tr key={user.id} className="hover:bg-muted/20 transition-colors group">
                        <td className="pl-5 pr-2 py-3.5 text-xs text-muted-foreground font-mono">
                          {String((page - 1) * PAGE_SIZE + i + 1).padStart(2, "0")}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0", avatarGradients[i % avatarGradients.length])}>
                              {initials}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-foreground">
                                {user.firstName} {user.lastName}
                              </p>
                              <p className="text-xs text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold", roleConfig[user.role]?.className)}>
                            <RoleIcon size={12} />
                            {getRoleDisplay(user.role)}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          {user.isActive ? (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-success/10 text-success border border-success/20">
                              <CheckCircle2 size={12} />
                              Active
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-destructive/10 text-destructive border border-destructive/20">
                              <XCircle size={12} />
                              Blocked
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-xs text-muted-foreground">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 pr-5 py-3.5">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleBlockUser(user.id, user.isActive)}
                              className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                                user.isActive 
                                  ? "text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                  : "text-muted-foreground hover:bg-success/10 hover:text-success"
                              )}
                              title={user.isActive ? "Block User" : "Unblock User"}
                            >
                              {user.isActive ? <Ban size={14} /> : <CheckCircle size={14} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {!loading && filtered.length > 0 && (
          <div className="flex items-center justify-between p-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Showing {(page - 1) * PAGE_SIZE + 1} to {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} users
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold transition-colors",
                      page === pageNum
                        ? "gradient-primary text-white"
                        : "border border-border text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {showAddModal && <AddStaffModal onClose={() => setShowAddModal(false)} onSuccess={fetchUsers} />}
      {showImportModal && <ImportExcelModal onClose={() => setShowImportModal(false)} onSuccess={fetchUsers} />}
    </div>
  );
};

