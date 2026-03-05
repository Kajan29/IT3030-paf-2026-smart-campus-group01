import { GraduationCap, BookOpen, Users } from "lucide-react";

const AuthHeroPanel = () => {
  return (
    <div className="auth-hero">
      <div className="hero-header">
        <div className="hero-logo-wrapper">
          <div className="hero-logo-box">
            <GraduationCap size={28} className="hero-logo-icon" />
          </div>
          <h1 className="hero-title">Zentaritas</h1>
        </div>
        <p className="hero-subtitle">University Platform & Management</p>
      </div>

      <div className="hero-content">
        <h2 className="hero-main-title">
          Empowering
          <br />
          <span className="hero-accent">Academic</span>
          <br />
          Excellence
        </h2>
        <p className="hero-description">
          A comprehensive platform designed to streamline university operations, enhance learning experiences, and connect the academic community.
        </p>

        <div className="hero-features">
          {[
            { icon: BookOpen, label: "Smart Course Management" },
            { icon: Users, label: "Student & Faculty Portal" },
            { icon: GraduationCap, label: "Academic Records & Analytics" },
          ].map((item, i) => (
            <div key={item.label} className="hero-feature-item">
              <div className="feature-icon-box">
                <item.icon size={20} className="feature-icon" />
              </div>
              <span className="feature-label">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="hero-footer">
        © 2026 Zentaritas University. All rights reserved.
      </p>
    </div>
  );
};

export default AuthHeroPanel;
