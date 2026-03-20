import { motion } from "framer-motion";
import { Building, BookOpenCheck, FlaskConical, Library } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import libraryImg from "@/assets/library.jpg";
import lectureImg from "@/assets/lecture-hall.jpg";

const bookingTypes = [
  { icon: Building, title: "Lecture Halls", desc: "Book lecture halls for classes and presentations", available: 12 },
  { icon: FlaskConical, title: "Laboratories", desc: "Reserve science and computer labs", available: 8 },
  { icon: Library, title: "Library Spaces", desc: "Book study rooms and reading areas", available: 20 },
  { icon: BookOpenCheck, title: "Study Areas", desc: "Reserve group study and collaboration spaces", available: 15 },
];

const BookingsPreview = () => (
  <section className="py-24">
    <div className="container mx-auto px-4">
      <div className="grid lg:grid-cols-2 gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
        >
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">Campus Resources</span>
          <h2 className="font-heading text-4xl md:text-5xl font-bold text-foreground mt-3 mb-6">Book Campus Facilities</h2>
          <p className="text-muted-foreground mb-8">Easily reserve classrooms, labs, library spaces and study areas. Real-time availability for students and staff.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {bookingTypes.map((item) => (
              <div key={item.title} className="flex items-start gap-3 p-4 rounded-xl bg-muted/50 border border-border">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-heading font-semibold text-foreground text-sm">{item.title}</h4>
                  <p className="text-xs text-muted-foreground">{item.available} available</p>
                </div>
              </div>
            ))}
          </div>

          <Link to="/bookings">
            <Button size="lg" className="bg-hero-gradient text-primary-foreground border-0">Book Now</Button>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 gap-4"
        >
          <img src={libraryImg} alt="University Library" className="rounded-2xl shadow-card w-full h-64 object-cover" />
          <img src={lectureImg} alt="Lecture Hall" className="rounded-2xl shadow-card w-full h-64 object-cover mt-8" />
        </motion.div>
      </div>
    </div>
  </section>
);

export default BookingsPreview;
