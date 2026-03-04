import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, UserPlus, Upload, X } from "lucide-react";
import AuthHeroPanel from "../../components/common/AuthHeroPanel";
import authService from "../../services/authService";
import { toast } from "react-toastify";

const RegisterPage = () => {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [idCard, setIdCard] = useState<File | null>(null);
  const [idCardPreview, setIdCardPreview] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const updateForm = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleIdCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be under 5MB");
        return;
      }
      setIdCard(file);
      const reader = new FileReader();
      reader.onloadend = () => setIdCardPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const removeIdCard = () => {
    setIdCard(null);
    setIdCardPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { firstName, lastName, email, phone, password, confirmPassword } = form;

    if (!firstName || !lastName || !email || !phone || !password || !confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (!idCard) {
      toast.error("Please upload your ID card");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("firstName", firstName);
      formData.append("lastName", lastName);
      formData.append("email", email);
      formData.append("phone", phone);
      formData.append("password", password);
      formData.append("idCard", idCard);

      await authService.register(formData);
      toast.success("Registration successful! Please verify your email.");
      navigate("/auth/verify-otp", { state: { email } });
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <AuthHeroPanel />

      <div className="auth-panel flex-1 lg:w-1/2 overflow-y-auto">
        <div className="auth-content">
          <div className="mb-8">
            <div className="lg:hidden flex items-center gap-2 mb-6">
              <div className="logo-small">
                <span className="logo-letter">Z</span>
              </div>
              <span className="logo-text">Zentaritas</span>
            </div>
            <h2 className="auth-title">Create Account</h2>
            <p className="auth-subtitle">
              Join the Zentaritas academic community
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
              <label className="form-label">Phone Number</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => updateForm("phone", e.target.value)}
                className="input-university w-full"
                placeholder="+1 (555) 000-0000"
              />
            </div>

            <div className="form-group">
              <label className="form-label">University ID Card</label>
              {!idCardPreview ? (
                <label className="id-card-upload">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleIdCardChange}
                    className="hidden"
                  />
                  <Upload size={24} className="upload-icon" />
                  <span className="upload-text">Upload ID Card</span>
                  <span className="upload-hint">PNG, JPG up to 5MB</span>
                </label>
              ) : (
                <div className="id-card-preview">
                  <img src={idCardPreview} alt="ID Card" className="preview-image" />
                  <button
                    type="button"
                    onClick={removeIdCard}
                    className="remove-button"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
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
