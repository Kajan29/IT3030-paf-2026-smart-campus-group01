import { motion } from "framer-motion";
import { ArrowRight, GraduationCap } from "lucide-react";
import { Link } from "react-router-dom";
import campusImage from "@/assets/campus-aerial.png";

const CallToAction = () => (
  <section id="cta-section" className="py-24 bg-background relative overflow-hidden">
    <div className="container mx-auto px-4 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="relative rounded-3xl overflow-hidden min-h-[520px] flex items-center justify-center"
      >
        {/* Background Image */}
        <img
          src={campusImage}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover"
          width={1920}
          height={800}
        />

        {/* Dark overlay with gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/85 via-primary/75 to-primary/90" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />

        {/* Decorative shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-accent/8 rounded-full blur-3xl" />
        </div>

        {/* Content */}
        <div className="relative z-10 px-8 py-16 md:px-16 md:py-20 text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/20 backdrop-blur-md border border-accent/30 mb-6"
          >
            <GraduationCap className="h-8 w-8 text-accent" />
          </motion.div>

          <motion.h2
            className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-5 leading-tight"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Ready to Begin Your{" "}
            <span className="text-accent">Academic Journey</span>?
          </motion.h2>

          <motion.p
            className="text-white/70 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            Join thousands of students who have chosen Zentaritas University
            as their path to excellence. Applications are now open.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Link
              to="/auth/register"
              className="group inline-flex items-center gap-2 px-8 py-4 bg-accent text-accent-foreground font-semibold rounded-xl hover:bg-accent/90 transition-all duration-300 text-lg shadow-lg hover:shadow-accent/25 hover:shadow-xl"
            >
              Get Started Today
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 px-8 py-4 border-2 border-white/30 text-white font-semibold rounded-xl hover:bg-white/10 hover:border-white/50 backdrop-blur-sm transition-all duration-300 text-lg"
            >
              Contact Admissions
            </Link>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            className="mt-12 flex flex-wrap items-center justify-center gap-6 text-white/40 text-sm"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400" />
              UGC Recognized
            </span>
            <span className="w-px h-4 bg-white/20" />
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400" />
              NAAC A+ Accredited
            </span>
            <span className="w-px h-4 bg-white/20" />
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400" />
              ISO 9001 Certified
            </span>
          </motion.div>
        </div>
      </motion.div>
    </div>
  </section>
);

export default CallToAction;
