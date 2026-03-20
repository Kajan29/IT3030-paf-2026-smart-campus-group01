import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { Code, Briefcase, FlaskConical, Palette, BarChart3, Shield, Clock, Users, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

const allCourses = [
  { icon: Code, faculty: "Computing", title: "BSc (Hons) in IT", duration: "4 Years", students: 450, rating: 4.8 },
  { icon: Code, faculty: "Computing", title: "BSc in Computer Science", duration: "4 Years", students: 380, rating: 4.9 },
  { icon: Code, faculty: "Computing", title: "BSc in Data Science", duration: "4 Years", students: 200, rating: 4.7 },
  { icon: Briefcase, faculty: "Business", title: "BBA in Management", duration: "3 Years", students: 320, rating: 4.5 },
  { icon: Briefcase, faculty: "Business", title: "MBA Program", duration: "2 Years", students: 150, rating: 4.8 },
  { icon: FlaskConical, faculty: "Engineering", title: "BSc in Civil Engineering", duration: "4 Years", students: 280, rating: 4.6 },
  { icon: FlaskConical, faculty: "Engineering", title: "BSc in Electrical Engineering", duration: "4 Years", students: 240, rating: 4.7 },
  { icon: Palette, faculty: "Design", title: "BA in UX/UI Design", duration: "3 Years", students: 180, rating: 4.5 },
  { icon: BarChart3, faculty: "Computing", title: "MSc in Big Data Analytics", duration: "2 Years", students: 120, rating: 4.9 },
  { icon: Shield, faculty: "Computing", title: "BSc in Cybersecurity", duration: "4 Years", students: 160, rating: 4.8 },
];

const CoursesPage = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <div className="pt-24 pb-16">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">Programs</span>
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-foreground mt-3">All Courses & Programs</h1>
          <p className="text-muted-foreground mt-4 max-w-xl mx-auto">Browse our comprehensive range of undergraduate and postgraduate programs.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allCourses.map((course, i) => (
            <motion.div
              key={course.title}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 border border-border hover:-translate-y-1"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <course.icon className="w-5 h-5 text-primary" />
                </div>
                <span className="text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">{course.faculty}</span>
              </div>
              <h3 className="font-heading text-lg font-semibold text-foreground mb-3">{course.title}</h3>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {course.duration}</span>
                <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {course.students}</span>
                <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-yellow-500" /> {course.rating}</span>
              </div>
              <Button variant="outline" size="sm" className="w-full">View Details</Button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
    <Footer />
  </div>
);

export default CoursesPage;
