import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail, CheckCircle } from "lucide-react";
import AuthHeroPanel from "../../components/common/AuthHeroPanel";
import authService from "../../services/authService";
import { toast } from "react-toastify";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setLoading(true);
    try {
      // Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      setSent(true);
      toast.success("Password reset link sent to your email!");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to send reset link. Please try again.");
    } finally {
      setLoading(false);
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

          {!sent ? (
            <>
              <div className="mb-10">
                <div className="icon-wrapper mb-6">
                  <Mail size={40} className="icon-primary" />
                </div>
                <h2 className="auth-title">Forgot Password?</h2>
                <p className="auth-subtitle">
                  No worries! Enter your email address and we'll send you a reset link.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
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
                    "Send Reset Link"
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="success-message">
              <div className="icon-wrapper icon-wrapper-success mb-6">
                <CheckCircle size={40} className="icon-success" />
              </div>
              <h2 className="auth-title mb-3">
                Check Your Email
              </h2>
              <p className="auth-subtitle mb-2">
                We've sent a password reset link to
              </p>
              <p className="email-display mb-8">{email}</p>
              <p className="small-text mb-6">
                Didn't receive the email? Check your spam folder or{" "}
                <button
                  onClick={() => setSent(false)}
                  className="auth-link"
                >
                  try again
                </button>
              </p>
              <Link
                to="/auth/login"
                className="btn-primary-uni inline-flex items-center justify-center gap-2 px-8"
              >
                Back to Login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
