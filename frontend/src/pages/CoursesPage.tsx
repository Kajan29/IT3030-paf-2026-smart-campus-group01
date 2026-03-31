import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Download, Search, BookOpen, Beaker, Code, Calculator } from "lucide-react";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import heroCampus from "@/assets/hero-campus.jpg";

const categories = [
  { name: "All", icon: BookOpen },
  { name: "Computer Science", icon: Code },
  { name: "Engineering", icon: Beaker },
  { name: "Mathematics", icon: Calculator },
];

const courseNotes = [
  { title: "Data Structures & Algorithms", category: "Computer Science", type: "Lecture Notes", size: "2.4 MB" },
  { title: "Object Oriented Programming", category: "Computer Science", type: "Slides", size: "5.1 MB" },
  { title: "Database Management Systems", category: "Computer Science", type: "Lecture Notes", size: "3.2 MB" },
  { title: "Thermodynamics", category: "Engineering", type: "Lab Manual", size: "4.7 MB" },
  { title: "Circuit Analysis", category: "Engineering", type: "Lecture Notes", size: "1.8 MB" },
  { title: "Linear Algebra", category: "Mathematics", type: "Slides", size: "2.1 MB" },
  { title: "Calculus II", category: "Mathematics", type: "Lecture Notes", size: "3.5 MB" },
  { title: "Machine Learning Basics", category: "Computer Science", type: "Lab Manual", size: "6.2 MB" },
];

const ResourcesPage = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");

  const filtered = courseNotes.filter(
    (n) =>
      (activeCategory === "All" || n.category === activeCategory) &&
      n.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Banner */}
      <section className="relative pt-24 pb-16 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={heroCampus} alt="Resources" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-primary/80" />
        </div>
        <div className="container mx-auto px-4 relative z-10 text-center py-16">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-4xl md:text-5xl font-bold text-primary-foreground mb-4"
          >
            Course Resources
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-primary-foreground/80 text-lg max-w-2xl mx-auto"
          >
            Browse and download lecture notes, slides, and study materials for your courses.
          </motion.p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        {/* Search */}
        <div className="max-w-md mx-auto mb-8 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search resources..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap gap-3 justify-center mb-10">
          {categories.map((c) => (
            <button
              key={c.name}
              onClick={() => setActiveCategory(c.name)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeCategory === c.name
                  ? "bg-accent text-accent-foreground shadow-md"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              <c.icon className="h-4 w-4" />
              {c.name}
            </button>
          ))}
        </div>

        {/* Notes grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((note, i) => (
            <motion.div
              key={note.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card rounded-xl p-5 flex items-start gap-4 group hover:shadow-xl transition-shadow"
            >
              <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
                <FileText className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground text-sm mb-1 truncate">
                  {note.title}
                </h3>
                <p className="text-xs text-muted-foreground mb-2">
                  {note.category} · {note.type} · {note.size}
                </p>
                <button className="flex items-center gap-1 text-xs font-medium text-accent hover:text-accent/80 transition-colors">
                  <Download className="h-3 w-3" />
                  Download
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground mt-10">
            No resources found. Try a different search or category.
          </p>
        )}
      </section>
      <Footer />
    </div>
  );
};

export default ResourcesPage;
