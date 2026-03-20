import { motion } from "framer-motion";
import { Code, Briefcase, FlaskConical, Palette, BarChart3, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const courses = [
  { icon: Code, title: "Computer Science", desc: "Software engineering, AI, data science and cybersecurity programs.", color: "bg-primary/10 text-primary" },
  { icon: Briefcase, title: "Business Management", desc: "MBA, finance, marketing and entrepreneurship degrees.", color: "bg-accent text-accent-foreground" },
  { icon: FlaskConical, title: "Engineering", desc: "Civil, electrical, mechanical and biomedical engineering.", color: "bg-secondary/30 text-secondary-foreground" },
  { icon: Palette, title: "Design & Media", desc: "UX/UI design, animation, film production and architecture.", color: "bg-mint-light text-foreground" },
  { icon: BarChart3, title: "Data Analytics", desc: "Big data, machine learning and business intelligence.", color: "bg-primary/10 text-primary" },
  { icon: Shield, title: "Cybersecurity", desc: "Network security, ethical hacking and digital forensics.", color: "bg-accent text-accent-foreground" },
];

const CoursesPreview = () => (
  <section className="py-24 bg-muted/50">
    <div className="container mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-16"
      >
        <span className="text-primary font-semibold text-sm uppercase tracking-wider">Academic Programs</span>
        <h2 className="font-heading text-4xl md:text-5xl font-bold text-foreground mt-3">Our Faculties & Courses</h2>
        <p className="text-muted-foreground mt-4 max-w-xl mx-auto">Discover programs designed to equip you with industry-ready skills and cutting-edge knowledge.</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course, i) => (
          <motion.div
            key={course.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="bg-card rounded-2xl p-8 shadow-card hover:shadow-card-hover transition-all duration-300 border border-border group hover:-translate-y-1"
          >
            <div className={`w-12 h-12 rounded-xl ${course.color} flex items-center justify-center mb-5`}>
              <course.icon className="w-6 h-6" />
            </div>
            <h3 className="font-heading text-xl font-semibold text-foreground mb-2">{course.title}</h3>
            <p className="text-muted-foreground text-sm mb-4">{course.desc}</p>
            <span className="text-primary text-sm font-medium group-hover:underline cursor-pointer">View Programs →</span>
          </motion.div>
        ))}
      </div>

      <div className="text-center mt-12">
        <Link to="/courses">
          <Button size="lg" className="bg-hero-gradient text-primary-foreground border-0">View All Courses</Button>
        </Link>
      </div>
    </div>
  </section>
);

export default CoursesPreview;
