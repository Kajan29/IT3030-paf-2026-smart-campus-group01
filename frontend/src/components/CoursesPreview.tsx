import { motion } from "framer-motion";
import {
  CalendarCheck,
  BookOpen,
  FileText,
  TicketCheck,
  Search,
  Bell,
  ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";

const features = [
  {
    icon: CalendarCheck,
    title: "Smart Room Booking",
    desc: "Reserve lecture halls, labs, and study rooms with real-time availability checks and instant confirmation.",
    color: "from-emerald-500/20 to-green-600/20",
    iconColor: "text-emerald-700",
    link: "/book-room",
  },
  {
    icon: BookOpen,
    title: "Course Management",
    desc: "Browse available classes, view schedules, and stay organized with your academic calendar.",
    color: "from-emerald-500/20 to-teal-500/20",
    iconColor: "text-emerald-600",
    link: "/resources",
  },
  {
    icon: FileText,
    title: "Digital Resources",
    desc: "Access lecture notes, slides, research papers, and study materials anytime, anywhere.",
    color: "from-teal-500/20 to-emerald-500/20",
    iconColor: "text-teal-700",
    link: "/resources",
  },
  {
    icon: TicketCheck,
    title: "Support Tickets",
    desc: "Submit and track support requests for IT, facilities, or academic issues with ease.",
    color: "from-orange-500/20 to-amber-500/20",
    iconColor: "text-orange-600",
    link: "/my-tickets",
  },
  {
    icon: Search,
    title: "Room Finder",
    desc: "Quickly locate available rooms across campus with interactive maps and filters.",
    color: "from-lime-500/20 to-green-500/20",
    iconColor: "text-lime-700",
    link: "/find-room",
  },
  {
    icon: Bell,
    title: "Smart Notifications",
    desc: "Stay updated with real-time alerts for bookings, approvals, and important announcements.",
    color: "from-rose-500/20 to-pink-500/20",
    iconColor: "text-rose-600",
    link: "/settings",
  },
];

const FeaturesSection = () => (
  <section id="features-section" className="py-24 bg-muted/30 relative overflow-hidden">
    {/* Decorative bg shapes */}
    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
    <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2" />

    <div className="container mx-auto px-4 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center mb-16"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-accent" />
          <span className="text-sm font-medium text-accent tracking-wide uppercase">Platform Features</span>
        </div>
        <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
          Everything You Need,{" "}
          <span className="text-gradient">One Platform</span>
        </h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          A unified platform for students and staff to manage their academic life —
          from room bookings to course materials.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
          >
            <Link to={f.link} className="block h-full">
              <div className="group h-full glass-card rounded-2xl p-7 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-border/60 bg-card/80 backdrop-blur-md">
                {/* Icon */}
                <div
                  className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${f.color} mb-5 group-hover:scale-110 transition-transform duration-300`}
                >
                  <f.icon className={`h-7 w-7 ${f.iconColor}`} />
                </div>

                {/* Content */}
                <h3 className="font-display text-xl font-semibold text-foreground mb-3 group-hover:text-primary transition-colors">
                  {f.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                  {f.desc}
                </p>

                {/* Link arrow */}
                <div className="flex items-center gap-1.5 text-sm font-medium text-accent opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-0 group-hover:translate-x-1">
                  Learn more
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default FeaturesSection;
