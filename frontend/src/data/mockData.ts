import type { User, StatCard, QuickAction, Notification } from "@/types/dashboard";

export const mockUsers: User[] = [
  { id: "1", name: "Alice Johnson", email: "alice@unihub.edu", role: "Admin", status: "Active", avatar: "AJ", joinedDate: "2024-01-15" },
  { id: "2", name: "Bob Martinez", email: "bob@unihub.edu", role: "Student", status: "Active", avatar: "BM", joinedDate: "2024-02-20" },
  { id: "3", name: "Carol Smith", email: "carol@unihub.edu", role: "Faculty", status: "Active", avatar: "CS", joinedDate: "2023-09-05" },
  { id: "4", name: "David Lee", email: "david@unihub.edu", role: "Staff", status: "Blocked", avatar: "DL", joinedDate: "2023-11-10" },
  { id: "5", name: "Emma Wilson", email: "emma@unihub.edu", role: "Student", status: "Active", avatar: "EW", joinedDate: "2024-03-01" },
  { id: "6", name: "Frank Brown", email: "frank@unihub.edu", role: "Student", status: "Pending", avatar: "FB", joinedDate: "2024-03-15" },
  { id: "7", name: "Grace Chen", email: "grace@unihub.edu", role: "Faculty", status: "Active", avatar: "GC", joinedDate: "2023-08-20" },
  { id: "8", name: "Henry Park", email: "henry@unihub.edu", role: "Staff", status: "Active", avatar: "HP", joinedDate: "2024-01-30" },
];

export const mockStats: StatCard[] = [
  { id: "1", title: "Total Users", value: 8492, growth: 12.5, icon: "Users", gradient: "gradient-primary" },
  { id: "2", title: "Active Bookings", value: 342, growth: 8.2, icon: "Calendar", gradient: "gradient-info" },
  { id: "3", title: "Upcoming Events", value: 28, growth: -3.1, icon: "Star", gradient: "gradient-warning" },
  { id: "4", title: "Sports Registrations", value: 1204, growth: 21.3, icon: "Trophy", gradient: "gradient-success" },
  { id: "5", title: "Media Posts", value: 567, growth: 15.8, icon: "FileImage", gradient: "gradient-red" },
  { id: "6", title: "System Alerts", value: 3, growth: -50.0, icon: "AlertTriangle", gradient: "gradient-warning" },
];

export const mockQuickActions: QuickAction[] = [
  { id: "1", label: "Add User", icon: "UserPlus", gradient: "gradient-primary", description: "Register a new university member" },
  { id: "2", label: "Create Tournament", icon: "Trophy", gradient: "gradient-success", description: "Schedule a new sports event" },
  { id: "3", label: "Publish Event", icon: "Megaphone", gradient: "gradient-warning", description: "Announce a campus event" },
  { id: "4", label: "AI Poster", icon: "Sparkles", gradient: "gradient-red", description: "Generate promotional poster" },
  { id: "5", label: "View Reports", icon: "BarChart3", gradient: "gradient-info", description: "Access analytics dashboard" },
];

export const mockNotifications: Notification[] = [
  { id: "1", title: "New User Registration", message: "5 new students registered today", time: "2m ago", read: false, type: "info" },
  { id: "2", title: "Booking Conflict", message: "Hall A has a double booking on Friday", time: "15m ago", read: false, type: "warning" },
  { id: "3", title: "System Update", message: "Scheduled maintenance at 2:00 AM", time: "1h ago", read: false, type: "error" },
  { id: "4", title: "Event Published", message: "Annual Sports Day event is now live", time: "3h ago", read: true, type: "success" },
];

export const userGrowthData = [
  { month: "Jul", users: 5200 },
  { month: "Aug", users: 5800 },
  { month: "Sep", users: 6400 },
  { month: "Oct", users: 6900 },
  { month: "Nov", users: 7200 },
  { month: "Dec", users: 7600 },
  { month: "Jan", users: 7900 },
  { month: "Feb", users: 8200 },
  { month: "Mar", users: 8492 },
];

export const bookingDistribution = [
  { name: "Sports Hall", value: 35, color: "#0f3460" },
  { name: "Conference Rooms", value: 25, color: "#e53935" },
  { name: "Auditorium", value: 20, color: "#2196f3" },
  { name: "Labs", value: 12, color: "#4caf50" },
  { name: "Others", value: 8, color: "#ff9800" },
];

export const eventsPerMonth = [
  { month: "Sep", events: 8 },
  { month: "Oct", events: 12 },
  { month: "Nov", events: 10 },
  { month: "Dec", events: 15 },
  { month: "Jan", events: 7 },
  { month: "Feb", events: 11 },
  { month: "Mar", events: 14 },
];
