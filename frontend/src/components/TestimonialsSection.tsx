import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Amara Perera",
    role: "Computer Science, Batch 2025",
    quote:
      "Zentaritas transformed my university experience. The room booking system saved me countless hours, and the digital resources made studying so much more efficient.",
    avatar: "AP",
    rating: 5,
  },
  {
    name: "Dr. Rajitha Fernando",
    role: "Senior Lecturer, Faculty of Engineering",
    quote:
      "As a lecturer, the platform streamlined my entire workflow — from scheduling lectures to managing course resources. It's an indispensable tool for modern education.",
    avatar: "RF",
    rating: 5,
  },
  {
    name: "Kavindi Jayasuriya",
    role: "Management Studies, Batch 2024",
    quote:
      "The campus facilities are world-class, and the booking platform makes everything so accessible. I could find study rooms in seconds and focus on what matters most.",
    avatar: "KJ",
    rating: 5,
  },
  {
    name: "Prof. Marcus de Silva",
    role: "Dean, Faculty of Science",
    quote:
      "Zentaritas University's digital infrastructure sets us apart. The integrated management system has improved efficiency across all departments significantly.",
    avatar: "MS",
    rating: 5,
  },
];

const TestimonialsSection = () => {
  const [current, setCurrent] = useState(0);

  const go = (dir: number) => {
    setCurrent((p) => (p + dir + testimonials.length) % testimonials.length);
  };

  return (
    <section id="testimonials-section" className="py-24 bg-muted/30 relative overflow-hidden">
      {/* Subtle bg */}
      <div className="absolute top-0 left-1/3 w-[600px] h-[600px] bg-accent/3 rounded-full blur-[120px]" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            <span className="text-sm font-medium text-accent tracking-wide uppercase">Testimonials</span>
          </div>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-3">
            What Our Community Says
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Hear from students and faculty who make Zentaritas their academic home.
          </p>
        </motion.div>

        {/* Testimonial Card */}
        <div className="max-w-3xl mx-auto">
          <div className="relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={current}
                initial={{ opacity: 0, y: 20, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.97 }}
                transition={{ duration: 0.4 }}
                className="relative rounded-2xl bg-card border border-border/50 p-8 md:p-12 shadow-lg"
              >
                {/* Quote icon */}
                <Quote className="absolute top-6 right-8 h-12 w-12 text-accent/10" />

                {/* Stars */}
                <div className="flex gap-1 mb-6">
                  {Array.from({ length: testimonials[current].rating }).map((_, i) => (
                    <span key={i} className="text-accent text-lg">★</span>
                  ))}
                </div>

                {/* Quote text */}
                <p className="text-lg md:text-xl text-foreground/80 font-body leading-relaxed mb-8 italic">
                  &ldquo;{testimonials[current].quote}&rdquo;
                </p>

                {/* Author */}
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm">
                    {testimonials[current].avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground font-display">{testimonials[current].name}</p>
                    <p className="text-sm text-muted-foreground">{testimonials[current].role}</p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation arrows */}
            <div className="flex justify-center gap-3 mt-8">
              <button
                onClick={() => go(-1)}
                className="p-2.5 rounded-full bg-card border border-border hover:bg-muted transition-colors"
                aria-label="Previous testimonial"
              >
                <ChevronLeft className="h-5 w-5 text-muted-foreground" />
              </button>
              {/* Dots */}
              <div className="flex items-center gap-2">
                {testimonials.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrent(i)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      i === current
                        ? "w-7 bg-accent"
                        : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                    }`}
                    aria-label={`Go to testimonial ${i + 1}`}
                  />
                ))}
              </div>
              <button
                onClick={() => go(1)}
                className="p-2.5 rounded-full bg-card border border-border hover:bg-muted transition-colors"
                aria-label="Next testimonial"
              >
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
