import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, LogIn, ArrowLeft } from "lucide-react";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
import AuthHeroPanel from "../../components/common/AuthHeroPanel";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, googleLogin } = useAuth();
  const hasGoogleClientId = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const response = await login({ email, password });
      
      if (response.data.success) {
        const { token, ...userData } = response.data.data;
        
        if (!userData.isVerified) {
          toast.warning("Please verify your email first");
          navigate("/auth/verify-otp", { state: { email } });
          return;
        }
        
        toast.success(response.data.message || "Login successful!");
        
        // Redirect based on user role
        if (userData.role === "ADMIN") {
          navigate("/admin");
        } else {
          navigate("/");
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Login failed. Please try again.");
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
        const { ...userData } = response.data.data;
        toast.success("Google login successful!");
        
        // Redirect based on user role
        if (userData.role === "ADMIN") {
          navigate("/admin");
        } else {
          navigate("/");
        }
      }
    } catch (error: any) {
      console.error("Google login error:", error);
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

          <div className="mb-10">
            <div className="lg:hidden flex items-center gap-2 mb-6">
              <div className="logo-small">
                <span className="logo-letter">Z</span>
              </div>
              <span className="logo-text">Zentaritas</span>
            </div>
            <h2 className="auth-title">Welcome Back</h2>
            <p className="auth-subtitle">Sign in to your university account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="form-group">
              <label className="form-label">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-university w-full"
                placeholder="Enter your email"
              />
            </div>

            <div className="form-group">
              <div className="flex items-center justify-between mb-2">
                <label className="form-label">Password</label>
                <Link
                  to="/auth/forgot-password"
                  className="forgot-password-link"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-university w-full"
                  placeholder="Enter your password"
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

            <button
              type="submit"
              disabled={loading}
              className="btn-primary-uni w-full"
            >
              {loading ? (
                <div className="spinner" />
              ) : (
                <>
                  <LogIn size={20} />
                  Sign In
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
                text="signin_with"
                shape="rectangular"
                width="100%"
              />
            ) : (
              <p className="small-text text-center">Google Sign In is currently unavailable.</p>
            )}
          </div>

          <p className="auth-footer-text">
            Don't have an account?{" "}
            <Link to="/auth/register" className="auth-link">
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
