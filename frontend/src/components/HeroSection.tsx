import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import heroCampus from "@/assets/hero-campus.jpg";
import lectureHall from "@/assets/lecture-hall.jpg";
import library from "@/assets/library.jpg";

const slides = [
  {
    image: heroCampus,
    title: "Shape Your Future",
    subtitle: "World-class education at Smart Campus",
    badge: "Admissions Open 2026",
  },
  {
    image: lectureHall,
    title: "Knowledge Awaits",
    subtitle: "Access our vast library and digital resources",
    badge: "50+ Programs",
  },
  {
    image: library,
    title: "Learn from the Best",
    subtitle: "Expert lecturers guiding your academic journey",
    badge: "Top Ranked Faculty",
  },
];

const HeroSlider = () => {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);

  const goNext = useCallback(() => {
    setDirection(1);
    setCurrent((p) => (p + 1) % slides.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(goNext, 6000);
    return () => clearInterval(timer);
  }, [goNext]);

  const go = (dir: number) => {
    setDirection(dir);
    setCurrent((p) => (p + dir + slides.length) % slides.length);
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? "100%" : "-100%",
      opacity: 0,
      scale: 1.1,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        x: { type: "spring", stiffness: 250, damping: 30 },
        opacity: { duration: 0.6 },
        scale: { duration: 1.5, ease: "easeOut" },
      },
    },
    exit: (direction: number) => ({
      x: direction > 0 ? "-40%" : "40%",
      opacity: 0,
      scale: 0.95,
      transition: {
        x: { type: "spring", stiffness: 250, damping: 30 },
        opacity: { duration: 0.5 },
        scale: { duration: 0.5 },
      },
    }),
  };

  const contentVariants = {
    enter: {
      opacity: 0,
      y: 80,
      filter: "blur(12px)",
    },
    center: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: {
        duration: 0.9,
        delay: 0.35,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
    exit: {
      opacity: 0,
      y: -50,
      filter: "blur(10px)",
      transition: {
        duration: 0.45,
        ease: "easeIn",
      },
    },
  };

  return (
    <section id="hero-section" className="relative h-screen w-full overflow-hidden">
      {/* Background slides */}
      <AnimatePresence initial={false} custom={direction} mode="popLayout">
        <motion.div
          key={current}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          className="absolute inset-0"
        >
          <motion.img
            src={slides[current].image}
            alt={slides[current].title}
            className="w-full h-full object-cover"
            width={1920}
            height={1080}
            initial={{ scale: 1 }}
            animate={{ scale: 1.08 }}
            transition={{ duration: 6, ease: "linear" }}
          />
          {/* Multi-layer overlay for depth */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-primary/40 to-primary/80" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/30 via-transparent to-primary/30" />
        </motion.div>
      </AnimatePresence>

      {/* Floating decorative elements */}
      <div className="absolute inset-0 z-[5] pointer-events-none overflow-hidden">
        <motion.div
          className="absolute top-20 left-10 w-64 h-64 rounded-full bg-accent/5 blur-3xl"
          animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-32 right-10 w-96 h-96 rounded-full bg-accent/8 blur-3xl"
          animate={{ x: [0, -20, 0], y: [0, 30, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex items-center justify-center">
        <div className="text-center px-4 max-w-4xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              variants={contentVariants}
              initial="enter"
              animate="center"
              exit="exit"
            >
              {/* Badge */}
              <motion.div
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/20 backdrop-blur-md border border-accent/30 mb-6"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                <span className="text-sm font-medium text-primary-foreground/90 tracking-wide">
                  {slides[current].badge}
                </span>
              </motion.div>

              <motion.h1
                className="font-display text-5xl md:text-6xl lg:text-8xl font-bold text-primary-foreground mb-6 leading-[1.1]"
                initial={{ opacity: 0, y: 30, letterSpacing: "0.12em" }}
                animate={{ opacity: 1, y: 0, letterSpacing: "0.01em" }}
                transition={{ duration: 0.8, delay: 0.45, ease: "easeOut" }}
              >
                {slides[current].title}
              </motion.h1>

              <motion.p
                className="text-lg md:text-xl lg:text-2xl text-primary-foreground/75 mb-10 font-body max-w-2xl mx-auto leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.65, ease: "easeOut" }}
              >
                {slides[current].subtitle}
              </motion.p>

              <motion.div
                className="flex flex-col sm:flex-row gap-4 justify-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.85, ease: "easeOut" }}
              >
                <a
                  href="/resources"
                  className="group relative px-8 py-4 bg-accent text-accent-foreground font-semibold rounded-xl hover:bg-accent/90 transition-all duration-300 text-lg shadow-lg hover:shadow-accent/25 hover:shadow-xl overflow-hidden"
                >
                  <span className="relative z-10">Explore Courses</span>
                  <span className="absolute inset-0 bg-gradient-to-r from-accent via-accent/80 to-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </a>
                <a
                  href="/about"
                  className="px-8 py-4 border-2 border-primary-foreground/30 text-primary-foreground font-semibold rounded-xl hover:bg-primary-foreground/10 hover:border-primary-foreground/50 backdrop-blur-sm transition-all duration-300 text-lg"
                >
                  Learn More
                </a>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation arrows */}
      <motion.button
        onClick={() => go(-1)}
        className="absolute left-6 top-1/2 -translate-y-1/2 z-20 p-3.5 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/25 text-primary-foreground backdrop-blur-xl border border-primary-foreground/15 transition-all"
        whileHover={{ scale: 1.1, x: -3 }}
        whileTap={{ scale: 0.92 }}
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-6 w-6" />
      </motion.button>
      <motion.button
        onClick={() => go(1)}
        className="absolute right-6 top-1/2 -translate-y-1/2 z-20 p-3.5 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/25 text-primary-foreground backdrop-blur-xl border border-primary-foreground/15 transition-all"
        whileHover={{ scale: 1.1, x: 3 }}
        whileTap={{ scale: 0.92 }}
        aria-label="Next slide"
      >
        <ChevronRight className="h-6 w-6" />
      </motion.button>

      {/* Dots indicator */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 flex gap-3">
        {slides.map((_, i) => (
          <motion.button
            key={i}
            onClick={() => {
              setDirection(i > current ? 1 : -1);
              setCurrent(i);
            }}
            className={`h-2.5 rounded-full transition-colors ${
              i === current ? "bg-accent" : "bg-primary-foreground/35"
            }`}
            animate={{
              width: i === current ? 36 : 10,
              opacity: i === current ? 1 : 0.5,
            }}
            whileHover={{ opacity: 1, scale: 1.2 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>

      {/* Scroll down indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <span className="text-xs text-primary-foreground/50 tracking-widest uppercase font-medium">
          Scroll
        </span>
        <ChevronDown className="h-5 w-5 text-primary-foreground/40" />
      </motion.div>
    </section>
  );
};

export default HeroSlider;
