import { GraduationCap, Mail, Phone, MapPin, ArrowRight, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

const quickLinks = [
  { label: "Home", path: "/" },
  { label: "About", path: "/about" },
  { label: "Resources", path: "/resources" },
  { label: "Gallery", path: "/gallery" },
  { label: "Contact", path: "/contact" },
];

const studentLinks = [
  { label: "Book a Room", path: "/book-room" },
  { label: "Find Rooms", path: "/find-room" },
  { label: "My Tickets", path: "/my-tickets" },
  { label: "Profile", path: "/profile" },
  { label: "Settings", path: "/settings" },
];

const Footer = () => (
  <footer id="footer" className="bg-primary relative overflow-hidden">
    {/* Decorative top border */}
    <div className="h-1 w-full bg-gradient-to-r from-accent via-accent/60 to-accent" />

    {/* Background decoration */}
    <div className="absolute inset-0 opacity-5 overflow-hidden pointer-events-none">
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-accent rounded-full blur-[100px]" />
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent rounded-full blur-[80px]" />
    </div>

    <div className="container mx-auto px-4 relative z-10">
      {/* Newsletter bar */}
      <div className="py-10 border-b border-primary-foreground/10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="font-display text-xl font-semibold text-primary-foreground mb-1">
              Stay Connected
            </h3>
            <p className="text-sm text-primary-foreground/60">
              Get the latest updates about campus events and announcements.
            </p>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 md:w-72 px-4 py-2.5 rounded-lg bg-primary-foreground/10 border border-primary-foreground/15 text-primary-foreground placeholder-primary-foreground/40 text-sm focus:outline-none focus:border-accent/50 transition-colors"
            />
            <button className="px-5 py-2.5 bg-accent text-accent-foreground rounded-lg font-medium text-sm hover:bg-accent/90 transition-colors flex items-center gap-1.5">
              Subscribe
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main footer grid */}
      <div className="py-12 grid md:grid-cols-2 lg:grid-cols-4 gap-10">
        {/* Brand */}
        <div className="lg:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-accent" />
            </div>
            <span className="font-display text-xl font-bold text-primary-foreground tracking-wide">
              Smart Campus
            </span>
          </div>
          <p className="text-sm text-primary-foreground/55 leading-relaxed mb-5 max-w-xs">
            Empowering minds, shaping futures. A leading institution committed to
            academic excellence, innovation, and global impact.
          </p>
          <div className="flex gap-3">
            <a href="#" className="w-9 h-9 rounded-lg bg-primary-foreground/8 hover:bg-primary-foreground/15 flex items-center justify-center transition-colors" aria-label="Facebook">
              <ExternalLink className="h-4 w-4 text-primary-foreground/60" />
            </a>
            <a href="#" className="w-9 h-9 rounded-lg bg-primary-foreground/8 hover:bg-primary-foreground/15 flex items-center justify-center transition-colors" aria-label="Twitter">
              <ExternalLink className="h-4 w-4 text-primary-foreground/60" />
            </a>
            <a href="#" className="w-9 h-9 rounded-lg bg-primary-foreground/8 hover:bg-primary-foreground/15 flex items-center justify-center transition-colors" aria-label="LinkedIn">
              <ExternalLink className="h-4 w-4 text-primary-foreground/60" />
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="font-display font-semibold text-primary-foreground mb-4 text-sm uppercase tracking-wider">
            Quick Links
          </h4>
          <ul className="flex flex-col gap-2.5">
            {quickLinks.map((link) => (
              <li key={link.path}>
                <Link
                  to={link.path}
                  className="text-sm text-primary-foreground/55 hover:text-accent transition-colors flex items-center gap-1.5 group"
                >
                  <span className="w-1 h-1 rounded-full bg-accent/40 group-hover:bg-accent transition-colors" />
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Student Portal */}
        <div>
          <h4 className="font-display font-semibold text-primary-foreground mb-4 text-sm uppercase tracking-wider">
            Student Portal
          </h4>
          <ul className="flex flex-col gap-2.5">
            {studentLinks.map((link) => (
              <li key={link.path}>
                <Link
                  to={link.path}
                  className="text-sm text-primary-foreground/55 hover:text-accent transition-colors flex items-center gap-1.5 group"
                >
                  <span className="w-1 h-1 rounded-full bg-accent/40 group-hover:bg-accent transition-colors" />
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact Info */}
        <div>
          <h4 className="font-display font-semibold text-primary-foreground mb-4 text-sm uppercase tracking-wider">
            Contact Info
          </h4>
          <ul className="flex flex-col gap-4">
            <li className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
              <span className="text-sm text-primary-foreground/55">
                Smart Campus,<br />
                Colombo 07, Sri Lanka
              </span>
            </li>
            <li className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-accent flex-shrink-0" />
              <a href="mailto:info@smartcampus.edu" className="text-sm text-primary-foreground/55 hover:text-accent transition-colors">
                info@smartcampus.edu
              </a>
            </li>
            <li className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-accent flex-shrink-0" />
              <a href="tel:+94112345678" className="text-sm text-primary-foreground/55 hover:text-accent transition-colors">
                +94 11 234 5678
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="py-6 border-t border-primary-foreground/8 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-xs text-primary-foreground/35">
          © {new Date().getFullYear()} Smart Campus. All rights reserved.
        </p>
        <div className="flex gap-6 text-xs text-primary-foreground/35">
          <a href="#" className="hover:text-primary-foreground/60 transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-primary-foreground/60 transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-primary-foreground/60 transition-colors">Cookie Policy</a>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
