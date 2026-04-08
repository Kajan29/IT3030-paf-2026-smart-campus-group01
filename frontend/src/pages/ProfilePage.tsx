import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  CalendarCheck,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Edit,
  Home,
  LayoutGrid,
  LogOut,
  Mail,
  MapPin,
  Menu,
  Moon,
  Phone,
  Settings,
  ShieldCheck,
  Ticket,
  User,
  Bell,
  MessageSquare,
  Clock,
  TrendingUp,
  GraduationCap,
  X,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "../context/AuthContext";
import { userService } from "@/services/userService";
import ticketService, { type TicketResponse } from "@/services/ticketService";
import { toast } from "react-toastify";
import { cn } from "@/lib/utils";

type SectionId = "overview" | "bookings" | "tickets" | "profile" | "settings";

type BookingItem = {
  title: string;
  date: string;
  status: "Confirmed" | "Pending" | "Cancelled";
  details: string;
};

const ProfilePage = () => {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<SectionId>("overview");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    phoneNumber: user?.phoneNumber || "",
    department: user?.department || "",
  });
  const [saveState, setSaveState] = useState<"idle" | "saved">("idle");
  const [isSaving, setIsSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>(user?.profilePicture || "");
  const [avatarName, setAvatarName] = useState<string>(user?.profilePicture ? "Current image" : "No file chosen");
  const [myTickets, setMyTickets] = useState<TicketResponse[]>([]);
  const [assignedTickets, setAssignedTickets] = useState<TicketResponse[]>([]);
  const [ticketLoading, setTicketLoading] = useState(false);
  const [resolvingTicketId, setResolvingTicketId] = useState<number | null>(null);
  const [ticketTab, setTicketTab] = useState<"mine" | "assigned">("mine");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!user) return;
    setProfileForm({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      phoneNumber: user.phoneNumber || "",
      department: user.department || "",
    });
    setAvatarPreview(user.profilePicture || "");
    setAvatarFile(null);
    setAvatarName(user.profilePicture ? "Current image" : "No file chosen");
  }, [user]);

  const roleLabel = useMemo(() => {
    if (user?.role === "ACADEMIC_STAFF") return "Academic Staff";
    if (user?.role === "NON_ACADEMIC_STAFF") return "Staff";
    if (user?.role === "ADMIN") return "Admin";
    return "Student";
  }, [user?.role]);

  const isStaff = user?.role === "ACADEMIC_STAFF" || user?.role === "NON_ACADEMIC_STAFF";
  const isStudent = user?.role === "STUDENT";
  const isNonAcademicStaff = user?.role === "NON_ACADEMIC_STAFF";

  const bookings: BookingItem[] = isStaff
    ? [
        {
          title: "Auditorium A",
          date: "Apr 02, 2026 - 10:00",
          status: "Confirmed",
          details: "Approved for Faculty of Science",
        },
        {
          title: "Media Room B",
          date: "Apr 04, 2026 - 14:00",
          status: "Pending",
          details: "Awaiting confirmation from admin",
        },
      ]
    : [
        {
          title: "Library Quiet Pod",
          date: "Apr 02, 2026 - 09:00",
          status: "Confirmed",
          details: "Seat 12, Ground Floor",
        },
        {
          title: "Study Room 3",
          date: "Apr 05, 2026 - 12:00",
          status: "Pending",
          details: "Team project booking",
        },
        {
          title: "Sports Complex Court",
          date: "Apr 09, 2026 - 18:00",
          status: "Cancelled",
          details: "Cancelled by requester",
        },
      ];

  const openTicketCount = myTickets.filter((ticket) => ticket.status !== "RESOLVED").length;

  const summary = [
    {
      label: "Upcoming bookings",
      value: isStaff ? "4" : "3",
      hint: isStaff ? "2 need confirmation" : "Next on Apr 2",
    },
    {
      label: "Open tickets",
      value: String(openTicketCount),
      hint: openTicketCount > 0 ? "Track live updates in Tickets" : "No pending tickets",
    },
    {
      label: "Completed",
      value: isStaff ? "27" : "14",
      hint: isStaff ? "Events closed" : "Bookings completed",
    },
    {
      label: "Status",
      value: user?.isVerified ? "Verified" : "Unverified",
      hint: user?.isVerified ? "Account secure" : "Verify email to unlock all actions",
    },
  ];

  const personalDetails = [
    { label: "Full name", value: `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Not set", icon: User },
    { label: "Email", value: user?.email || "Not available", icon: Mail },
    { label: "Phone", value: profileForm.phoneNumber || "Add a number", icon: Phone },
    { label: "Department", value: profileForm.department || (isStudent ? "Student" : "Staff"), icon: BookOpen },
    { label: "Campus", value: "Main Campus", icon: MapPin },
  ];

  const getInitials = () => {
    if (!user) return "U";
    return `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase();
  };

  const username = (() => {
    const base = `${user?.firstName || ""}${user?.lastName || ""}`.trim();
    return (user?.username || base || "user").replace(/\s+/g, "").toLowerCase();
  })();

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
      setAvatarName(file.name);
    }
  };

  const triggerAvatarUpload = () => {
    fileInputRef.current?.click();
  };

  const handleSaveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;
    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append("firstName", profileForm.firstName);
      formData.append("lastName", profileForm.lastName);
      formData.append("phoneNumber", profileForm.phoneNumber);
      formData.append("department", profileForm.department);
      if (avatarFile) {
        formData.append("avatar", avatarFile);
      }

      const response = await userService.updateProfile(formData);
      const updatedProfile = response.data.data;
      const updatedUser = {
        ...user,
        ...updatedProfile,
      } as typeof user;
      updateUser(updatedUser!);
      setProfileForm({
        firstName: updatedProfile.firstName || "",
        lastName: updatedProfile.lastName || "",
        phoneNumber: updatedProfile.phoneNumber || "",
        department: updatedProfile.department || "",
      });
      const nextAvatar = updatedProfile.profilePicture || avatarPreview;
      setAvatarPreview(nextAvatar);
      setAvatarName(updatedProfile.profilePicture ? "Current image" : avatarName);
      setSaveState("saved");
      toast.success(response.data.message || "Profile updated");
      setTimeout(() => setSaveState("idle"), 2000);
    } catch (error) {
      setSaveState("idle");
      toast.error((error as any)?.response?.data?.message || "Could not update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const loadTickets = async () => {
    if (!user) return;

    setTicketLoading(true);
    try {
      const myResponse = await ticketService.getMyTickets();
      setMyTickets(myResponse.data.data || []);

      if (user.role === "NON_ACADEMIC_STAFF") {
        const assignedResponse = await ticketService.getAssignedTickets();
        setAssignedTickets(assignedResponse.data.data || []);
      } else {
        setAssignedTickets([]);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Could not load tickets");
    } finally {
      setTicketLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email, user?.role]);

  const handleResolveAssignedTicket = async (ticketId: number) => {
    const note = window.prompt("Add an optional resolution note:") || undefined;
    setResolvingTicketId(ticketId);
    try {
      await ticketService.resolveAssignedTicket(ticketId, note);
      toast.success("Ticket resolved successfully");
      await loadTickets();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Could not resolve ticket");
    } finally {
      setResolvingTicketId(null);
    }
  };

  const sectionList = [
    { id: "overview" as SectionId, label: "Overview", icon: LayoutGrid },
    { id: "bookings" as SectionId, label: isStudent ? "My Bookings" : "Bookings", icon: CalendarDays },
    { id: "tickets" as SectionId, label: "Tickets", icon: Ticket },
    { id: "profile" as SectionId, label: "Edit Profile", icon: Edit },
    { id: "settings" as SectionId, label: "Preferences", icon: Settings },
  ];

  const pageTitles: Record<SectionId, string> = {
    overview: "Dashboard Overview",
    bookings: isStudent ? "My Bookings" : "Bookings Management",
    tickets: "Support Tickets",
    profile: "Edit Profile",
    settings: "Preferences",
  };

  const renderStatusBadge = (status: BookingItem["status"]) => {
    const styles: Record<BookingItem["status"], string> = {
      Confirmed: "bg-success/10 text-success border-success/30",
      Pending: "bg-warning/15 text-warning-foreground border-warning/30",
      Cancelled: "bg-destructive/10 text-destructive border-destructive/30",
    };
    return <Badge className={`border ${styles[status]}`}>{status}</Badge>;
  };

  const renderTicketBadge = (status: TicketResponse["status"]) => {
    const styles: Record<TicketResponse["status"], string> = {
      OPEN: "bg-primary/10 text-primary border-primary/30",
      RESOLVED: "bg-success/10 text-success border-success/30",
      IN_PROGRESS: "bg-warning/15 text-warning-foreground border-warning/30",
    };
    const label = status.replace("_", " ").toLowerCase().replace(/\b\w/g, (s) => s.toUpperCase());
    return <Badge className={`border ${styles[status]}`}>{label}</Badge>;
  };

  const formatDateTime = (value: string) => {
    try {
      return new Date(value).toLocaleString();
    } catch {
      return value;
    }
  };

  const statIcons = [CalendarDays, MessageSquare, TrendingUp, ShieldCheck];

  const renderSection = () => {
    if (activeSection === "overview") {
      return (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {summary.map((item, index) => {
              const IconComponent = statIcons[index];
              return (
                <div key={item.label}>
                  <Card className="border-border/50 shadow-card hover:shadow-elevated transition-all duration-300 group">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="p-2.5 rounded-xl bg-primary/10 group-hover:bg-primary/15 transition-colors">
                          <IconComponent size={18} className="text-primary" />
                        </div>
                        {item.label === "Status" && (
                          <Badge className={`text-xs ${user?.isVerified ? "bg-success/10 text-success border-success/30" : "bg-warning/15 text-warning-foreground border-warning/30"}`}>
                            {user?.isVerified ? "Active" : "Pending"}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">{item.label}</p>
                      <p className="text-2xl md:text-3xl font-bold text-foreground mb-1">{item.value}</p>
                      <p className="text-xs text-muted-foreground">{item.hint}</p>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
            {/* Upcoming Bookings */}
            <div className="xl:col-span-3">
              <Card className="border-border/50 shadow-card h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-accent/10">
                        <CalendarCheck size={18} className="text-accent" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-display">Upcoming Bookings</CardTitle>
                        <CardDescription>Your scheduled reservations</CardDescription>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-muted">{bookings.length} items</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {bookings.map((booking) => (
                    <div
                      key={`${booking.title}-${booking.date}`}
                      className="flex items-center justify-between gap-4 p-4 rounded-xl bg-muted/40 border border-border/50 hover:bg-muted/60 transition-colors group"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="hidden sm:flex h-12 w-12 rounded-xl bg-primary/10 items-center justify-center flex-shrink-0">
                          <CalendarDays size={20} className="text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground truncate">{booking.title}</p>
                          <p className="text-sm text-muted-foreground truncate">{booking.details}</p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <Clock size={12} />
                            <span>{booking.date}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        {renderStatusBadge(booking.status)}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Profile Snapshot */}
            <div className="xl:col-span-2">
              <Card className="border-border/50 shadow-card h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <User size={18} className="text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-display">Profile Details</CardTitle>
                        <CardDescription>Your account information</CardDescription>
                      </div>
                    </div>
                    {user?.isVerified ? (
                      <Badge className="bg-success/10 text-success border-success/30">Verified</Badge>
                    ) : (
                      <Badge className="bg-warning/15 text-warning-foreground border-warning/30">Unverified</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {personalDetails.map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors group"
                    >
                      <div className="p-2 rounded-lg bg-muted group-hover:bg-muted/80 transition-colors">
                        <item.icon size={14} className="text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">{item.label}</p>
                        <p className="text-sm font-medium text-foreground truncate">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      );
    }

    if (activeSection === "bookings") {
      return (
        <Card className="border-border/50 shadow-card">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-accent/10">
                  <CalendarDays size={20} className="text-accent" />
                </div>
                <div>
                  <CardTitle className="font-display text-xl">{isStudent ? "My Bookings" : "Bookings"}</CardTitle>
                  <CardDescription>Manage and track your reservations</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="border-border">
                  <CalendarCheck size={16} className="mr-2" />
                  New Booking
                </Button>
                <Button size="sm" className="bg-primary hover:bg-primary/90">
                  View Calendar
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {bookings.map((booking) => (
              <div
                key={`${booking.title}-${booking.date}`}
                className="group p-4 rounded-xl bg-muted/30 border border-border/50 hover:bg-muted/50 hover:border-border transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="hidden sm:flex h-12 w-12 rounded-xl bg-primary/10 items-center justify-center flex-shrink-0 group-hover:bg-primary/15 transition-colors">
                      <CalendarDays size={20} className="text-primary" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-semibold text-foreground">{booking.title}</p>
                      <p className="text-sm text-muted-foreground">{booking.details}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock size={12} />
                        <span>{booking.date}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {renderStatusBadge(booking.status)}
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                      Manage
                      <ChevronRight size={14} className="ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      );
    }

    if (activeSection === "tickets") {
      const visibleTickets = ticketTab === "mine" ? myTickets : assignedTickets;
      return (
        <Card className="border-border/50 shadow-card">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10">
                  <Ticket size={20} className="text-primary" />
                </div>
                <div>
                  <CardTitle className="font-display text-xl">Support Tickets</CardTitle>
                  <CardDescription>
                    {isNonAcademicStaff
                      ? "Manage your own requests and tickets assigned to you"
                      : "Track your support and access requests"}
                  </CardDescription>
                </div>
              </div>
              <Button size="sm" className="bg-primary hover:bg-primary/90" onClick={() => navigate("/contact")}>
                <MessageSquare size={16} className="mr-2" />
                Raise Ticket
              </Button>
            </div>
            {isNonAcademicStaff && (
              <div className="flex items-center gap-2 mt-2">
                <Button
                  size="sm"
                  variant={ticketTab === "mine" ? "default" : "outline"}
                  className={ticketTab === "mine" ? "bg-primary hover:bg-primary/90" : "border-border"}
                  onClick={() => setTicketTab("mine")}
                >
                  My Requests
                </Button>
                <Button
                  size="sm"
                  variant={ticketTab === "assigned" ? "default" : "outline"}
                  className={ticketTab === "assigned" ? "bg-primary hover:bg-primary/90" : "border-border"}
                  onClick={() => setTicketTab("assigned")}
                >
                  Assigned To Me
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            {ticketLoading ? (
              <div className="p-6 text-center text-sm text-muted-foreground">Loading tickets...</div>
            ) : visibleTickets.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                {ticketTab === "assigned"
                  ? "No tickets assigned to you yet."
                  : "You have not created any tickets yet."}
              </div>
            ) : (
              visibleTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="group p-4 rounded-xl bg-muted/30 border border-border/50 hover:bg-muted/50 hover:border-border transition-all"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="hidden sm:flex h-12 w-12 rounded-xl bg-muted items-center justify-center flex-shrink-0 group-hover:bg-muted/80 transition-colors">
                        <MessageSquare size={18} className="text-muted-foreground" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-semibold text-foreground">{ticket.subject}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                          <span className="font-mono bg-muted px-2 py-0.5 rounded">{ticket.ticketNumber}</span>
                          <span>{ticket.category.replace(/_/g, " ")}</span>
                          <span>{ticket.audience === "STUDENT" ? "Student Support" : "Staff Support"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock size={12} />
                          <span>Updated {formatDateTime(ticket.updatedAt)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {renderTicketBadge(ticket.status)}
                      {isNonAcademicStaff && ticketTab === "assigned" && ticket.status !== "RESOLVED" ? (
                        <Button
                          size="sm"
                          className="bg-success hover:bg-success/90 text-success-foreground"
                          disabled={resolvingTicketId === ticket.id}
                          onClick={() => handleResolveAssignedTicket(ticket.id)}
                        >
                          {resolvingTicketId === ticket.id ? "Resolving..." : "Resolve"}
                        </Button>
                      ) : (
                        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                          {ticket.assignedStaffName ? ticket.assignedStaffName : "View"}
                          <ChevronRight size={14} className="ml-1" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      );
    }

    if (activeSection === "profile") {
      return (
        <Card className="border-border/50 shadow-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10">
                  <Edit size={20} className="text-primary" />
                </div>
                <div>
                  <CardTitle className="font-display text-xl">Edit Profile</CardTitle>
                  <CardDescription>Update how others see you</CardDescription>
                </div>
              </div>
              {saveState === "saved" && (
                <Badge className="bg-success/10 text-success border-success/30">
                  <ShieldCheck size={12} className="mr-1" />
                  Saved
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={handleSaveProfile}>
              {/* Profile Image Section */}
              <div className="p-5 rounded-xl bg-muted/30 border border-border/50">
                <p className="text-sm font-medium text-foreground mb-4">Profile Image</p>
                <div className="flex flex-wrap items-center gap-4">
                  <Avatar className="h-20 w-20 border-4 border-primary/20 shadow-md">
                    <AvatarImage src={avatarPreview || user?.profilePicture} alt={user?.firstName} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">{getInitials()}</AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <Button type="button" variant="outline" className="border-border" onClick={triggerAvatarUpload}>
                      Upload New Photo
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                    <p className="text-xs text-muted-foreground max-w-[220px] truncate" title={avatarName}>
                      {avatarName}
                    </p>
                  </div>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">First Name</label>
                  <input
                    className="w-full rounded-xl border border-border bg-muted/30 px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all"
                    value={profileForm.firstName}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, firstName: e.target.value }))}
                    placeholder="Enter your first name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Last Name</label>
                  <input
                    className="w-full rounded-xl border border-border bg-muted/30 px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all"
                    value={profileForm.lastName}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Enter your last name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Phone Number</label>
                  <input
                    className="w-full rounded-xl border border-border bg-muted/30 px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all"
                    value={profileForm.phoneNumber}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, phoneNumber: e.target.value }))}
                    placeholder="Add your contact number"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Department or Program</label>
                  <input
                    className="w-full rounded-xl border border-border bg-muted/30 px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all"
                    value={profileForm.department}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, department: e.target.value }))}
                    placeholder={isStudent ? "Your course of study" : "Your team or unit"}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t border-border/50">
                <p className="text-xs text-muted-foreground">Changes will be saved to your profile. Fresh uploads may take a moment to refresh.</p>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-border"
                    onClick={() => {
                      setProfileForm({
                        firstName: user?.firstName || "",
                        lastName: user?.lastName || "",
                        phoneNumber: user?.phoneNumber || "",
                        department: user?.department || "",
                      });
                      setAvatarPreview(user?.profilePicture || "");
                      setAvatarFile(null);
                      setAvatarName(user?.profilePicture ? "Current image" : "No file chosen");
                    }}
                  >
                    Reset
                  </Button>
                  <Button type="submit" className="bg-primary hover:bg-primary/90 min-w-[120px]" disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      );
    }

    // Settings/Preferences section
    return (
      <Card className="border-border/50 shadow-card">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <Settings size={20} className="text-primary" />
            </div>
            <div>
              <CardTitle className="font-display text-xl">Preferences</CardTitle>
              <CardDescription>Manage your notification and display settings</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Email Notifications */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <Bell size={18} className="text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Email Notifications</p>
                <p className="text-sm text-muted-foreground">Receive booking and ticket updates via email</p>
              </div>
            </div>
            <Badge className="bg-success/10 text-success border-success/30">On</Badge>
          </div>

          {/* SMS Alerts */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-muted">
                <Phone size={18} className="text-muted-foreground" />
              </div>
              <div>
                <p className="font-semibold text-foreground">SMS Alerts</p>
                <p className="text-sm text-muted-foreground">Get text messages for urgent items only</p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-muted text-muted-foreground">Off</Badge>
          </div>

          {/* Appearance */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <Moon size={18} className="text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Appearance</p>
                <p className="text-sm text-muted-foreground">Switch between light and dark themes</p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-accent/10 text-accent border-accent/30">Auto</Badge>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-foreground/40 z-30 md:hidden" 
          onClick={() => setMobileSidebarOpen(false)} 
        />
      )}

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col h-screen border-r border-sidebar-border/70 shadow-[6px_0_22px_-8px_hsl(var(--foreground)/0.35)] overflow-hidden",
          "transition-all duration-300 ease-in-out flex-shrink-0",
          "bg-sidebar",
          sidebarCollapsed ? "w-20" : "w-72"
        )}
      >
        {/* Logo Header */}
        <div className="relative flex items-center justify-between px-4 py-5 border-b border-sidebar-border/70">
          <div className={cn("flex items-center gap-3 overflow-hidden", sidebarCollapsed && "justify-center")}>
            <div className="w-10 h-10 rounded-2xl bg-sidebar-primary flex items-center justify-center flex-shrink-0 shadow-lg">
              <GraduationCap size={20} className="text-white" />
            </div>
            {!sidebarCollapsed && (
              <div>
                <span className="text-white font-bold text-lg leading-none">Zentaritas</span>
                <p className="text-sidebar-foreground text-[10px] leading-tight mt-0.5 tracking-[0.16em] uppercase">
                  My Profile
                </p>
              </div>
            )}
          </div>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={cn(
              "w-7 h-7 rounded-full bg-sidebar-accent/90 flex items-center justify-center",
              "text-sidebar-foreground hover:text-white hover:bg-sidebar-primary transition-all duration-200",
              sidebarCollapsed && "hidden"
            )}
          >
            <ChevronLeft size={14} />
          </button>
        </div>

        {/* Expand Button when Collapsed */}
        {sidebarCollapsed && (
          <button
            onClick={() => setSidebarCollapsed(false)}
            className="mx-auto mt-3 w-9 h-9 rounded-full bg-sidebar-accent/90 flex items-center justify-center text-sidebar-foreground hover:text-white hover:bg-sidebar-primary transition-all duration-200"
          >
            <ChevronRight size={14} />
          </button>
        )}

        {/* User Profile Card */}
        {!sidebarCollapsed && (
          <div className="mx-3 mt-4 p-3 rounded-xl bg-white/10 border border-white/15">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border-2 border-sidebar-primary">
                <AvatarImage src={avatarPreview || user?.profilePicture} alt={user?.firstName} />
                <AvatarFallback className="bg-sidebar-primary text-white font-semibold text-sm">{getInitials()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm truncate">{user?.firstName} {user?.lastName}</p>
                <p className="text-sidebar-foreground/70 text-xs truncate">@{username}</p>
              </div>
              {user?.isVerified && <ShieldCheck size={14} className="text-success flex-shrink-0" />}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <Badge className="bg-white/15 text-white text-[10px] border-white/20">{roleLabel}</Badge>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto overflow-x-hidden">
          {!sidebarCollapsed && (
            <p className="text-sidebar-foreground text-[10px] font-semibold uppercase tracking-widest px-3 mb-3">
              Navigation
            </p>
          )}
          {sectionList.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium",
                  "transition-all duration-200 group relative",
                  isActive
                    ? "bg-white text-primary shadow-md"
                    : "text-sidebar-foreground hover:bg-white/10 hover:text-white"
                )}
              >
                <Icon
                  size={18}
                  className={cn(
                    "flex-shrink-0 transition-transform duration-200 group-hover:scale-110",
                    isActive ? "text-primary" : ""
                  )}
                />
                {!sidebarCollapsed && <span className="flex-1 text-left truncate">{item.label}</span>}
                {sidebarCollapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-sidebar-accent text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg">
                    {item.label}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="px-2 pb-4 border-t border-sidebar-border/70 pt-3 space-y-1">
          {!sidebarCollapsed && (
            <p className="text-sidebar-foreground text-[10px] font-semibold uppercase tracking-widest px-3 mb-2">
              Actions
            </p>
          )}
          <button
            onClick={() => navigate("/")}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium",
              "text-sidebar-foreground hover:bg-white/10 hover:text-white transition-all duration-200 group relative"
            )}
          >
            <Home size={18} className="flex-shrink-0 group-hover:scale-110 transition-transform" />
            {!sidebarCollapsed && <span>Back to Home</span>}
            {sidebarCollapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-sidebar-accent text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg">
                Back to Home
              </div>
            )}
          </button>
          <button
            onClick={() => {
              logout();
              navigate("/auth/login");
            }}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium",
              "text-sidebar-foreground hover:bg-destructive/20 hover:text-destructive transition-all duration-200 group relative"
            )}
          >
            <LogOut size={18} className="flex-shrink-0 group-hover:translate-x-1 transition-transform" />
            {!sidebarCollapsed && <span>Logout</span>}
            {sidebarCollapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-destructive text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg">
                Logout
              </div>
            )}
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full z-40 md:hidden transition-transform duration-300 w-72",
          "flex flex-col border-r border-sidebar-border/70 shadow-2xl bg-sidebar",
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Mobile Header */}
        <div className="flex items-center justify-between px-4 py-5 border-b border-sidebar-border/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sidebar-primary flex items-center justify-center shadow-lg">
              <GraduationCap size={20} className="text-white" />
            </div>
            <div>
              <span className="text-white font-bold text-lg leading-none">Zentaritas</span>
              <p className="text-sidebar-foreground text-[10px] leading-tight mt-0.5 tracking-[0.16em] uppercase">
                My Profile
              </p>
            </div>
          </div>
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sidebar-foreground hover:text-white hover:bg-white/20 transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {/* Mobile User Card */}
        <div className="mx-3 mt-4 p-3 rounded-xl bg-white/10 border border-white/15">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border-2 border-sidebar-primary">
              <AvatarImage src={avatarPreview || user?.profilePicture} alt={user?.firstName} />
              <AvatarFallback className="bg-sidebar-primary text-white font-semibold text-sm">{getInitials()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm truncate">{user?.firstName} {user?.lastName}</p>
              <p className="text-sidebar-foreground/70 text-xs truncate">@{username}</p>
            </div>
            {user?.isVerified && <ShieldCheck size={14} className="text-success flex-shrink-0" />}
          </div>
          <div className="mt-2">
            <Badge className="bg-white/15 text-white text-[10px] border-white/20">{roleLabel}</Badge>
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          <p className="text-sidebar-foreground text-[10px] font-semibold uppercase tracking-widest px-3 mb-3">
            Navigation
          </p>
          {sectionList.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveSection(item.id);
                  setMobileSidebarOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-white text-primary shadow-md"
                    : "text-sidebar-foreground hover:bg-white/10 hover:text-white"
                )}
              >
                <Icon size={18} className={isActive ? "text-primary" : ""} />
                <span className="flex-1 text-left truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Mobile Bottom Actions */}
        <div className="px-2 pb-4 border-t border-sidebar-border/70 pt-3 space-y-1">
          <p className="text-sidebar-foreground text-[10px] font-semibold uppercase tracking-widest px-3 mb-2">
            Actions
          </p>
          <button
            onClick={() => navigate("/")}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-sidebar-foreground hover:bg-white/10 hover:text-white transition-all"
          >
            <Home size={18} />
            <span>Back to Home</span>
          </button>
          <button
            onClick={() => {
              logout();
              navigate("/auth/login");
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-sidebar-foreground hover:bg-destructive/20 hover:text-destructive transition-all"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="flex items-center justify-between px-4 md:px-6 py-4 bg-card border-b border-border shadow-sm">
          {/* Mobile Menu Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all"
            >
              <Menu size={20} />
            </button>
            <div>
              <h1 className="font-display text-lg md:text-xl font-bold text-foreground">
                {pageTitles[activeSection]}
              </h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
                {activeSection === "overview" && "Welcome to your personal dashboard"}
                {activeSection === "bookings" && "Manage your space reservations"}
                {activeSection === "tickets" && "Track your support requests"}
                {activeSection === "profile" && "Update your personal information"}
                {activeSection === "settings" && "Customize your experience"}
              </p>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:flex border-border"
              onClick={() => navigate("/book-room")}
            >
              <CalendarCheck size={16} className="mr-2" />
              Book Space
            </Button>
            <Button
              size="sm"
              className="bg-primary hover:bg-primary/90"
              onClick={() => navigate("/contact")}
            >
              <Ticket size={16} className="mr-2 hidden sm:inline" />
              Raise Ticket
            </Button>
            <div className="hidden md:flex items-center gap-2 pl-3 border-l border-border">
              <Avatar className="h-9 w-9 border-2 border-primary/20">
                <AvatarImage src={avatarPreview || user?.profilePicture} alt={user?.firstName} />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">{getInitials()}</AvatarFallback>
              </Avatar>
              <div className="hidden lg:block">
                <p className="text-sm font-medium text-foreground">{user?.firstName}</p>
                <p className="text-xs text-muted-foreground">{roleLabel}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 md:p-6 bg-muted/30">
          <div className="max-w-7xl mx-auto">
            {renderSection()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ProfilePage;
