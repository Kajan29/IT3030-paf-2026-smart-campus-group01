import type { ReactNode } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Line,
} from "recharts";
import { bookingDistribution, eventsPerMonth, userGrowthData } from "@/data/mockData";

const growthSeries = userGrowthData.map((point, index) => {
  const previous = index === 0 ? point.users - 220 : userGrowthData[index - 1].users;
  return {
    month: point.month,
    totalUsers: point.users,
    newUsers: Math.max(point.users - previous, 0),
  };
});

const eventSeries = eventsPerMonth.map((point) => ({
  ...point,
  target: 12,
  registrations: point.events * 21,
}));

const totalBookings = bookingDistribution.reduce((sum, item) => sum + item.value, 0);

const Card = ({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) => (
  <article className="glass-card rounded-2xl p-5">
    <header className="mb-4">
      <h3 className="font-semibold text-foreground">{title}</h3>
      <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
    </header>
    {children}
  </article>
);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl border border-border/80 bg-card/95 px-3 py-2 shadow-card-hover">
      <p className="text-xs font-semibold text-foreground mb-1">{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.name} className="text-xs" style={{ color: entry.color }}>
          {entry.name}: {entry.value.toLocaleString()}
        </p>
      ))}
    </div>
  );
};

export const ChartsSection = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2">
        <Card title="User Growth and Intake" subtitle="Total registered users and monthly additions">
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={growthSeries} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="usersFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--info))" stopOpacity={0.42} />
                  <stop offset="100%" stopColor="hsl(var(--info))" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="intakeFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity={0.38} />
                  <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity={0.04} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
              <Area type="monotone" dataKey="totalUsers" name="Total Users" stroke="hsl(var(--info))" fill="url(#usersFill)" strokeWidth={2.6} />
              <Area type="monotone" dataKey="newUsers" name="New Users" stroke="hsl(var(--success))" fill="url(#intakeFill)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card title="Facility Usage Mix" subtitle="Share of active bookings by venue category">
        <div className="relative">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={bookingDistribution}
                dataKey="value"
                nameKey="name"
                innerRadius={62}
                outerRadius={92}
                paddingAngle={3}
                cx="50%"
                cy="47%"
              >
                {bookingDistribution.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} strokeWidth={0} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => [`${value}%`, "Usage"]} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute left-1/2 top-[44%] -translate-x-1/2 -translate-y-1/2 text-center">
            <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Total</p>
            <p className="text-lg font-bold text-foreground">{totalBookings}%</p>
          </div>
        </div>
      </Card>

      <div className="lg:col-span-3">
        <Card title="Events vs Target" subtitle="Monthly event count with operational target and registrations">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={eventSeries} margin={{ top: 8, right: 12, left: -16, bottom: 0 }} barSize={20}>
              <defs>
                <linearGradient id="eventsBar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.65} />
                </linearGradient>
                <linearGradient id="registrationsBar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--warning))" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="hsl(var(--warning))" stopOpacity={0.68} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
              <Bar yAxisId="left" dataKey="events" name="Events" fill="url(#eventsBar)" radius={[6, 6, 0, 0]} />
              <Bar yAxisId="right" dataKey="registrations" name="Registrations" fill="url(#registrationsBar)" radius={[6, 6, 0, 0]} />
              <Line yAxisId="left" type="monotone" dataKey="target" name="Target" stroke="hsl(var(--success))" strokeWidth={2.2} dot={false} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
};
