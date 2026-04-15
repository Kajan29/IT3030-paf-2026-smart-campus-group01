import { Save, Bell, ShieldCheck, Globe, Lock, Mail } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { useAuth } from "@/context/AuthContext";
import authService from "@/services/authService";

export const SettingsPage = () => {
  const { user } = useAuth();
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [twoFactor, setTwoFactor] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [academicYear, setAcademicYear] = useState("2025 / 2026");
  const [timeZone, setTimeZone] = useState("Asia/Colombo");
  const [websiteName, setWebsiteName] = useState("Smart Campus");
  const [supportEmail, setSupportEmail] = useState("support@smartcampus.edu");

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpSent, setOtpSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [sendingCode, setSendingCode] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("adminWebsiteSettings");
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved) as {
        emailAlerts?: boolean;
        smsAlerts?: boolean;
        twoFactor?: boolean;
        maintenanceMode?: boolean;
        academicYear?: string;
        timeZone?: string;
        websiteName?: string;
        supportEmail?: string;
      };

      setEmailAlerts(parsed.emailAlerts ?? true);
      setSmsAlerts(parsed.smsAlerts ?? false);
      setTwoFactor(parsed.twoFactor ?? true);
      setMaintenanceMode(parsed.maintenanceMode ?? false);
      setAcademicYear(parsed.academicYear ?? "2025 / 2026");
      setTimeZone(parsed.timeZone ?? "Asia/Colombo");
      setWebsiteName(parsed.websiteName ?? "Smart Campus");
      setSupportEmail(parsed.supportEmail ?? "support@smartcampus.edu");
    } catch {
      localStorage.removeItem("adminWebsiteSettings");
    }
  }, []);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const timer = setTimeout(() => setResendTimer((time) => time - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendTimer]);

  const handleSaveSettings = () => {
    localStorage.setItem(
      "adminWebsiteSettings",
      JSON.stringify({
        emailAlerts,
        smsAlerts,
        twoFactor,
        maintenanceMode,
        academicYear,
        timeZone,
        websiteName,
        supportEmail,
      })
    );
    toast.success("Admin website settings saved");
  };

  const handleSendOtp = async () => {
    if (!user?.email) {
      toast.error("Admin email not available");
      return;
    }

    setSendingCode(true);
    try {
      const response = await authService.forgotPassword({ email: user.email });
      if (response.data.success) {
        setOtp(["", "", "", "", "", ""]);
        setOtpSent(true);
        setResendTimer(60);
        inputRefs.current[0]?.focus();
        toast.success(response.data.message || "OTP sent to your email");
      }
    } catch (error: unknown) {
      const message =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      toast.error(message || "Failed to send OTP");
    } finally {
      setSendingCode(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const nextOtp = [...otp];
    nextOtp[index] = value.slice(-1);
    setOtp(nextOtp);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, event: React.KeyboardEvent) => {
    if (event.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (event: React.ClipboardEvent) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const nextOtp = [...otp];
    pasted.split("").forEach((char, i) => {
      if (i < 6) nextOtp[i] = char;
    });
    setOtp(nextOtp);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handlePasswordChange = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!user?.email) {
      toast.error("Admin email not available");
      return;
    }

    const code = otp.join("");
    if (!otpSent) {
      toast.error("Send OTP before changing password");
      return;
    }

    if (code.length !== 6) {
      toast.error("Enter the 6-digit OTP");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setUpdatingPassword(true);
    try {
      const response = await authService.resetPassword({
        email: user.email,
        verificationCode: code,
        newPassword,
      });

      if (response.data.success) {
        toast.success(response.data.message || "Admin password changed successfully");
        setNewPassword("");
        setConfirmPassword("");
        setOtp(["", "", "", "", "", ""]);
        setOtpSent(false);
        setResendTimer(0);
      }
    } catch (error: unknown) {
      const message =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      toast.error(message || "Failed to update password");
    } finally {
      setUpdatingPassword(false);
    }
  };

  return (

    <div className="space-y-6 animate-fade-in">
      <div className="rounded-2xl border border-border bg-gradient-to-r from-card via-card to-muted/30 p-5 md:p-6 shadow-card">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">Administration</p>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mt-1">Settings</h1>
            <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
              Manage website preferences, security controls, and account credentials from one place.
            </p>
          </div>
          <button
            onClick={handleSaveSettings}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl gradient-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-md"
          >
            <Save size={16} /> Save Changes
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <section className="bg-card rounded-2xl border border-border shadow-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground flex items-center gap-2"><Bell size={16} /> Notifications</h3>
            <span className="text-[11px] px-2 py-1 rounded-full bg-primary/10 text-primary font-semibold">System Alerts</span>
          </div>
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
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground flex items-center gap-2"><ShieldCheck size={16} /> Security Controls</h3>
            <span className="text-[11px] px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-600 font-semibold">Protected</span>
          </div>
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

        <section className="bg-card rounded-2xl border border-border shadow-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground flex items-center gap-2"><Globe size={16} /> Website Configuration</h3>
            <span className="text-[11px] px-2 py-1 rounded-full bg-muted text-muted-foreground font-semibold">Public Facing</span>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">Website Name</label>
            <input
              type="text"
              value={websiteName}
              onChange={(event) => setWebsiteName(event.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">Support Email</label>
            <input
              type="email"
              value={supportEmail}
              onChange={(event) => setSupportEmail(event.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">Academic Year</label>
              <select
                value={academicYear}
                onChange={(event) => setAcademicYear(event.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              >
                <option>2025 / 2026</option>
                <option>2026 / 2027</option>
                <option>2027 / 2028</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">Time Zone</label>
              <select
                value={timeZone}
                onChange={(event) => setTimeZone(event.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              >
                <option>Asia/Colombo</option>
                <option>UTC</option>
                <option>Asia/Kolkata</option>
              </select>
            </div>
          </div>
        </section>

        <section className="bg-card rounded-2xl border border-border shadow-card p-5 space-y-4 lg:col-span-2">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="font-semibold text-foreground flex items-center gap-2"><Lock size={16} /> Change Admin Password</h3>
              <p className="text-sm text-muted-foreground mt-1">
                OTP verification is required before your password can be updated.
              </p>
            </div>
            <span className="text-xs rounded-full px-2.5 py-1 bg-amber-500/10 text-amber-700 font-semibold w-fit">High Impact Action</span>
          </div>

          <div className="rounded-xl border border-border bg-muted/30 p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Send verification code</p>
              <p className="text-xs text-muted-foreground mt-0.5">Code will be sent to {user?.email || "your email"}</p>
            </div>
            <button
              onClick={handleSendOtp}
              disabled={sendingCode || resendTimer > 0}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-60"
            >
              <Mail size={16} />
              {sendingCode ? "Sending OTP..." : resendTimer > 0 ? `Resend in ${resendTimer}s` : "Send OTP"}
            </button>
          </div>

          {otpSent && (
            <p className="text-xs text-emerald-600 font-medium">OTP sent successfully. Complete verification below.</p>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground block">OTP Code</label>
              <div className="flex gap-2" onPaste={handleOtpPaste}>
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(element) => {
                      inputRefs.current[index] = element;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(event) => handleOtpChange(index, event.target.value)}
                    onKeyDown={(event) => handleOtpKeyDown(index, event)}
                    className="h-11 w-11 text-center rounded-lg border border-border bg-background text-foreground font-semibold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    aria-label={`OTP digit ${index + 1}`}
                  />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder="Minimum 8 characters"
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={updatingPassword}
              className="px-4 py-2.5 rounded-xl bg-foreground text-background text-sm font-semibold disabled:opacity-60"
            >
              {updatingPassword ? "Updating Password..." : "Change Password"}
            </button>
          </form>
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
  <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-muted/20 border border-border hover:bg-muted/30 transition-colors">
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
