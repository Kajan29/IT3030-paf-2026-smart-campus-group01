import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Building2, GraduationCap, Images, Microscope, Search, Users, X } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import heroCampus from "@/assets/hero-campus.jpg";
import lectureHall from "@/assets/lecture-hall.jpg";
import libraryPhoto from "@/assets/library.jpg";

type GalleryCategory = "All" | "Campus" | "Facilities" | "Student Life" | "Events";

type GalleryItem = {
  id: number;
  title: string;
  category: GalleryCategory;
  image: string;
  location: string;
  description: string;
};

const categories: Array<{ name: GalleryCategory; icon: React.ComponentType<{ className?: string }> }> = [
  { name: "All", icon: Images },
  { name: "Campus", icon: Building2 },
  { name: "Facilities", icon: Microscope },
  { name: "Student Life", icon: Users },
  { name: "Events", icon: GraduationCap },
];

const galleryItems: GalleryItem[] = [
  {
    id: 1,
    title: "Campus Entrance",
    category: "Campus",
    image: heroCampus,
    location: "Main Boulevard",
    description: "Morning view of the main entrance and central academic block.",
  },
  {
    id: 2,
    title: "Modern Lecture Hall",
    category: "Facilities",
    image: lectureHall,
    location: "Learning Complex A",
    description: "A smart classroom space used for engineering and computing lectures.",
  },
  {
    id: 3,
    title: "University Library",
    category: "Facilities",
    image: libraryPhoto,
    location: "Knowledge Center",
    description: "Quiet study floors, digital archives, and collaborative group zones.",
  },
  {
    id: 4,
    title: "Campus Courtyard",
    category: "Campus",
    image: "/gallery/campus-courtyard.svg",
    location: "Central Square",
    description: "Mock visual of open social spaces surrounded by lecture buildings.",
  },
  {
    id: 5,
    title: "Library Study Hall",
    category: "Student Life",
    image: "/gallery/library-study.svg",
    location: "Level 2",
    description: "Mock visual of collaborative reading areas used by students daily.",
  },
  {
    id: 6,
    title: "Innovation Lab",
    category: "Facilities",
    image: "/gallery/innovation-lab.svg",
    location: "Tech Building",
    description: "Mock visual of the applied computing and prototyping lab environment.",
  },
  {
    id: 7,
    title: "Graduation Celebration",
    category: "Events",
    image: "/gallery/graduation-day.svg",
    location: "Convocation Arena",
    description: "Mock visual of annual graduation celebrations and student milestones.",
  },
  {
    id: 8,
    title: "Student Commons",
    category: "Student Life",
    image: "/gallery/student-commons.svg",
    location: "Campus Hub",
    description: "Mock visual of student lounges, social seating, and casual meetup zones.",
  },
];

const GalleryPage = () => {
  const [activeCategory, setActiveCategory] = useState<GalleryCategory>("All");
  const [searchText, setSearchText] = useState("");
  const [selectedImage, setSelectedImage] = useState<GalleryItem | null>(null);

  const filteredItems = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return galleryItems.filter((item) => {
      const matchesCategory = activeCategory === "All" || item.category === activeCategory;
      const matchesSearch =
        query.length === 0 ||
        item.title.toLowerCase().includes(query) ||
        item.location.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchText]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="relative pt-24 pb-16 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={heroCampus} alt="University Gallery" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-primary/80" />
        </div>
        <div className="container mx-auto px-4 relative z-10 text-center py-16">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-4xl md:text-5xl font-bold text-primary-foreground mb-4"
          >
            University Gallery
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-primary-foreground/80 text-lg max-w-2xl mx-auto"
          >
            Explore campus moments, facilities, student life, and events through curated mock visuals.
          </motion.p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto mb-8 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search gallery by title, location, or keyword..."
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex flex-wrap gap-3 justify-center mb-10">
          {categories.map((category) => (
            <button
              key={category.name}
              onClick={() => setActiveCategory(category.name)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeCategory === category.name
                  ? "bg-accent text-accent-foreground shadow-md"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              <category.icon className="h-4 w-4" />
              {category.name}
            </button>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((item, index) => (
            <motion.button
              key={item.id}
              type="button"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              onClick={() => setSelectedImage(item)}
              className="text-left bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all group"
            >
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
              <div className="p-4">
                <div className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-accent/15 text-accent-foreground mb-3">
                  {item.category}
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground mb-1">{item.title}</h3>
                <p className="text-xs text-muted-foreground mb-2">{item.location}</p>
                <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
              </div>
            </motion.button>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <p className="text-center text-muted-foreground mt-12">
            No gallery items matched your search. Try another keyword or category.
          </p>
        )}
      </section>

      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm p-4 flex items-center justify-center"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="w-full max-w-4xl bg-card rounded-2xl overflow-hidden border border-border shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative">
              <img src={selectedImage.image} alt={selectedImage.title} className="w-full max-h-[70vh] object-cover" />
              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                className="absolute top-3 right-3 bg-black/55 text-white rounded-full p-2 hover:bg-black/70 transition-colors"
                aria-label="Close preview"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5">
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">{selectedImage.category}</p>
              <h2 className="font-display text-2xl font-semibold text-foreground mb-1">{selectedImage.title}</h2>
              <p className="text-sm text-muted-foreground mb-2">{selectedImage.location}</p>
              <p className="text-sm text-foreground/85">{selectedImage.description}</p>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default GalleryPage;