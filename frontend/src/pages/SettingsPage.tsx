import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { toast } from "react-toastify";
import { Lock, Bell, Shield, User } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import authService from "@/services/authService";

const SettingsPage = () => {
  const { user } = useAuth();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpSent, setOtpSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [sendingCode, setSendingCode] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const timer = setTimeout(() => setResendTimer((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendTimer]);

  const handleSendOtp = async () => {
    if (!user?.email) {
      toast.error("Email not available for this account");
      return;
    }

    setSendingCode(true);
    try {
      const response = await authService.forgotPassword({ email: user.email });
      if (response.data.success) {
        toast.success(response.data.message || "Verification code sent to your email");
        setOtp(["", "", "", "", "", ""]);
        setOtpSent(true);
        setResendTimer(60);
        inputRefs.current[0]?.focus();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Could not send verification code");
    } finally {
      setSendingCode(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^[0-9]*$/.test(value)) return;
    const nextOtp = [...otp];
    nextOtp[index] = value.slice(-1);
    setOtp(nextOtp);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const nextOtp = [...otp];
    pasted.split("").forEach((char, i) => {
      if (i < 6) nextOtp[i] = char;
    });
    setOtp(nextOtp);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");

    if (!otpSent) {
      toast.error("Send a verification code first");
      return;
    }

    if (code.length !== 6) {
      toast.error("Enter the 6-digit code we emailed you");
      return;
    }

    if (!newPassword || !confirmPassword) {
      toast.error("Please fill in all password fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    if (!user?.email) {
      toast.error("Email not available for this account");
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
        toast.success(response.data.message || "Password updated successfully");
        setNewPassword("");
        setConfirmPassword("");
        setOtp(["", "", "", "", "", ""]);
        setOtpSent(false);
        setResendTimer(0);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update password");
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleSaveNotifications = () => {
    // TODO: Save notification preferences to backend
    toast.success("Notification preferences saved successfully");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Settings</h1>
            <p className="text-gray-600">Manage your account settings and preferences</p>
          </div>

          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  <CardTitle>Account Information</CardTitle>
                </div>
                <CardDescription>View your account details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Full Name</Label>
                  <Input value={`${user?.firstName} ${user?.lastName}`} disabled className="bg-gray-50" />
                </div>
                <div>
                  <Label>Email Address</Label>
                  <Input value={user?.email || ""} disabled className="bg-gray-50" />
                </div>
                <div>
                  <Label>Role</Label>
                  <Input
                    value={user?.role?.split("_").map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(" ")}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-primary" />
                  <CardTitle>Change Password</CardTitle>
                </div>
                <CardDescription>Send a one-time code to your email, then set a new password</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 text-sm text-primary-foreground">
                    <p className="text-primary font-semibold">Secure update</p>
                    <p className="text-primary/80">We will email a 6-digit verification code to {user?.email || "your email"}.</p>
                  </div>

                  <div className="flex flex-wrap items-end gap-3">
                    <div className="flex-1 min-w-[240px]">
                      <Label>Verification Code</Label>
                      <div className="flex gap-2" onPaste={handleOtpPaste}>
                        {otp.map((digit, index) => (
                          <Input
                            key={index}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleOtpChange(index, e.target.value)}
                            onKeyDown={(e) => handleOtpKeyDown(index, e)}
                            ref={(el) => (inputRefs.current[index] = el)}
                            className="w-12 h-12 text-center text-lg"
                            aria-label={`OTP digit ${index + 1}`}
                          />
                        ))}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleSendOtp}
                      disabled={sendingCode || !user?.email || (otpSent && resendTimer > 0)}
                      className="min-w-[160px]"
                    >
                      {sendingCode
                        ? "Sending..."
                        : otpSent && resendTimer > 0
                          ? `Resend in ${resendTimer}s`
                          : otpSent
                            ? "Resend code"
                            : "Send code"}
                    </Button>
                  </div>

                  <div>
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={updatingPassword}>
                    {updatingPassword ? "Updating..." : "Update Password"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  <CardTitle>Notification Preferences</CardTitle>
                </div>
                <CardDescription>Manage how you receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-notifications" className="text-base">
                      Email Notifications
                    </Label>
                    <p className="text-sm text-gray-500">Receive notifications via email</p>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="push-notifications" className="text-base">
                      Push Notifications
                    </Label>
                    <p className="text-sm text-gray-500">Receive push notifications in your browser</p>
                  </div>
                  <Switch
                    id="push-notifications"
                    checked={pushNotifications}
                    onCheckedChange={setPushNotifications}
                  />
                </div>

                <Button onClick={handleSaveNotifications} className="w-full">
                  Save Preferences
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <CardTitle>Security</CardTitle>
                </div>
                <CardDescription>Keep your account secure</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Two-Factor Authentication</p>
                      <p className="text-sm text-gray-500">Add an extra layer of security</p>
                    </div>
                    <Button variant="outline" disabled>
                      Coming Soon
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Active Sessions</p>
                      <p className="text-sm text-gray-500">Manage your active login sessions</p>
                    </div>
                    <Button variant="outline" disabled>
                      Coming Soon
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default SettingsPage;