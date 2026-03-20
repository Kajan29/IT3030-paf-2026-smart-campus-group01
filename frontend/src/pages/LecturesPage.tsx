import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { Calendar, Clock, MapPin, User } from "lucide-react";
import { Button } from "@/components/ui/button";

const lectures = [
  { title: "Introduction to Machine Learning", lecturer: "Dr. Sarah Chen", time: "Mon 9:00 AM", location: "Hall A-301", faculty: "Computing" },
  { title: "Data Structures & Algorithms", lecturer: "Prof. James Wilson", time: "Tue 10:30 AM", location: "Hall B-102", faculty: "Computing" },
  { title: "Microeconomics", lecturer: "Dr. Amara Silva", time: "Wed 2:00 PM", location: "Hall C-205", faculty: "Business" },
  { title: "Digital Circuit Design", lecturer: "Prof. Ravi Kumar", time: "Thu 11:00 AM", location: "Lab E-401", faculty: "Engineering" },
  { title: "UX Research Methods", lecturer: "Ms. Lina Park", time: "Fri 1:00 PM", location: "Studio D-110", faculty: "Design" },
  { title: "Cybersecurity Fundamentals", lecturer: "Dr. Mark Evans", time: "Mon 3:00 PM", location: "Hall A-102", faculty: "Computing" },
  { title: "Financial Accounting", lecturer: "Prof. Nisha Patel", time: "Tue 9:00 AM", location: "Hall C-301", faculty: "Business" },
  { title: "Thermodynamics", lecturer: "Dr. Tom Richards", time: "Wed 10:00 AM", location: "Lab E-201", faculty: "Engineering" },
];

const LecturesPage = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <div className="pt-24 pb-16">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">Schedule</span>
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-foreground mt-3">Lecture Timetable</h1>
          <p className="text-muted-foreground mt-4 max-w-xl mx-auto">View upcoming lectures and class schedules across all faculties.</p>
        </motion.div>

        <div className="space-y-4 max-w-4xl mx-auto">
          {lectures.map((lec, i) => (
            <motion.div
              key={lec.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card rounded-xl p-6 shadow-card border border-border flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-card-hover transition-all"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">{lec.faculty}</span>
                </div>
                <h3 className="font-heading font-semibold text-foreground text-lg">{lec.title}</h3>
                <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> {lec.lecturer}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {lec.time}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {lec.location}</span>
                </div>
              </div>
              <Button variant="outline" size="sm">Enroll</Button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
    <Footer />
  </div>
);

export default LecturesPage;
