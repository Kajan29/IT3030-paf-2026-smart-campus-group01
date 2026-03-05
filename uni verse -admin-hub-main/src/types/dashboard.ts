export interface User {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "Student" | "Staff" | "Faculty";
  status: "Active" | "Blocked" | "Pending";
  avatar: string;
  joinedDate: string;
}

export interface StatCard {
  id: string;
  title: string;
  value: number;
  growth: number;
  icon: string;
  gradient: string;
}

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  badge?: number;
}

export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  gradient: string;
  description: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: "info" | "warning" | "error" | "success";
}
