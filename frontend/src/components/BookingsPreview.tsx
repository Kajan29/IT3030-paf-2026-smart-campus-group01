import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import facilityService from "@/services/facilityService";
import {
  buildings as fallbackBuildings,
  floors as fallbackFloors,
  rooms as fallbackRooms,
} from "@/data/campusManagementData";
import type { Building, Floor, Room } from "@/types/campusManagement";

type StatItem = {
  value: string;
  label: string;
};

type FeaturedRoom = {
  id: string;
  name: string;
  type: string;
  building: string;
  floor: string;
  capacity: number;
  image: string;
};

const buildStats = (buildings: Building[], rooms: Room[]): StatItem[] => {
  const availableRooms = rooms.filter((room) => room.status === "Available" && room.bookingAvailable).length;
  const totalCapacity = rooms.reduce((sum, room) => sum + room.maxOccupancy, 0);

  return [
    { value: String(buildings.length), label: "Campus Buildings" },
    { value: String(rooms.length), label: "Managed Rooms" },
    { value: String(availableRooms), label: "Available Rooms" },
    { value: totalCapacity.toLocaleString(), label: "Seat Capacity" },
  ];
};

const fallbackStats = buildStats(fallbackBuildings, fallbackRooms);

const toFeaturedRooms = (buildings: Building[], floors: Floor[], rooms: Room[]): FeaturedRoom[] => {
  const buildingById = new Map(buildings.map((building) => [building.id, building]));
  const floorById = new Map(floors.map((floor) => [floor.id, floor]));

  return rooms
    .filter((room) => room.status === "Available" && room.bookingAvailable)
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
        image: room.imageUrl || building?.imageUrl || `https://picsum.photos/seed/home-room-${room.id}/1200/800`,
      };
    });
};

const fallbackFeaturedRooms = toFeaturedRooms(fallbackBuildings, fallbackFloors, fallbackRooms);

const StatsSection = () => {
  const [stats, setStats] = useState<StatItem[]>(fallbackStats);
  const [featuredRooms, setFeaturedRooms] = useState<FeaturedRoom[]>(fallbackFeaturedRooms);

  useEffect(() => {
    let mounted = true;

    const loadStats = async () => {
      try {
        const [buildings, floors, rooms] = await Promise.all([
          facilityService.getBuildings(),
          facilityService.getFloors(),
          facilityService.getRooms(),
        ]);

        if (!mounted || rooms.length === 0) {
          return;
        }

        setStats(buildStats(buildings, rooms));
        setFeaturedRooms(toFeaturedRooms(buildings, floors, rooms));
      } catch {
        // Keep fallback stats if API is unavailable.
      }
    };

    loadStats();
    return () => {
      mounted = false;
    };
  }, []);

  return (
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

        {featuredRooms.length > 0 && (
          <div className="mt-12">
            <h3 className="font-display text-2xl font-semibold text-primary-foreground mb-5 text-center">Featured Rooms</h3>
            <div className="grid md:grid-cols-3 gap-5">
              {featuredRooms.map((room, index) => (
                <motion.div
                  key={room.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: index * 0.08 }}
                >
                  <Card className="overflow-hidden border-none bg-white/95">
                    <img src={room.image} alt={room.name} className="h-40 w-full object-cover" loading="lazy" width={1200} height={800} />
                    <div className="p-4">
                      <h4 className="font-semibold text-foreground">{room.name}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{room.type}</p>
                      <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" /> {room.floor}, {room.building}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" /> Capacity {room.capacity}
                      </p>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default StatsSection;
