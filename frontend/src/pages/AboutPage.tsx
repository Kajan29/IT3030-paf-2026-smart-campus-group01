import { motion } from "framer-motion";
import { Award, BookOpen, Globe, Target, Users, GraduationCap } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import heroCampus from "@/assets/hero-campus.jpg";
import lectureHall from "@/assets/lecture-hall.jpg";

const stats = [
  { icon: Users, label: "Students", value: "15,000+" },
  { icon: GraduationCap, label: "Alumni", value: "50,000+" },
  { icon: BookOpen, label: "Programs", value: "120+" },
  { icon: Globe, label: "Countries", value: "45+" },
];

const values = [
  { icon: Target, title: "Excellence", desc: "Committed to the highest standards of academic and professional achievement." },
  { icon: Award, title: "Innovation", desc: "Pioneering new approaches to education, research, and community engagement." },
  { icon: Users, title: "Inclusivity", desc: "Creating a diverse and welcoming environment for all students and staff." },
  { icon: Globe, title: "Global Impact", desc: "Preparing graduates to make meaningful contributions worldwide." },
];

const AboutPage = () => (
  <div className="min-h-screen bg-background">
    <Navbar />

    {/* Hero */}
    <section className="relative pt-24 pb-16 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img src={heroCampus} alt="Smart Campus" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-primary/80" />
      </div>
      <div className="container mx-auto px-4 relative z-10 text-center py-16">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display text-4xl md:text-5xl font-bold text-primary-foreground mb-4"
        >
          About Smart Campus
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-primary-foreground/80 text-lg max-w-2xl mx-auto"
        >
          Shaping the future through excellence in education, research, and innovation since 1999.
        </motion.p>
      </div>
    </section>

    {/* Stats */}
    <section className="container mx-auto px-4 -mt-8 relative z-10">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-card rounded-xl p-6 text-center shadow-md border border-border"
          >
            <s.icon className="h-8 w-8 text-accent mx-auto mb-2" />
            <div className="font-display text-2xl font-bold text-foreground">{s.value}</div>
            <div className="text-sm text-muted-foreground">{s.label}</div>
          </motion.div>
        ))}
      </div>
    </section>

    {/* Mission */}
    <section className="container mx-auto px-4 py-20">
      <div className="grid md:grid-cols-2 gap-12 items-center">
        <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
          <h2 className="font-display text-3xl font-bold text-foreground mb-6">Our Mission</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Smart Campus is dedicated to fostering intellectual growth, innovation, and leadership. We provide a transformative educational experience that empowers students to excel in their chosen fields and make a positive impact on society.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Founded with a vision of accessible, world-class education, our university has grown into a vibrant academic community that brings together diverse perspectives, cutting-edge research, and a commitment to student success.
          </p>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
          <img src={lectureHall} alt="Lecture Hall" className="rounded-2xl shadow-xl w-full" loading="lazy" width={1280} height={720} />
        </motion.div>
      </div>
    </section>

    {/* Values */}
    <section className="bg-secondary py-20">
      <div className="container mx-auto px-4">
        <h2 className="font-display text-3xl font-bold text-foreground text-center mb-12">Our Core Values</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map((v, i) => (
            <motion.div
              key={v.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-card rounded-xl p-6 text-center shadow-sm border border-border"
            >
              <div className="w-14 h-14 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <v.icon className="h-7 w-7 text-accent" />
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground mb-2">{v.title}</h3>
              <p className="text-sm text-muted-foreground">{v.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    <Footer />
  </div>
);

export default AboutPage;
