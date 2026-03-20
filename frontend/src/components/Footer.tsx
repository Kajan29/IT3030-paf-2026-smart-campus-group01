import { GraduationCap, Mail, Phone, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="bg-foreground text-background py-16">
    <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-10">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-lg bg-hero-gradient flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="font-heading text-xl font-bold">ZENTARITAS</span>
        </div>
        <p className="text-sm opacity-70">Empowering minds, shaping futures. A leading institution of higher education and research excellence.</p>
      </div>
      <div>
        <h4 className="font-heading font-semibold mb-4">Quick Links</h4>
        <div className="flex flex-col gap-2 text-sm opacity-70">
          <Link to="/courses" className="hover:opacity-100 transition-opacity">Courses</Link>
          <Link to="/lectures" className="hover:opacity-100 transition-opacity">Lectures</Link>
          <Link to="/bookings" className="hover:opacity-100 transition-opacity">Bookings</Link>
          <Link to="/about" className="hover:opacity-100 transition-opacity">About Us</Link>
        </div>
      </div>
      <div>
        <h4 className="font-heading font-semibold mb-4">Resources</h4>
        <div className="flex flex-col gap-2 text-sm opacity-70">
          <Link to="/contact" className="hover:opacity-100 transition-opacity">Support Tickets</Link>
          <span>Student Portal</span>
          <span>Staff Portal</span>
          <span>Research</span>
        </div>
      </div>
      <div>
        <h4 className="font-heading font-semibold mb-4">Contact</h4>
        <div className="flex flex-col gap-3 text-sm opacity-70">
          <div className="flex items-center gap-2"><Mail className="w-4 h-4" /> info@zentaritas.edu</div>
          <div className="flex items-center gap-2"><Phone className="w-4 h-4" /> +94 11 754 4801</div>
          <div className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Malabe, Sri Lanka</div>
        </div>
      </div>
    </div>
    <div className="container mx-auto px-4 mt-12 pt-8 border-t border-background/10 text-center text-sm opacity-50">
      © 2026 ZENTARITAS University. All rights reserved.
    </div>
  </footer>
);

export default Footer;
