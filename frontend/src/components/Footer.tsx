import { GraduationCap } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="bg-primary py-12">
    <div className="container mx-auto px-4">
      <div className="grid md:grid-cols-3 gap-8 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <GraduationCap className="h-6 w-6 text-accent" />
            <span className="font-display text-lg font-bold text-primary-foreground">Zentaritas</span>
          </div>
          <p className="text-sm text-primary-foreground/60">
            Empowering minds, shaping futures. A leading institution committed to academic excellence.
          </p>
        </div>
        <div>
          <h4 className="font-display font-semibold text-primary-foreground mb-3">Quick Links</h4>
          <div className="flex flex-col gap-2">
            <Link to="/" className="text-sm text-primary-foreground/60 hover:text-accent transition-colors">Home</Link>
            <Link to="/resources" className="text-sm text-primary-foreground/60 hover:text-accent transition-colors">Resources</Link>
            <Link to="/contact" className="text-sm text-primary-foreground/60 hover:text-accent transition-colors">Contact</Link>
          </div>
        </div>
        <div>
          <h4 className="font-display font-semibold text-primary-foreground mb-3">Contact Info</h4>
          <p className="text-sm text-primary-foreground/60">Zentaritas University Campus</p>
          <p className="text-sm text-primary-foreground/60">info@zentaritas.edu</p>
          <p className="text-sm text-primary-foreground/60">+94 11 234 5678</p>
        </div>
      </div>
      <div className="border-t border-primary-foreground/10 pt-6 text-center">
        <p className="text-xs text-primary-foreground/40">© 2026 Zentaritas University. All rights reserved.</p>
      </div>
    </div>
  </footer>
);

export default Footer;
