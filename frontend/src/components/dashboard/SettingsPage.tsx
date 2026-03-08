import { Save, Bell, ShieldCheck, Globe, Palette } from "lucide-react";
import { useState } from "react";

export const SettingsPage = () => {
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [twoFactor, setTwoFactor] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Configure admin preferences and system behavior</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-md">
          <Save size={16} /> Save Changes
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section className="bg-card rounded-2xl border border-border shadow-card p-5 space-y-4">
          <h3 className="font-semibold text-foreground flex items-center gap-2"><Bell size={16} /> Notifications</h3>
          <SettingRow
            title="Email notifications"
            description="Receive admin alerts and daily digests via email"
            enabled={emailAlerts}
            onToggle={() => setEmailAlerts((v) => !v)}
          />
          <SettingRow
            title="SMS alerts"
            description="Get urgent security and outage alerts by SMS"
            enabled={smsAlerts}
            onToggle={() => setSmsAlerts((v) => !v)}
          />
        </section>

        <section className="bg-card rounded-2xl border border-border shadow-card p-5 space-y-4">
          <h3 className="font-semibold text-foreground flex items-center gap-2"><ShieldCheck size={16} /> Security</h3>
          <SettingRow
            title="Two-factor authentication"
            description="Require 2FA for admin logins"
            enabled={twoFactor}
            onToggle={() => setTwoFactor((v) => !v)}
          />
          <SettingRow
            title="Maintenance mode"
            description="Temporarily pause new user registrations"
            enabled={maintenanceMode}
            onToggle={() => setMaintenanceMode((v) => !v)}
          />
        </section>

        <section className="bg-card rounded-2xl border border-border shadow-card p-5 space-y-3">
          <h3 className="font-semibold text-foreground flex items-center gap-2"><Globe size={16} /> General</h3>
          <label className="block text-sm text-muted-foreground">Default Academic Year</label>
          <select className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/50 text-sm text-foreground outline-none focus:border-primary transition-all">
            <option>2025 / 2026</option>
            <option>2026 / 2027</option>
          </select>
          <label className="block text-sm text-muted-foreground">Default Time Zone</label>
          <select className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/50 text-sm text-foreground outline-none focus:border-primary transition-all">
            <option>Asia/Colombo</option>
            <option>UTC</option>
          </select>
        </section>

        <section className="bg-card rounded-2xl border border-border shadow-card p-5 space-y-3">
          <h3 className="font-semibold text-foreground flex items-center gap-2"><Palette size={16} /> Branding</h3>
          <label className="block text-sm text-muted-foreground">University Name</label>
          <input
            type="text"
            defaultValue="Zentaritas University"
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/50 text-sm text-foreground outline-none focus:border-primary transition-all"
          />
          <label className="block text-sm text-muted-foreground">Support Email</label>
          <input
            type="email"
            defaultValue="support@zentaritas.edu"
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/50 text-sm text-foreground outline-none focus:border-primary transition-all"
          />
        </section>
      </div>
    </div>
  );
};

const SettingRow = ({
  title,
  description,
  enabled,
  onToggle,
}: {
  title: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}) => (
  <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-muted/30 border border-border">
    <div>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
    <button
      onClick={onToggle}
      className={`w-12 h-7 rounded-full p-1 transition-colors ${enabled ? "bg-primary" : "bg-muted"}`}
      aria-label={title}
    >
      <span
        className={`block w-5 h-5 rounded-full bg-white transition-transform ${enabled ? "translate-x-5" : "translate-x-0"}`}
      />
    </button>
  </div>
);
