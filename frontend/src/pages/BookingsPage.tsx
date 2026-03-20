import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { Building, FlaskConical, Library, BookOpenCheck, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const facilityTypes = [
  { id: "hall", icon: Building, label: "Lecture Hall", items: ["Hall A-301", "Hall A-102", "Hall B-102", "Hall B-201", "Hall C-205", "Hall C-301"] },
  { id: "lab", icon: FlaskConical, label: "Laboratory", items: ["Computer Lab 1", "Computer Lab 2", "Physics Lab", "Chemistry Lab", "Electronics Lab"] },
  { id: "library", icon: Library, label: "Library Space", items: ["Reading Room A", "Reading Room B", "Group Study 1", "Group Study 2", "Silent Zone"] },
  { id: "study", icon: BookOpenCheck, label: "Study Area", items: ["Collaboration Hub", "Open Study 1", "Open Study 2", "Outdoor Pavilion", "Café Study Zone"] },
];

const BookingsPage = () => {
  const [selectedType, setSelectedType] = useState("hall");
  const [booked, setBooked] = useState(false);

  const currentFacility = facilityTypes.find(f => f.id === selectedType)!;

  const handleBook = (e: React.FormEvent) => {
    e.preventDefault();
    setBooked(true);
    toast.success("Booking confirmed! Check your email for details.");
    setTimeout(() => setBooked(false), 3000);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
            <span className="text-primary font-semibold text-sm uppercase tracking-wider">Reserve</span>
            <h1 className="font-heading text-4xl md:text-5xl font-bold text-foreground mt-3">Book Campus Facilities</h1>
            <p className="text-muted-foreground mt-4 max-w-xl mx-auto">Reserve lecture halls, labs, library spaces and study areas for your academic needs.</p>
          </motion.div>

          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {facilityTypes.map((ft) => (
              <button
                key={ft.id}
                onClick={() => setSelectedType(ft.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm transition-all ${
                  selectedType === ft.id
                    ? "bg-primary text-primary-foreground shadow-card"
                    : "bg-card text-muted-foreground border border-border hover:border-primary/30"
                }`}
              >
                <ft.icon className="w-4 h-4" />
                {ft.label}
              </button>
            ))}
          </div>

          <motion.div
            key={selectedType}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto bg-card rounded-2xl p-8 shadow-card border border-border"
          >
            {booked ? (
              <div className="text-center py-12">
                <CheckCircle className="w-16 h-16 text-primary mx-auto mb-4" />
                <h3 className="font-heading text-2xl font-bold text-foreground mb-2">Booking Confirmed!</h3>
                <p className="text-muted-foreground">You will receive a confirmation email shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleBook} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Full Name</Label>
                    <Input placeholder="Enter your name" required className="mt-1.5" />
                  </div>
                  <div>
                    <Label>Student / Staff ID</Label>
                    <Input placeholder="e.g. ZU2024001" required className="mt-1.5" />
                  </div>
                </div>
                <div>
                  <Label>Select {currentFacility.label}</Label>
                  <Select required>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder={`Choose a ${currentFacility.label.toLowerCase()}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {currentFacility.items.map(item => (
                        <SelectItem key={item} value={item}>{item}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Date</Label>
                    <Input type="date" required className="mt-1.5" />
                  </div>
                  <div>
                    <Label>Time Slot</Label>
                    <Select required>
                      <SelectTrigger className="mt-1.5">
                        <SelectValue placeholder="Select time" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="8-10">8:00 AM - 10:00 AM</SelectItem>
                        <SelectItem value="10-12">10:00 AM - 12:00 PM</SelectItem>
                        <SelectItem value="1-3">1:00 PM - 3:00 PM</SelectItem>
                        <SelectItem value="3-5">3:00 PM - 5:00 PM</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Purpose</Label>
                  <Input placeholder="Brief description of your booking purpose" className="mt-1.5" />
                </div>
                <Button type="submit" size="lg" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground border-0">
                  Confirm Booking
                </Button>
              </form>
            )}
          </motion.div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default BookingsPage;
