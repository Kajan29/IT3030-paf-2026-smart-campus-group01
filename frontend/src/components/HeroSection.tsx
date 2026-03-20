import { motion } from "framer-motion";
import { ArrowRight, BookOpen, Users, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import heroCampus from "@/assets/hero-campus.jpg";

const stats = [
  { icon: Users, label: "Students", value: "15,000+" },
  { icon: BookOpen, label: "Programs", value: "120+" },
  { icon: Award, label: "Awards", value: "50+" },
];

const HeroSection = () => (
  <section className="relative min-h-screen flex items-center overflow-hidden">
    <div className="absolute inset-0">
      <img src={heroCampus} alt="ZENTARITAS University Campus" className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-foreground/70" />
      <div className="absolute inset-0 bg-primary/50" />
    </div>

    <div className="container mx-auto px-4 relative z-10 pt-20">
      <div className="max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <span className="inline-block px-5 py-2 rounded-full bg-primary/30 text-white text-sm font-semibold mb-6 backdrop-blur-md border-2 border-white/40 shadow-lg" style={{
            textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
          }}>
            🎓 Admissions Open 2026
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="font-heading text-5xl md:text-7xl font-bold text-white leading-tight mb-6"
          style={{
            textShadow: '3px 3px 6px rgba(0,0,0,0.9), 6px 6px 12px rgba(0,0,0,0.5)'
          }}
        >
          Shape Your{" "}
          <span className="text-secondary" style={{
            textShadow: '3px 3px 6px rgba(0,0,0,0.9), 6px 6px 12px rgba(0,0,0,0.5)'
          }}>Future</span> at{" "}
          <span className="text-secondary" style={{
            textShadow: '3px 3px 6px rgba(0,0,0,0.9), 6px 6px 12px rgba(0,0,0,0.5)'
          }}>ZENTARITAS</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-lg md:text-xl text-white mb-8 max-w-2xl"
          style={{
            textShadow: '2px 2px 4px rgba(0,0,0,0.9), 4px 4px 8px rgba(0,0,0,0.5)'
          }}
        >
          A premier institution delivering world-class education in technology, business, and sciences. Join a community that transforms knowledge into innovation.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.45 }}
          className="flex flex-wrap gap-4 mb-16"
        >
          <Link to="/courses">
            <Button size="lg" className="bg-primary text-primary-foreground border-0 hover:bg-primary/90 shadow-hero text-base px-8 gap-2">
              Explore Programs <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link to="/about">
            <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white/20 text-base px-8 backdrop-blur-sm">
              Learn More
            </Button>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-wrap gap-8"
        >
          {stats.map((stat) => (
            <div key={stat.label} className="flex items-center gap-3 bg-white/20 backdrop-blur-md rounded-xl px-5 py-3 border-2 border-white/30 shadow-lg">
              <stat.icon className="w-5 h-5 text-secondary drop-shadow-lg" />
              <div>
                <div className="font-heading text-xl font-bold text-white drop-shadow-lg">{stat.value}</div>
                <div className="text-xs text-white/90 drop-shadow-md">{stat.label}</div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  </section>
);

export default HeroSection;
