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
      <motion.img
        src={heroCampus}
        alt="ZENTARITAS University Campus"
        className="w-full h-full object-cover"
        initial={{ scale: 1.08, opacity: 0.82 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-foreground/85 via-foreground/70 to-foreground/55" />
      <div className="absolute inset-0 bg-primary/30" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_30%,rgba(234,179,8,0.18),transparent_45%)]" />
    </div>

    <div className="container mx-auto px-4 relative z-10 pt-24 pb-14 md:pb-20">
      <div className="max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <span className="inline-flex items-center rounded-full border border-white/35 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-white/95 backdrop-blur-sm mb-6">
            Admissions Open 2026
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, delay: 0.1 }}
          className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.04] mb-6"
        >
          Shape Your <span className="text-secondary">Future</span> at
          <br className="hidden sm:block" /> <span className="text-secondary">ZENTARITAS</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, delay: 0.22 }}
          className="text-base sm:text-lg md:text-xl text-white leading-relaxed mb-9 max-w-2xl"
        >
          A premier institution delivering world-class education in technology,
          business, and sciences. Join a community that transforms knowledge into
          innovation.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, delay: 0.34 }}
          className="flex flex-wrap gap-3 sm:gap-4 mb-12"
        >
          <Button asChild size="lg" className="bg-primary text-primary-foreground border-0 hover:bg-primary/90 shadow-hero text-base px-8 gap-2 h-11 sm:h-12">
            <Link to="/courses">
              Explore Programs <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="border-white/60 bg-white/10 text-white hover:bg-white/20 hover:text-white text-base px-8 backdrop-blur-sm h-11 sm:h-12">
            <Link to="/about">
              Learn More
            </Link>
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, delay: 0.48 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 max-w-2xl"
        >
          {stats.map((stat) => (
            <div key={stat.label} className="flex items-center gap-3 rounded-xl px-4 py-3 bg-white/12 backdrop-blur-md border border-white/25 shadow-lg">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/65 border border-white/20">
                <stat.icon className="w-4 h-4 text-secondary" />
              </div>
              <div>
                <div className="font-heading text-xl font-bold text-white">{stat.value}</div>
                <div className="text-xs uppercase tracking-wide text-white/80">{stat.label}</div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  </section>
);

export default HeroSection;
