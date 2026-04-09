import { useEffect, useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  MapPin,
  Users,
  ArrowRight,
  Building2,
  DoorOpen,
  CheckCircle2,
  Armchair,
  Clock,
  Layers,
} from "lucide-react";
import { Link } from "react-router-dom";
import facilityService from "@/services/facilityService";
import {
  buildings as fallbackBuildings,
  floors as fallbackFloors,
  rooms as fallbackRooms,
} from "@/data/campusManagementData";
import type { Building, Floor, Room } from "@/types/campusManagement";

/* ---------- Room type fallback images ---------- */

const ROOM_TYPE_IMAGES: Record<string, string> = {
  "Lecture Hall":
    "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&q=80",
  Laboratory:
    "https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=800&q=80",
  "Computer Lab":
    "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&q=80",
  Library:
    "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=800&q=80",
  Auditorium:
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80",
  "Seminar Hall":
    "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&q=80",
  "Meeting Room":
    "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",
  "Discussion Room":
    "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",
  "Tutorial Room":
    "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&q=80",
  "Research Room":
    "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&q=80",
};

const BUILDING_FALLBACK =
  "https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?w=800&q=80";

const getRoomImage = (room: Room, building?: Building): string => {
  if (room.imageUrl) return room.imageUrl;
  if (building?.imageUrl) return building.imageUrl;
  return (
    ROOM_TYPE_IMAGES[room.type] ||
    `https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80`
  );
};

/* ---------- Types ---------- */

type StatItem = {
  value: number;
  label: string;
  icon: typeof Building2;
  suffix?: string;
};

type FeaturedRoom = {
  id: string;
  name: string;
  type: string;
  building: string;
  floor: string;
  capacity: number;
  image: string;
  facilities: string[];
};

type BuildingCard = {
  id: string;
  name: string;
  type: string;
  campus: string;
  location: string;
  totalFloors: number;
  image: string;
  status: string;
  roomCount: number;
  totalCapacity: number;
};

/* ---------- Helpers ---------- */

const buildStats = (buildings: Building[], rooms: Room[]): StatItem[] => {
  const active = buildings.filter((b) => b.status === "Active");
  const available = rooms.filter(
    (r) => r.status === "Available" && r.bookingAvailable
  );
  const totalCapacity = rooms.reduce((s, r) => s + r.maxOccupancy, 0);

  return [
    { value: active.length, label: "Active Buildings", icon: Building2 },
    { value: rooms.length, label: "Total Rooms", icon: DoorOpen },
    { value: available.length, label: "Available Now", icon: CheckCircle2 },
    {
      value: totalCapacity,
      label: "Total Seats",
      icon: Armchair,
      suffix: "+",
    },
  ];
};

const toFeaturedRooms = (
  buildings: Building[],
  floors: Floor[],
  rooms: Room[]
): FeaturedRoom[] => {
  const buildingById = new Map(buildings.map((b) => [b.id, b]));
  const floorById = new Map(floors.map((f) => [f.id, f]));

  return rooms
    .filter(
      (room) => room.status === "Available" && room.bookingAvailable
    )
    .slice(0, 3)
    .map((room) => {
      const building = buildingById.get(room.buildingId);
      const floor = floorById.get(room.floorId);
      return {
        id: room.id,
        name: room.name,
        type: room.type,
        building: building?.name || "Campus Building",
        floor: floor?.floorName || "Floor",
        capacity: room.maxOccupancy,
        image: getRoomImage(room, building),
        facilities: room.facilities?.slice(0, 3) || [],
      };
    });
};

const toBuildingCards = (
  buildings: Building[],
  rooms: Room[]
): BuildingCard[] => {
  return buildings
    .filter((b) => b.status === "Active")
    .slice(0, 4)
    .map((b) => {
      const buildingRooms = rooms.filter((r) => r.buildingId === b.id);
      return {
        id: b.id,
        name: b.name,
        type: b.type,
        campus: b.campus,
        location: b.location,
        totalFloors: b.totalFloors,
        image: b.imageUrl || BUILDING_FALLBACK,
        status: b.status,
        roomCount: buildingRooms.length,
        totalCapacity: buildingRooms.reduce(
          (s, r) => s + r.maxOccupancy,
          0
        ),
      };
    });
};

/* ---------- Animated counter ---------- */

const AnimatedCounter = ({
  value,
  suffix = "",
}: {
  value: number;
  suffix?: string;
}) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const duration = 2000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [inView, value]);

  return (
    <span ref={ref}>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
};

/* ---------- Main component ---------- */

const StatsSection = () => {
  const [stats, setStats] = useState<StatItem[]>(
    buildStats(fallbackBuildings, fallbackRooms)
  );
  const [featuredRooms, setFeaturedRooms] = useState<FeaturedRoom[]>(
    toFeaturedRooms(fallbackBuildings, fallbackFloors, fallbackRooms)
  );
  const [buildingCards, setBuildingCards] = useState<BuildingCard[]>(
    toBuildingCards(fallbackBuildings, fallbackRooms)
  );
  const [dataSource, setDataSource] = useState<"fallback" | "api">("fallback");

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        // Use the cached snapshot for efficiency
        const snapshot = await facilityService.getFacilitySnapshot();
        const { buildings, floors, rooms } = snapshot;

        if (!mounted || rooms.length === 0) return;

        setStats(buildStats(buildings, rooms));
        setFeaturedRooms(toFeaturedRooms(buildings, floors, rooms));
        setBuildingCards(toBuildingCards(buildings, rooms));
        setDataSource("api");
      } catch {
        // Keep fallback data
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <>
      {/* ===== Stats Bar ===== */}
      <section
        id="stats-section"
        className="py-20 bg-primary relative overflow-hidden"
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-accent rounded-full blur-[100px]" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-14"
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-3">
              Campus at a Glance
            </h2>
            <p className="text-primary-foreground/60 max-w-lg mx-auto">
              {dataSource === "api"
                ? "Live data from our campus management system"
                : "Real-time campus data powering your academic experience"}
            </p>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="text-center group"
              >
                <div className="relative p-6 rounded-2xl bg-primary-foreground/5 border border-primary-foreground/10 backdrop-blur-sm hover:bg-primary-foreground/10 transition-all duration-300">
                  <div className="w-12 h-12 rounded-xl bg-accent/15 flex items-center justify-center mx-auto mb-4 group-hover:bg-accent/25 transition-colors">
                    <s.icon className="h-6 w-6 text-accent" />
                  </div>
                  <div className="font-display text-3xl md:text-4xl font-bold text-accent mb-2">
                    <AnimatedCounter value={s.value} suffix={s.suffix} />
                  </div>
                  <div className="text-sm text-primary-foreground/65 font-medium">
                    {s.label}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Buildings Showcase ===== */}
      {buildingCards.length > 0 && (
        <section id="buildings-showcase" className="py-24 bg-background">
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
                  <span className="text-sm font-medium text-accent tracking-wide uppercase">
                    Our Campus
                  </span>
                </div>
                <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">
                  Campus Buildings
                </h2>
                <p className="text-muted-foreground mt-2 max-w-md">
                  Explore our state-of-the-art campus facilities and academic
                  buildings.
                </p>
              </div>
              <Link
                to="/find-room"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors group"
              >
                Explore Campus
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {buildingCards.map((building, i) => (
                <motion.div
                  key={building.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                >
                  <div className="group rounded-2xl overflow-hidden border border-border/60 bg-card shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full flex flex-col">
                    {/* Building Image */}
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={building.image}
                        alt={building.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                        width={800}
                        height={400}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = BUILDING_FALLBACK;
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

                      {/* Type badge */}
                      <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-primary/80 text-primary-foreground text-xs font-semibold backdrop-blur-sm">
                        {building.type}
                      </span>

                      {/* Status badge */}
                      <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-green-500/90 text-white text-xs font-semibold backdrop-blur-sm flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        Active
                      </span>

                      <span className="absolute bottom-3 left-3 text-white font-display text-lg font-semibold drop-shadow-md leading-tight">
                        {building.name}
                      </span>
                    </div>

                    {/* Building Details */}
                    <div className="p-5 flex-1 flex flex-col">
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
                        <MapPin className="h-3.5 w-3.5 text-accent flex-shrink-0" />
                        <span className="truncate">{building.campus}</span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 mt-auto">
                        <div className="text-center p-2 rounded-lg bg-muted/50">
                          <Layers className="h-3.5 w-3.5 text-accent mx-auto mb-1" />
                          <p className="text-sm font-semibold text-foreground">
                            {building.totalFloors}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            Floors
                          </p>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-muted/50">
                          <DoorOpen className="h-3.5 w-3.5 text-accent mx-auto mb-1" />
                          <p className="text-sm font-semibold text-foreground">
                            {building.roomCount}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            Rooms
                          </p>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-muted/50">
                          <Users className="h-3.5 w-3.5 text-accent mx-auto mb-1" />
                          <p className="text-sm font-semibold text-foreground">
                            {building.totalCapacity}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            Seats
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== Featured Rooms ===== */}
      {featuredRooms.length > 0 && (
        <section id="featured-rooms" className="py-24 bg-muted/30">
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
                  <span className="text-sm font-medium text-accent tracking-wide uppercase">
                    Book Now
                  </span>
                </div>
                <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">
                  Popular Rooms
                </h2>
                <p className="text-muted-foreground mt-2 max-w-md">
                  Browse our most booked rooms and find the perfect space for
                  your needs.
                </p>
              </div>
              <Link
                to="/find-room"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors group"
              >
                View All Rooms
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-7">
              {featuredRooms.map((room, index) => (
                <motion.div
                  key={room.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <div className="group rounded-2xl overflow-hidden border border-border/60 bg-card shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    {/* Image */}
                    <div className="relative h-52 overflow-hidden">
                      <img
                        src={room.image}
                        alt={room.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                        width={1200}
                        height={800}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            ROOM_TYPE_IMAGES[room.type] ||
                            BUILDING_FALLBACK;
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                      <span className="absolute top-3 right-3 px-3 py-1 rounded-full bg-green-500/90 text-white text-xs font-semibold backdrop-blur-sm flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        Available
                      </span>
                      <span className="absolute bottom-3 left-3 text-white font-display text-lg font-semibold drop-shadow-md">
                        {room.name}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="inline-block px-2.5 py-0.5 rounded-full bg-accent/10 text-xs font-medium text-accent">
                          {room.type}
                        </span>
                        {room.facilities.length > 0 && (
                          <span className="inline-block px-2.5 py-0.5 rounded-full bg-muted text-xs font-medium text-muted-foreground">
                            {room.facilities[0]}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-accent" />
                          <span className="truncate">
                            {room.floor}, {room.building}
                          </span>
                        </span>
                        <span className="flex items-center gap-1.5 flex-shrink-0">
                          <Users className="h-3.5 w-3.5 text-accent" />
                          {room.capacity} seats
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
};

export default StatsSection;
