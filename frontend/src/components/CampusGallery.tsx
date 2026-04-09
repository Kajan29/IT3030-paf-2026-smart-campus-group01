import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import campusAerial from "@/assets/campus-aerial.png";
import libraryInterior from "@/assets/library-interior.png";
import scienceLab from "@/assets/science-lab.png";
import heroCampus from "@/assets/hero-campus.jpg";

const images = [
  { src: campusAerial, alt: "Campus Aerial View", span: "md:col-span-2 md:row-span-2" },
  { src: libraryInterior, alt: "University Library", span: "" },
  { src: scienceLab, alt: "Science Laboratory", span: "" },
  { src: heroCampus, alt: "Main Campus", span: "md:col-span-2" },
];

const CampusGallery = () => (
  <section id="campus-gallery" className="py-24 bg-background">
    <div className="container mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-12 gap-4"
      >
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            <span className="text-sm font-medium text-accent tracking-wide uppercase">Campus Life</span>
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">
            Explore Our Campus
          </h2>
          <p className="text-muted-foreground mt-2 max-w-md">
            World-class facilities designed to inspire learning and innovation.
          </p>
        </div>
        <Link
          to="/gallery"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors group"
        >
          View Gallery
          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </motion.div>

      {/* Gallery Grid */}
      <div className="grid md:grid-cols-4 gap-4 auto-rows-[220px]">
        {images.map((img, i) => (
          <motion.div
            key={img.alt}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className={`group relative rounded-2xl overflow-hidden cursor-pointer ${img.span}`}
          >
            <img
              src={img.src}
              alt={img.alt}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
              <p className="text-white font-display font-semibold text-lg drop-shadow-lg">
                {img.alt}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default CampusGallery;
