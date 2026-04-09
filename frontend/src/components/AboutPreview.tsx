import { motion } from "framer-motion";
import { Award, Globe2, BookOpen, Users } from "lucide-react";
import { Link } from "react-router-dom";
import campusAerial from "@/assets/campus-aerial.png";

const highlights = [
  { icon: Award, value: "A+", label: "Accreditation" },
  { icon: Globe2, value: "45+", label: "Countries" },
  { icon: BookOpen, value: "120+", label: "Programs" },
  { icon: Users, value: "12K+", label: "Students" },
];

const AboutPreview = () => (
  <section id="about-preview" className="py-24 bg-background relative overflow-hidden">
    {/* Subtle background pattern */}
    <div className="absolute inset-0 opacity-[0.03]" style={{
      backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--primary)) 1px, transparent 0)`,
      backgroundSize: '40px 40px',
    }} />

    <div className="container mx-auto px-4 relative z-10">
      <div className="grid lg:grid-cols-2 gap-16 items-center">
        {/* Image Side */}
        <motion.div
          initial={{ opacity: 0, x: -60 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative"
        >
          <div className="relative rounded-2xl overflow-hidden shadow-2xl">
            <img
              src={campusAerial}
              alt="Zentaritas University Campus"
              className="w-full h-[500px] object-cover"
              width={800}
              height={500}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/40 via-transparent to-transparent" />
          </div>

          {/* Floating stat card */}
          <motion.div
            className="absolute -bottom-6 -right-4 lg:right-6 bg-white rounded-xl shadow-xl p-5 border border-border/50"
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                <Award className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display text-foreground">25+</p>
                <p className="text-sm text-muted-foreground">Years of Excellence</p>
              </div>
            </div>
          </motion.div>

          {/* Decorative border accent */}
          <div className="absolute -top-4 -left-4 w-24 h-24 border-l-4 border-t-4 border-accent/30 rounded-tl-2xl" />
        </motion.div>

        {/* Content Side */}
        <motion.div
          initial={{ opacity: 0, x: 60 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            <span className="text-sm font-medium text-accent tracking-wide uppercase">About Zentaritas</span>
          </div>

          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6 leading-tight">
            Where{" "}
            <span className="text-gradient">Tradition</span>{" "}
            Meets Innovation
          </h2>

          <p className="text-muted-foreground text-lg leading-relaxed mb-4">
            For over two decades, Zentaritas University has been at the forefront of higher education,
            combining academic rigor with cutting-edge research and a commitment to shaping global leaders.
          </p>

          <p className="text-muted-foreground leading-relaxed mb-8">
            Our campus is home to state-of-the-art facilities, world-renowned faculty, and a diverse
            community of learners from around the globe. We empower students to think critically,
            innovate boldly, and lead with integrity.
          </p>

          {/* Highlight stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {highlights.map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.2 + i * 0.1 }}
                className="text-center p-3 rounded-xl bg-muted/50 border border-border/50"
              >
                <item.icon className="h-5 w-5 text-accent mx-auto mb-1.5" />
                <p className="text-xl font-bold font-display text-foreground">{item.value}</p>
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </motion.div>
            ))}
          </div>

          <Link
            to="/about"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-all duration-300 shadow-lg hover:shadow-xl group"
          >
            Discover Our Story
            <motion.span
              className="inline-block"
              whileHover={{ x: 4 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              →
            </motion.span>
          </Link>
        </motion.div>
      </div>
    </div>
  </section>
);

export default AboutPreview;
