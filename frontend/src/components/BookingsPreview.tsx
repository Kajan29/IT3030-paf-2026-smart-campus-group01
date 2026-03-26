import { motion } from "framer-motion";

const stats = [
  { value: "15,000+", label: "Students Enrolled" },
  { value: "500+", label: "Expert Lecturers" },
  { value: "120+", label: "Degree Programs" },
  { value: "95%", label: "Graduate Employment" },
];

const StatsSection = () => (
  <section className="py-16 bg-primary">
    <div className="container mx-auto px-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="text-center"
          >
            <div className="font-display text-3xl md:text-4xl font-bold text-accent mb-1">
              {s.value}
            </div>
            <div className="text-sm text-primary-foreground/70">{s.label}</div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default StatsSection;
