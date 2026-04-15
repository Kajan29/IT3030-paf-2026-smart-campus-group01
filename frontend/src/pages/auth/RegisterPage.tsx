import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, UserPlus, ArrowLeft } from "lucide-react";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
import AuthHeroPanel from "../../components/common/AuthHeroPanel";
import authService from "../../services/authService";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_PATTERN = /^[A-Za-z][A-Za-z\s'-]{1,49}$/;
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

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

const RegisterPage = () => {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { googleLogin } = useAuth();
  const hasGoogleClientId = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

  const updateForm = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const firstName = form.firstName.trim();
    const lastName = form.lastName.trim();
    const email = form.email.trim().toLowerCase();
    const password = form.password;
    const confirmPassword = form.confirmPassword;

    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    if (!NAME_PATTERN.test(firstName)) {
      toast.error("First name must be 2-50 letters and can include spaces, apostrophes, or hyphens");
      return;
    }

    if (!NAME_PATTERN.test(lastName)) {
      toast.error("Last name must be 2-50 letters and can include spaces, apostrophes, or hyphens");
      return;
    }

    if (!EMAIL_PATTERN.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (!PASSWORD_PATTERN.test(password)) {
      toast.error("Password must be at least 8 characters and include uppercase, lowercase, and a number");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const response = await authService.register({
        firstName,
        lastName,
        email,
        password,
      });

      if (response.data.success) {
        toast.success(response.data.message || "Registration successful! Please check your email for verification code.");
        navigate("/auth/verify-otp", { state: { email } });
      }
    } catch (error: any) {
      toast.error(getApiErrorMessage(error, "Registration failed. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    try {
      if (!credentialResponse.credential) {
        toast.error("Google authentication failed");
        return;
      }

      const response = await googleLogin(credentialResponse.credential, "STUDENT");
      
      if (response.data.success) {
        toast.success("Google registration successful!");
        navigate("/");
      }
    } catch (error: any) {
      console.error("Google registration error:", error);
      toast.error(error.response?.data?.message || "Google authentication failed");
    }
  };

  const handleGoogleError = () => {
    toast.error("Google authentication failed");
  };

  return (
    <div className="auth-container">
      <AuthHeroPanel />

      <div className="auth-panel flex-1 lg:w-1/2">
        <div className="auth-content">
          {/* Back to Home Button */}
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-primary hover:text-accent transition-colors mb-6 font-medium"
          >
            <ArrowLeft size={20} />
            Back to Home
          </Link>

          <div className="mb-8">
            <div className="lg:hidden flex items-center gap-2 mb-6">
              <div className="logo-small">
                <span className="logo-letter">Z</span>
              </div>
              <span className="logo-text">Smart Campus</span>
            </div>
            <h2 className="auth-title">Create Student Account</h2>
            <p className="auth-subtitle">
              Join the Smart Campus academic community
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">First Name</label>
                <input
                  type="text"
                  value={form.firstName}
                  onChange={(e) => updateForm("firstName", e.target.value)}
                  className="input-university w-full"
                  placeholder="John"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name</label>
                <input
                  type="text"
                  value={form.lastName}
                  onChange={(e) => updateForm("lastName", e.target.value)}
                  className="input-university w-full"
                  placeholder="Doe"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => updateForm("email", e.target.value)}
                className="input-university w-full"
                placeholder="john.doe@university.edu"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => updateForm("password", e.target.value)}
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
              <label className="form-label">Confirm Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={form.confirmPassword}
                  onChange={(e) => updateForm("confirmPassword", e.target.value)}
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
                <>
                  <UserPlus size={20} />
                  Create Account
                </>
              )}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          <div className="flex justify-center">
            {hasGoogleClientId ? (
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                theme="outline"
                size="large"
                text="signup_with"
                shape="rectangular"
                width="100%"
              />
            ) : (
              <p className="text-sm text-center text-gray-500">Google Sign Up is currently unavailable.</p>
            )}
          </div>

          <p className="auth-footer-text">
            Already have an account?{" "}
            <Link to="/auth/login" className="auth-link">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
