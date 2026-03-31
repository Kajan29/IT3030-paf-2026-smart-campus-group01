import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, Users, MapPin, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import heroCampus from "@/assets/hero-campus.jpg";
import lectureHall from "@/assets/lecture-hall.jpg";
import library from "@/assets/library.jpg";

const rooms = [
  { id: 1, name: "Study Room A", capacity: 6, floor: "1st Floor", type: "Study Room", image: heroCampus, available: true },
  { id: 2, name: "Lecture Hall 101", capacity: 120, floor: "1st Floor", type: "Lecture Hall", image: lectureHall, available: true },
  { id: 3, name: "Computer Lab B", capacity: 40, floor: "2nd Floor", type: "Computer Lab", image: library, available: false },
  { id: 4, name: "Study Room C", capacity: 8, floor: "2nd Floor", type: "Study Room", image: heroCampus, available: true },
  { id: 5, name: "Lecture Hall 202", capacity: 80, floor: "3rd Floor", type: "Lecture Hall", image: lectureHall, available: true },
  { id: 6, name: "Computer Lab D", capacity: 30, floor: "3rd Floor", type: "Computer Lab", image: library, available: true },
];

const timeSlots = ["08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM"];

const BookRoomPage = () => {
  const [selectedRoom, setSelectedRoom] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [filter, setFilter] = useState("All");
  const [booked, setBooked] = useState(false);

  const filtered = filter === "All" ? rooms : rooms.filter((r) => r.type === filter);

  const handleBook = () => {
    if (selectedRoom && selectedDate && selectedTime) {
      setBooked(true);
      setTimeout(() => setBooked(false), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-24 pb-16 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={heroCampus} alt="Room booking" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-primary/80" />
        </div>
        <div className="container mx-auto px-4 relative z-10 text-center py-16">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-4xl md:text-5xl font-bold text-primary-foreground mb-4"
          >
            Book a Room
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-primary-foreground/80 text-lg max-w-2xl mx-auto"
          >
            Reserve study rooms, lecture halls, and computer labs for your academic needs.
          </motion.p>
        </div>
      </section>

      {/* Booking Section */}
      <section className="container mx-auto px-4 py-16">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-8">
          {["All", "Study Room", "Lecture Hall", "Computer Lab"].map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              onClick={() => setFilter(f)}
              className={filter === f ? "bg-accent text-accent-foreground hover:bg-accent/90" : "border-border"}
            >
              {f}
            </Button>
          ))}
        </div>

        {/* Date & Time */}
        <div className="grid md:grid-cols-2 gap-4 mb-10">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-accent" /> Select Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full p-3 rounded-lg border border-border bg-card text-foreground"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
              <Clock className="h-4 w-4 text-accent" /> Select Time Slot
            </label>
            <div className="flex flex-wrap gap-2">
              {timeSlots.map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedTime(t)}
                  className={`px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                    selectedTime === t
                      ? "bg-accent text-accent-foreground"
                      : "bg-muted text-muted-foreground hover:bg-accent/20"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Room Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((room, i) => (
            <motion.div
              key={room.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card
                className={`overflow-hidden cursor-pointer transition-all border-2 ${
                  selectedRoom === room.id ? "border-accent shadow-lg" : "border-transparent hover:border-accent/30"
                } ${!room.available ? "opacity-60" : ""}`}
                onClick={() => room.available && setSelectedRoom(room.id)}
              >
                <img src={room.image} alt={room.name} className="w-full h-48 object-cover" loading="lazy" width={1280} height={720} />
                <div className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-display text-lg font-semibold text-foreground">{room.name}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${room.available ? "bg-green-100 text-green-700" : "bg-destructive/10 text-destructive"}`}>
                      {room.available ? "Available" : "Occupied"}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Users className="h-4 w-4" /> {room.capacity}</span>
                    <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {room.floor}</span>
                  </div>
                  {selectedRoom === room.id && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 flex items-center gap-1 text-accent text-sm font-medium">
                      <CheckCircle className="h-4 w-4" /> Selected
                    </motion.div>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Book Button */}
        <div className="mt-10 text-center">
          <Button
            size="lg"
            disabled={!selectedRoom || !selectedDate || !selectedTime}
            onClick={handleBook}
            className="bg-accent text-accent-foreground hover:bg-accent/90 px-10 font-semibold"
          >
            {booked ? "✓ Room Booked Successfully!" : "Confirm Booking"}
          </Button>
          {(!selectedRoom || !selectedDate || !selectedTime) && (
            <p className="text-muted-foreground text-sm mt-2">Please select a room, date, and time slot.</p>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default BookRoomPage;
