import { motion } from "framer-motion";
import { BookOpen, CalendarCheck, TicketCheck, FileText } from "lucide-react";

const features = [
  {
    icon: CalendarCheck,
    title: "Book Rooms",
    desc: "Reserve lecture halls, labs, and study rooms with real-time availability.",
  },
  {
    icon: BookOpen,
    title: "Book Classes",
    desc: "Students can browse and enroll in available classes and lectures.",
  },
  {
    icon: FileText,
    title: "Course Notes",
    desc: "Access and download lecture notes, slides, and study materials.",
  },
  {
    icon: TicketCheck,
    title: "Raise Tickets",
    desc: "Submit support tickets for IT, facilities, or academic issues.",
  },
];

const FeaturesSection = () => (
  <section className="py-20 bg-background">
    <div className="container mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center mb-14"
      >
        <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
          Everything You Need
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto">
          One platform for students and lecturers to manage their academic life efficiently.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="glass-card rounded-xl p-6 text-center group hover:shadow-xl transition-shadow"
          >
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-accent/10 text-accent mb-4 group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
              <f.icon className="h-7 w-7" />
            </div>
            <h3 className="font-display text-lg font-semibold text-foreground mb-2">
              {f.title}
            </h3>
            <p className="text-sm text-muted-foreground">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default FeaturesSection;
