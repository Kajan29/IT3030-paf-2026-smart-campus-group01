import { useEffect, useMemo, useRef, useState, type ChangeEvent, type ComponentType, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  CalendarCheck,
  CalendarDays,
  Edit,
  Home,
  LayoutGrid,
  Mail,
  MapPin,
  Moon,
  Phone,
  Settings,
  ShieldCheck,
  Ticket,
  User,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "../context/AuthContext";
import { userService } from "@/services/userService";
import { toast } from "react-toastify";

type SectionId = "overview" | "bookings" | "tickets" | "profile" | "settings";

type BookingItem = {
  title: string;
  date: string;
  status: "Confirmed" | "Pending" | "Cancelled";
  details: string;
};

type TicketItem = {
  id: string;
  subject: string;
  status: "Open" | "Resolved" | "Pending";
  updated: string;
  channel: string;
};

const ProfilePage = () => {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<SectionId>("overview");
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

  const tickets: TicketItem[] = [
    {
      id: "T-1042",
      subject: "Change booking time",
      status: "Open",
      updated: "Today, 09:30",
      channel: "Support",
    },
    {
      id: "T-0988",
      subject: "Access to lab after 7pm",
      status: "Resolved",
      updated: "Mar 28, 2026",
      channel: "Facilities",
    },
    {
      id: "T-0954",
      subject: "Projector not working",
      status: "Pending",
      updated: "Mar 26, 2026",
      channel: "AV",
    },
  ];

  const summary = [
    {
      label: "Upcoming bookings",
      value: isStaff ? "4" : "3",
      hint: isStaff ? "2 need confirmation" : "Next on Apr 2",
    },
    {
      label: "Open tickets",
      value: "1",
      hint: "Avg response 2h",
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

  const sectionList: Array<{ id: SectionId; label: string; icon: ComponentType<{ size?: number; className?: string }> }> = [
    { id: "overview", label: "Overview", icon: LayoutGrid },
    { id: "bookings", label: isStudent ? "My Bookings" : "Bookings", icon: CalendarDays },
    { id: "tickets", label: "Tickets", icon: Ticket },
    { id: "profile", label: "Edit Profile", icon: Edit },
    { id: "settings", label: "Preferences", icon: Settings },
  ];

  const renderStatusBadge = (status: BookingItem["status"]) => {
    const styles: Record<BookingItem["status"], string> = {
      Confirmed: "bg-success/10 text-success border-success/30",
      Pending: "bg-warning/15 text-warning-foreground border-warning/30",
      Cancelled: "bg-destructive/10 text-destructive border-destructive/30",
    };
    return <Badge className={`border ${styles[status]}`}>{status}</Badge>;
  };

  const renderTicketBadge = (status: TicketItem["status"]) => {
    const styles: Record<TicketItem["status"], string> = {
      Open: "bg-primary/10 text-primary border-primary/30",
      Resolved: "bg-success/10 text-success border-success/30",
      Pending: "bg-warning/15 text-warning-foreground border-warning/30",
    };
    return <Badge className={`border ${styles[status]}`}>{status}</Badge>;
  };

  const renderSection = () => {
    if (activeSection === "overview") {
      return (
        <div className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {summary.map((item) => (
                  <div key={item.label} className="rounded-2xl border border-border bg-card shadow-card p-4">
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-2xl md:text-3xl font-bold text-foreground">{item.value}</span>
                      <span className="text-xs text-muted-foreground">{item.hint}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_1fr] gap-4">
                <div className="rounded-2xl border border-border bg-card shadow-card">
                  <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div>
                      <h3 className="font-semibold text-foreground">Upcoming</h3>
                      <p className="text-xs text-muted-foreground">Keep track of your next commitments</p>
                </div>
                    <Badge className="border border-border bg-muted text-foreground">{bookings.length} items</Badge>
              </div>
                  <div className="p-4 space-y-3">
                {bookings.map((booking) => (
                  <div
                    key={`${booking.title}-${booking.date}`}
                        className="flex items-start justify-between gap-3 rounded-xl border border-border/60 bg-muted/60 px-3 py-3"
                  >
                    <div>
                          <p className="font-semibold text-foreground">{booking.title}</p>
                          <p className="text-sm text-muted-foreground">{booking.details}</p>
                          <p className="text-xs text-muted-foreground">{booking.date}</p>
                    </div>
                    {renderStatusBadge(booking.status)}
                  </div>
                ))}
              </div>
            </div>

                <div className="rounded-2xl border border-border bg-card shadow-card">
                  <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div>
                      <h3 className="font-semibold text-foreground">Profile snapshot</h3>
                      <p className="text-xs text-muted-foreground">Basic details for your account</p>
                </div>
                {user?.isVerified ? (
                      <Badge className="border bg-success/10 text-success">Verified</Badge>
                ) : (
                      <Badge className="border bg-warning/15 text-warning-foreground">Unverified</Badge>
                )}
              </div>
              <div className="p-4 space-y-3">
                {personalDetails.map((item) => (
                      <div key={item.label} className="flex items-center gap-3 rounded-xl border border-border/60 px-3 py-2.5 bg-muted/60">
                        <item.icon size={16} className="text-muted-foreground" />
                    <div>
                          <p className="text-xs text-muted-foreground">{item.label}</p>
                          <p className="text-sm font-semibold text-foreground">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (activeSection === "bookings") {
      return (
        <div className="rounded-2xl border border-border bg-card shadow-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <h3 className="font-semibold text-foreground">{isStudent ? "My bookings" : "Bookings"}</h3>
              <p className="text-xs text-muted-foreground">Manage and track your reservations</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="border-border text-foreground">
                <CalendarCheck size={16} className="mr-2" />
                New booking
              </Button>
              <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                View calendar
              </Button>
            </div>
          </div>
          <div className="p-4 space-y-3">
            {bookings.map((booking) => (
              <div
                key={`${booking.title}-${booking.date}`}
                className="rounded-xl border border-border p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-card"
              >
                <div className="space-y-1">
                  <p className="font-semibold text-foreground">{booking.title}</p>
                  <p className="text-sm text-muted-foreground">{booking.details}</p>
                  <p className="text-xs text-muted-foreground">{booking.date}</p>
                </div>
                <div className="flex items-center gap-3">
                  {renderStatusBadge(booking.status)}
                  <Button variant="ghost" size="sm" className="text-foreground">
                    Manage
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (activeSection === "tickets") {
      return (
        <div className="rounded-2xl border border-border bg-card shadow-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <h3 className="font-semibold text-foreground">Tickets</h3>
              <p className="text-xs text-muted-foreground">Support and access requests</p>
            </div>
            <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Raise ticket
            </Button>
          </div>
          <div className="p-4 space-y-3">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="rounded-xl border border-border p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-card">
                <div className="space-y-1">
                  <p className="font-semibold text-foreground">{ticket.subject}</p>
                  <p className="text-xs text-muted-foreground">{ticket.id} - {ticket.channel}</p>
                  <p className="text-xs text-muted-foreground">Updated {ticket.updated}</p>
                </div>
                {renderTicketBadge(ticket.status)}
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (activeSection === "profile") {
      return (
        <div className="rounded-2xl border border-border bg-card shadow-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <h3 className="font-semibold text-foreground">Edit profile</h3>
              <p className="text-xs text-muted-foreground">Update how others see you</p>
            </div>
            {saveState === "saved" && <Badge className="border bg-emerald-50 text-emerald-700">Saved</Badge>}
          </div>
          <form className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleSaveProfile}>
            <div className="space-y-2 md:col-span-2">
              <p className="text-sm text-foreground">Profile image</p>
              <div className="flex flex-wrap items-center gap-3">
                <Avatar className="h-14 w-14 border-2 border-primary/50">
                  <AvatarImage src={avatarPreview || user?.profilePicture} alt={user?.firstName} />
                  <AvatarFallback className="bg-muted text-foreground font-semibold">{getInitials()}</AvatarFallback>
                </Avatar>
                <div className="flex items-center gap-3">
                  <Button type="button" variant="outline" className="border-border text-foreground" onClick={triggerAvatarUpload}>
                    Upload new
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                  <span className="text-xs text-muted-foreground max-w-[220px] truncate" title={avatarName}>
                    {avatarName}
                  </span>
                </div>
              </div>
            </div>
            <label className="space-y-1 text-sm text-foreground">
              First name
              <input
                className="mt-1 w-full rounded-lg border border-border bg-muted/50 px-3 py-2 focus:border-primary focus:outline-none"
                value={profileForm.firstName}
                onChange={(e) => setProfileForm((prev) => ({ ...prev, firstName: e.target.value }))}
                placeholder="First name"
              />
            </label>
            <label className="space-y-1 text-sm text-foreground">
              Last name
              <input
                className="mt-1 w-full rounded-lg border border-border bg-muted/50 px-3 py-2 focus:border-primary focus:outline-none"
                value={profileForm.lastName}
                onChange={(e) => setProfileForm((prev) => ({ ...prev, lastName: e.target.value }))}
                placeholder="Last name"
              />
            </label>
            <label className="space-y-1 text-sm text-foreground">
              Phone number
              <input
                className="mt-1 w-full rounded-lg border border-border bg-muted/50 px-3 py-2 focus:border-primary focus:outline-none"
                value={profileForm.phoneNumber}
                onChange={(e) => setProfileForm((prev) => ({ ...prev, phoneNumber: e.target.value }))}
                placeholder="Add your contact"
              />
            </label>
            <label className="space-y-1 text-sm text-foreground">
              Department or program
              <input
                className="mt-1 w-full rounded-lg border border-border bg-muted/50 px-3 py-2 focus:border-primary focus:outline-none"
                value={profileForm.department}
                onChange={(e) => setProfileForm((prev) => ({ ...prev, department: e.target.value }))}
                placeholder={isStudent ? "Course of study" : "Team or unit"}
              />
            </label>
            <div className="md:col-span-2 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                className="border-border text-foreground"
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
              <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save changes"}
              </Button>
            </div>
            <p className="md:col-span-2 text-xs text-muted-foreground">Changes save to your profile. Fresh uploads may take a moment to refresh.</p>
          </form>
        </div>
      );
    }

    return (
      <div className="rounded-2xl border border-border bg-card shadow-card">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <h3 className="font-semibold text-foreground">Preferences</h3>
            <p className="text-xs text-muted-foreground">Notification and theme settings</p>
          </div>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between rounded-xl border border-border p-3 bg-card">
            <div>
              <p className="font-semibold text-foreground">Email notifications</p>
              <p className="text-xs text-muted-foreground">Receive booking and ticket updates</p>
            </div>
            <Badge className="border bg-muted text-foreground">On</Badge>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-border p-3 bg-card">
            <div>
              <p className="font-semibold text-foreground">SMS alerts</p>
              <p className="text-xs text-muted-foreground">Keep delivery only for urgent items</p>
            </div>
            <Badge className="border bg-muted text-muted-foreground">Off</Badge>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-border p-3 bg-card">
            <div className="flex items-center gap-2">
              <Moon size={16} className="text-muted-foreground" />
              <div>
                <p className="font-semibold text-foreground">Appearance</p>
                <p className="text-xs text-muted-foreground">Light / dark theme</p>
              </div>
            </div>
            <Badge className="border bg-muted text-foreground">Auto</Badge>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex bg-sidebar text-sidebar-foreground">
      <aside className="w-72 hidden lg:flex flex-col h-screen border-r border-sidebar-border/70 shadow-[6px_0_22px_-8px_hsl(var(--foreground)/0.35)] bg-sidebar px-4 py-6">
        <div className="flex items-center gap-3 pb-6 border-b border-sidebar-border/70">
          <Avatar className="h-12 w-12 border-2 border-sidebar-primary">
            <AvatarImage src={avatarPreview || user?.profilePicture} alt={user?.firstName} />
            <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground font-semibold">{getInitials()}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-white text-sm leading-tight">{user?.firstName} {user?.lastName}</p>
            <p className="text-xs text-sidebar-foreground/80">@{username}</p>
            <div className="mt-1 flex items-center gap-2">
              <Badge className="border border-white/20 bg-white/10 text-white">{roleLabel}</Badge>
              {user?.isVerified && <ShieldCheck size={14} className="text-success" />}
            </div>
          </div>
        </div>

        <nav className="mt-4 space-y-1 text-sm flex-1">
          {sectionList.map((item) => {
            const active = activeSection === item.id;
            return (
              <button
                key={item.id}
                className={`w-full rounded-xl px-3 py-2.5 flex items-center gap-2 transition text-left ${
                  active
                    ? "bg-white text-primary font-semibold shadow-md"
                    : "text-sidebar-foreground hover:bg-white/10 hover:text-white"
                }`}
                onClick={() => setActiveSection(item.id)}
              >
                <item.icon size={15} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="pt-4 border-t border-sidebar-border/70 space-y-2 text-sm">
          <button
            className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-sidebar-foreground hover:bg-white/10 hover:text-white"
            onClick={() => navigate("/")}
          >
            <Home size={16} />
            Back to home
          </button>
          <button
            className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-destructive hover:bg-destructive/20"
            onClick={() => {
              logout();
              navigate("/auth/login");
            }}
          >
            Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 bg-background text-foreground min-h-screen">
        <div className="py-10 px-4 md:px-8">
          <div className="mx-auto max-w-6xl space-y-6">
            <section className="rounded-2xl border border-border shadow-card bg-card overflow-hidden">
              <div className="bg-gradient-to-r from-primary to-secondary px-4 md:px-6 py-5">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-white/80 text-xs">Welcome back</p>
                    <h1 className="text-xl md:text-2xl font-semibold text-white">{user?.firstName} {user?.lastName}</h1>
                    <p className="text-sm text-white/80">{roleLabel} dashboard for bookings and tickets</p>
                    <div className="flex items-center gap-2">
                      <Badge className="border border-white/30 bg-white/10 text-white">{roleLabel}</Badge>
                      <Badge className={`border border-white/30 bg-white/10 ${user?.isVerified ? "text-emerald-100" : "text-amber-100"}`}>
                        {user?.isVerified ? "Verified" : "Unverified"}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" className="bg-white text-primary hover:bg-secondary/90">
                      <CalendarDays size={16} className="mr-2" />
                      Book a space
                    </Button>
                    <Button variant="secondary" className="bg-white text-primary hover:bg-secondary/90">
                      <Ticket size={16} className="mr-2" />
                      Raise ticket
                    </Button>
                  </div>
                </div>
              </div>
            </section>

            {renderSection()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
