import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, CheckCircle, Eye, EyeOff, Lock } from "lucide-react";
import AuthHeroPanel from "../../components/common/AuthHeroPanel";
import authService from "../../services/authService";
import { toast } from "react-toastify";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const getApiErrorMessage = (error: any, fallback: string) => {
  const responseData = error?.response?.data;
  const message = responseData?.message;
  const validationErrors = responseData?.data;

  if (message === "Validation failed" && validationErrors && typeof validationErrors === "object") {
    const firstValidationError = Object.values(validationErrors)[0];
    if (typeof firstValidationError === "string" && firstValidationError.trim()) {
      return firstValidationError;
    }
  }

  return message || fallback;
};

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'email' | 'verify' | 'reset'>('email');
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (step === 'verify' && resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer, step]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    
    if (!normalizedEmail) {
      toast.error("Please enter your email address");
      return;
    }

    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      const response = await authService.forgotPassword({ email: normalizedEmail });
      if (response.data.success) {
        setEmail(normalizedEmail);
        setStep('verify');
        toast.success(response.data.message || "Verification code sent to your email!");
      }
    } catch (error: any) {
      toast.error(getApiErrorMessage(error, "Failed to send verification code. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
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
    const newOtp = [...otp];
    pasted.split("").forEach((char, i) => {
      if (i < 6) newOtp[i] = char;
    });
    setOtp(newOtp);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    
    if (code.length !== 6) {
      toast.error("Please enter the complete 6-digit code");
      return;
    }

    // Move to reset password step  
    setStep('reset');
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      toast.error("Please fill in all fields");
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

    setLoading(true);
    try {
      const response = await authService.resetPassword({
        email,
        verificationCode: otp.join(""),
        newPassword,
      });

      if (response.data.success) {
        toast.success(response.data.message || "Password reset successfully!");
        navigate("/auth/login");
      }
    } catch (error: any) {
      toast.error(getApiErrorMessage(error, "Failed to reset password. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    
    try {
      const response = await authService.forgotPassword({ email });
      if (response.data.success) {
        setResendTimer(60);
        setOtp(["", "", "", "", "", ""]);
        toast.success(response.data.message || "New verification code sent!");
      }
    } catch (error: any) {
      toast.error(getApiErrorMessage(error, "Failed to resend code. Please try again."));
    }
  };

  return (
    <div className="auth-container">
      <AuthHeroPanel />

      <div className="auth-panel flex-1 lg:w-1/2">
        <div className="auth-content">
          <Link
            to="/auth/login"
            className="back-link"
          >
            <ArrowLeft size={16} />
            Back to Login
          </Link>

          {step === 'email' && (
            <>
              <div className="mb-10">
                <div className="icon-wrapper mb-6">
                  <Mail size={40} className="icon-primary" />
                </div>
                <h2 className="auth-title">Forgot Password?</h2>
                <p className="auth-subtitle">
                  No worries! Enter your email address and we'll send you a verification code.
                </p>
              </div>

              <form onSubmit={handleEmailSubmit} className="space-y-6">
                <div className="form-group">
                  <label className="form-label">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-university w-full"
                    placeholder="john.doe@university.edu"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary-uni w-full"
                >
                  {loading ? (
                    <div className="spinner" />
                  ) : (
                    "Send Verification Code"
                  )}
                </button>
              </form>
            </>
          )}

          {step === 'verify' && (
            <>
              <div className="mb-10 text-center">
                <div className="icon-wrapper mb-6 mx-auto">
                  <CheckCircle size={40} className="icon-primary" />
                </div>
                <h2 className="auth-title">Verify Code</h2>
                <p className="auth-subtitle">
                  We've sent a 6-digit verification code to
                </p>
                <p className="email-display mt-2">{email}</p>
              </div>

              <form onSubmit={handleVerifyCode} className="space-y-8">
                <div className="otp-container">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => (inputRefs.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      onPaste={handleOtpPaste}
                      className="otp-input"
                    />
                  ))}
                </div>

                <div className="text-center">
                  <p className="small-text">
                    Didn't receive the code?{" "}
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={resendTimer > 0}
                      className={resendTimer > 0 ? "resend-disabled" : "auth-link"}
                    >
                      {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend Code"}
                    </button>
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary-uni w-full"
                >
                  {loading ? (
                    <div className="spinner" />
                  ) : (
                    "Verify Code"
                  )}
                </button>
              </form>
            </>
          )}

          {step === 'reset' && (
            <>
              <div className="mb-10">
                <div className="icon-wrapper mb-6">
                  <Lock size={40} className="icon-primary" />
                </div>
                <h2 className="auth-title">Reset Password</h2>
                <p className="auth-subtitle">
                  Enter your new password
                </p>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-6">
                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="input-university w-full"
                      placeholder="At least 8 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="password-toggle"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Confirm New Password</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="input-university w-full"
                      placeholder="Re-enter password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="password-toggle"
                    >
                      {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary-uni w-full"
                >
                  {loading ? (
                    <div className="spinner" />
                  ) : (
                    "Reset Password"
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
