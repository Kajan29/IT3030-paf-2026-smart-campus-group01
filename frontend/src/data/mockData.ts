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
  { id: "1", title: "Total Buildings", value: 6, growth: 3.2, icon: "Building2", gradient: "gradient-primary" },
  { id: "2", title: "Registered Floors", value: 21, growth: 5.7, icon: "Layers", gradient: "gradient-info" },
  { id: "3", title: "Managed Rooms", value: 15, growth: 8.3, icon: "DoorOpen", gradient: "gradient-warning" },
  { id: "4", title: "Active Room Bookings", value: 418, growth: 7.1, icon: "Calendar", gradient: "gradient-success" },
  { id: "5", title: "Maintenance Tickets", value: 27, growth: -4.8, icon: "Wrench", gradient: "gradient-red" },
  { id: "6", title: "Open Alerts", value: 4, growth: -20.0, icon: "AlertTriangle", gradient: "gradient-warning" },
];

export const mockQuickActions: QuickAction[] = [
  { id: "1", label: "Add Building", icon: "Building2", gradient: "gradient-primary", description: "Create a new building profile with manager details" },
  { id: "2", label: "Add Floor", icon: "Layers", gradient: "gradient-success", description: "Register a floor and its accessibility metadata" },
  { id: "3", label: "Add Room", icon: "DoorOpen", gradient: "gradient-warning", description: "Create a room profile with facilities and capacity" },
  { id: "4", label: "Schedule Maintenance", icon: "Wrench", gradient: "gradient-red", description: "Create preventive maintenance and repair tasks" },
  { id: "5", label: "View Reports", icon: "BarChart3", gradient: "gradient-info", description: "Open building and room analytics dashboards" },
];

export const mockNotifications: Notification[] = [
  { id: "1", title: "New Registrations", message: "12 new students completed onboarding today", time: "4m ago", read: false, type: "info" },
  { id: "2", title: "Venue Conflict", message: "Auditorium B has overlapping bookings for Tuesday", time: "18m ago", read: false, type: "warning" },
  { id: "3", title: "Security Alert", message: "Two blocked sign-in attempts from unknown IPs", time: "57m ago", read: false, type: "error" },
  { id: "4", title: "Report Ready", message: "March attendance summary is available for download", time: "2h ago", read: true, type: "success" },
];

export const userGrowthData = [
  { month: "Aug", users: 6400 },
  { month: "Sep", users: 7020 },
  { month: "Oct", users: 7510 },
  { month: "Nov", users: 8040 },
  { month: "Dec", users: 8420 },
  { month: "Jan", users: 9010 },
  { month: "Feb", users: 9640 },
  { month: "Mar", users: 10124 },
];

export const bookingDistribution = [
  { name: "Lecture Halls", value: 32, color: "#0f3460" },
  { name: "Conference Rooms", value: 24, color: "#e53935" },
  { name: "Auditorium", value: 19, color: "#2196f3" },
  { name: "Labs", value: 15, color: "#4caf50" },
  { name: "Other Facilities", value: 10, color: "#ff9800" },
];

export const eventsPerMonth = [
  { month: "Oct", events: 10 },
  { month: "Nov", events: 12 },
  { month: "Dec", events: 11 },
  { month: "Jan", events: 13 },
  { month: "Feb", events: 14 },
  { month: "Mar", events: 16 },
  { month: "Apr", events: 15 },
];
