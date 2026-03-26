import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import {
  Award,
  BookOpen,
  CalendarClock,
  CalendarDays,
  Edit,
  LayoutGrid,
  Mail,
  MapPin,
  Phone,
  Settings,
  Ticket,
  Trophy,
  User,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const ProfilePage = () => {
  const { user } = useAuth();

  const getInitials = () => {
    if (!user) return "U";
    return `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase();
  };

  const fullName = `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "User";
  const username = (user?.username || fullName).toString().replace(/\s+/g, "").toLowerCase();

  const personalInfo = [
    {
      label: "Email",
      value: user?.email || "Not available",
      icon: Mail,
      iconColor: "text-blue-500",
      bg: "bg-blue-50 border-blue-100",
    },
    {
      label: "Phone",
      value: user?.phoneNumber || "Not available",
      icon: Phone,
      iconColor: "text-emerald-500",
      bg: "bg-emerald-50 border-emerald-100",
    },
    {
      label: "Department",
      value: "Data Science",
      icon: BookOpen,
      iconColor: "text-violet-500",
      bg: "bg-violet-50 border-violet-100",
    },
    {
      label: "Address",
      value: "University Residence",
      icon: MapPin,
      iconColor: "text-orange-500",
      bg: "bg-orange-50 border-orange-100",
    },
    {
      label: "Date of Birth",
      value: "November 14, 2003",
      icon: CalendarDays,
      iconColor: "text-pink-500",
      bg: "bg-pink-50 border-pink-100",
    },
  ];

  const recentActivity = [
    "Booked seat Table 8 - Seat 5 in study area",
    "Booked seat Table 11 - Seat 2 in study area",
    "Booked seat Table 3 - Seat 6 in study area",
  ];

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />
      <div className="pt-24 pb-12 px-3 md:px-6">
        <div className="mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4 md:gap-6">
          <aside className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 md:p-5 h-fit lg:sticky lg:top-24">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-4">
              <Avatar className="h-10 w-10 border-2 border-orange-300">
                <AvatarImage src="" alt={user?.firstName} />
                <AvatarFallback className="bg-orange-100 text-orange-700 font-semibold">{getInitials()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-slate-900 text-sm leading-tight">{fullName}</p>
                <p className="text-xs text-slate-500">@{username}</p>
              </div>
            </div>

            <nav className="space-y-1 text-sm">
              <button className="w-full rounded-xl bg-orange-50 text-orange-600 font-medium px-3 py-2 flex items-center gap-2">
                <LayoutGrid size={15} />
                Overview
              </button>
              <button className="w-full rounded-xl text-slate-600 hover:bg-slate-50 px-3 py-2 flex items-center gap-2">
                <Edit size={15} />
                Edit Profile
              </button>
              <button className="w-full rounded-xl text-slate-600 hover:bg-slate-50 px-3 py-2 flex items-center gap-2">
                <Ticket size={15} />
                My Tickets
              </button>
              <button className="w-full rounded-xl text-slate-600 hover:bg-slate-50 px-3 py-2 flex items-center gap-2">
                <Trophy size={15} />
                Clubs & Achievements
              </button>
              <button className="w-full rounded-xl text-slate-600 hover:bg-slate-50 px-3 py-2 flex items-center gap-2">
                <CalendarDays size={15} />
                Booking History
              </button>
              <button className="w-full rounded-xl text-slate-600 hover:bg-slate-50 px-3 py-2 flex items-center gap-2">
                <Settings size={15} />
                Settings
              </button>
            </nav>

            <div className="mt-5 pt-4 border-t border-slate-100 text-sm space-y-2">
              <button className="w-full text-left text-slate-500 hover:text-slate-800 px-2 py-1">Back to Home</button>
              <button className="w-full text-left text-red-500 hover:text-red-600 px-2 py-1">Logout</button>
            </div>
          </aside>

          <main className="space-y-4 md:space-y-6">
            <section className="rounded-2xl border border-slate-200 shadow-sm bg-white overflow-hidden">
              <div className="h-16 md:h-20 bg-gradient-to-r from-indigo-600 via-violet-600 to-blue-600 px-4 md:px-6 flex items-center justify-between">
                <div>
                  <p className="text-white font-semibold text-sm md:text-base">Club Management</p>
                  <p className="text-indigo-100 text-xs md:text-sm">1 club under your management</p>
                </div>
                <Button variant="secondary" className="h-9 bg-white text-indigo-700 hover:bg-indigo-50 text-xs md:text-sm">
                  Go to Dashboard
                </Button>
              </div>

              <div className="p-3 md:p-5 space-y-4">
                <div className="relative rounded-xl overflow-hidden border border-slate-200">
                  <img
                    src="https://images.unsplash.com/photo-1562774053-701939374585?q=80&w=1400&auto=format&fit=crop"
                    alt="Campus"
                    className="h-32 md:h-44 w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/25 to-transparent" />
                </div>

                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 -mt-10 md:-mt-12 relative px-2">
                  <div className="flex items-end gap-3">
                    <Avatar className="h-20 w-20 md:h-24 md:w-24 border-4 border-white shadow-md">
                      <AvatarImage src="" alt={user?.firstName} />
                      <AvatarFallback className="bg-orange-100 text-orange-700 text-xl font-bold">{getInitials()}</AvatarFallback>
                    </Avatar>
                    <div className="pb-1">
                      <h1 className="text-xl md:text-3xl font-bold text-slate-900">{fullName}</h1>
                      <p className="text-sm text-slate-500">@{username} · Data Science</p>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge className="bg-amber-50 text-amber-700 border border-amber-200">President</Badge>
                        <Badge className="bg-orange-50 text-orange-700 border border-orange-200">Sports Club</Badge>
                      </div>
                    </div>
                  </div>
                  <Button className="rounded-full bg-orange-500 hover:bg-orange-600 text-white w-fit">
                    <Edit size={15} className="mr-2" />
                    Edit Profile
                  </Button>
                </div>
              </div>
            </section>

            <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              {[
                { label: "Club Memberships", value: "1", icon: User, color: "text-blue-500", card: "bg-blue-50 border-blue-200" },
                { label: "Achievements", value: "0", icon: Award, color: "text-amber-500", card: "bg-amber-50 border-amber-200" },
                { label: "Total Bookings", value: "7", icon: CalendarDays, color: "text-emerald-500", card: "bg-emerald-50 border-emerald-200" },
                { label: "Open Tickets", value: "0", icon: Ticket, color: "text-violet-500", card: "bg-violet-50 border-violet-200" },
              ].map((item) => (
                <div key={item.label} className={`rounded-xl border p-3 md:p-4 shadow-sm ${item.card}`}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs md:text-sm text-slate-600">{item.label}</p>
                    <item.icon size={16} className={item.color} />
                  </div>
                  <p className="text-2xl md:text-3xl font-bold text-slate-900 leading-none">{item.value}</p>
                </div>
              ))}
            </section>

            <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <article className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="border-b border-slate-100 px-4 py-3">
                  <h2 className="font-semibold text-slate-900">Personal Information</h2>
                </div>
                <div className="p-4 space-y-3">
                  {personalInfo.map((info) => (
                    <div key={info.label} className={`rounded-xl border px-3 py-2.5 ${info.bg}`}>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mb-0.5">
                        <info.icon size={13} className={info.iconColor} />
                        {info.label}
                      </div>
                      <p className="text-sm font-semibold text-slate-800">{info.value}</p>
                    </div>
                  ))}
                </div>
              </article>

              <article className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="border-b border-slate-100 px-4 py-3">
                  <h2 className="font-semibold text-slate-900">Club Memberships</h2>
                  <p className="text-xs text-slate-500">Your club affiliations and positions</p>
                </div>
                <div className="p-4">
                  <div className="rounded-xl border border-amber-300 bg-amber-50 p-3">
                    <div className="flex flex-wrap items-center gap-1.5 mb-2">
                      <Badge className="bg-orange-100 text-orange-700">Sports Club</Badge>
                      <Badge className="bg-yellow-100 text-yellow-700">Leadership</Badge>
                      <Badge className="bg-amber-100 text-amber-700">Club President</Badge>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs text-amber-800">President • Joined Mar 6, 2026</p>
                      <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white">
                        Open Dashboard
                      </Button>
                    </div>
                  </div>
                </div>
              </article>
            </section>

            <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100">
                <h2 className="font-semibold text-slate-900">Recent Activity</h2>
              </div>
              <div className="p-4 space-y-3">
                {recentActivity.map((activity, index) => (
                  <div key={activity} className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-3">
                    <p className="text-sm font-medium text-slate-800">{activity}</p>
                    <p className="mt-1 text-xs text-slate-500 flex items-center gap-1">
                      <CalendarClock size={13} />
                      3/{19 - index}/2026, 10:{54 - index * 18} AM
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </main>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ProfilePage;
