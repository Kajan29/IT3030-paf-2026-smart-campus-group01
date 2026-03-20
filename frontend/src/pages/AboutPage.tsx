import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { Target, Eye, Heart, Globe, Award, Users } from "lucide-react";
import heroCampus from "@/assets/hero-campus.jpg";

const values = [
  { icon: Target, title: "Excellence", desc: "Striving for the highest standards in education, research and community service." },
  { icon: Eye, title: "Innovation", desc: "Embracing technology and creative thinking to solve real-world challenges." },
  { icon: Heart, title: "Integrity", desc: "Upholding ethical standards and fostering a culture of honesty and respect." },
  { icon: Globe, title: "Diversity", desc: "Celebrating our multicultural community and inclusive learning environment." },
];

const milestones = [
  { year: "2005", event: "ZENTARITAS University founded" },
  { year: "2010", event: "Opened Faculty of Engineering" },
  { year: "2015", event: "Achieved national accreditation excellence" },
  { year: "2018", event: "Launched online learning platform" },
  { year: "2022", event: "Ranked Top 10 in the country" },
  { year: "2025", event: "Expanded to 3 campus locations" },
];

const AboutPage = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <div className="pt-24 pb-16">
      {/* Hero */}
      <div className="relative h-80 mb-16 overflow-hidden">
        <img src={heroCampus} alt="ZENTARITAS Campus" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-foreground/50" />
        <div className="absolute inset-0 bg-primary/30" />
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <h1 className="font-heading text-4xl md:text-5xl font-bold text-primary-foreground">About ZENTARITAS</h1>
            <p className="text-primary-foreground/80 mt-4 max-w-lg mx-auto">A legacy of academic excellence and innovation since 2005.</p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4">
        {/* Mission */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center mb-20"
        >
          <h2 className="font-heading text-3xl font-bold text-foreground mb-4">Our Mission</h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            ZENTARITAS University is committed to fostering a transformative educational experience that prepares students for global leadership. Through cutting-edge research, innovative teaching, and community engagement, we empower the next generation of thinkers, creators, and leaders.
          </p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
          {[
            { icon: Users, value: "15,000+", label: "Students" },
            { icon: Award, value: "120+", label: "Programs" },
            { icon: Globe, value: "40+", label: "Countries" },
            { icon: Target, value: "95%", label: "Employment Rate" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center bg-card rounded-2xl p-8 shadow-card border border-border"
            >
              <stat.icon className="w-8 h-8 text-primary mx-auto mb-3" />
              <div className="font-heading text-3xl font-bold text-foreground">{stat.value}</div>
              <div className="text-muted-foreground text-sm mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Values */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <h2 className="font-heading text-3xl font-bold text-foreground text-center mb-12">Our Core Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v, i) => (
              <motion.div
                key={v.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-card rounded-2xl p-8 shadow-card border border-border text-center hover:shadow-card-hover transition-all"
              >
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <v.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-heading text-lg font-semibold text-foreground mb-2">{v.title}</h3>
                <p className="text-muted-foreground text-sm">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="font-heading text-3xl font-bold text-foreground text-center mb-12">Our Journey</h2>
          <div className="max-w-2xl mx-auto space-y-0">
            {milestones.map((m, i) => (
              <motion.div
                key={m.year}
                initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="flex items-start gap-6 py-4"
              >
                <div className="w-20 shrink-0 text-right">
                  <span className="font-heading text-xl font-bold text-primary">{m.year}</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  {i < milestones.length - 1 && <div className="w-0.5 h-12 bg-border" />}
                </div>
                <p className="text-foreground font-medium pt-0.5">{m.event}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
    <Footer />
  </div>
);

export default AboutPage;
