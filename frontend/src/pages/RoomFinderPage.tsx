import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Building2,
  DoorOpen,
  Layers,
  MapPin,
  Navigation,
  Search,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import facilityService from "@/services/facilityService";
import type { Building, Floor, Room } from "@/types/campusManagement";
import {
  buildings as fallbackBuildings,
  floors as fallbackFloors,
  rooms as fallbackRooms,
} from "@/data/campusManagementData";
import heroCampus from "@/assets/hero-campus.jpg";

type RoomRouteResult = {
  room: Room;
  building: Building;
  floor: Floor;
};

const toFloorLabel = (floorNumber: number, floorName?: string): string => {
  if (floorName?.trim()) return floorName;
  if (floorNumber === 0) return "Ground Floor";
  return `Floor ${floorNumber}`;
};

const RoomFinderPage = (): JSX.Element => {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selectedResult, setSelectedResult] = useState<RoomRouteResult | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        const [buildingData, floorData, roomData] = await Promise.all([
          facilityService.getBuildings(),
          facilityService.getFloors(),
          facilityService.getRooms(),
        ]);

        if (!mounted) return;

        if (buildingData.length > 0 && floorData.length > 0 && roomData.length > 0) {
          setBuildings(buildingData);
          setFloors(floorData);
          setRooms(roomData);
        } else {
          setBuildings(fallbackBuildings);
          setFloors(fallbackFloors);
          setRooms(fallbackRooms);
        }
      } catch {
        if (!mounted) return;
        setBuildings(fallbackBuildings);
        setFloors(fallbackFloors);
        setRooms(fallbackRooms);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadData();
    return () => {
      mounted = false;
    };
  }, []);

  const routeResults = useMemo<RoomRouteResult[]>(() => {
    const floorMap = new Map(floors.map((floor) => [floor.id, floor]));
    const buildingMap = new Map(buildings.map((building) => [building.id, building]));

    return rooms
      .map((room) => {
        const floor = floorMap.get(room.floorId);
        const building = buildingMap.get(room.buildingId);
        if (!floor || !building) return null;
        return { room, floor, building };
      })
      .filter((result): result is RoomRouteResult => Boolean(result));
  }, [buildings, floors, rooms]);

  const filteredResults = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return routeResults;

    return routeResults.filter(({ room, building, floor }) => {
      const searchableText = [
        room.name,
        room.code,
        room.type,
        building.name,
        building.code,
        building.location,
        building.campus,
        floor.floorName,
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedQuery);
    });
  }, [query, routeResults]);

  useEffect(() => {
    if (!selectedResult) return;

    const stillExists = filteredResults.some(
      (result) => result.room.id === selectedResult.room.id,
    );

    if (!stillExists) {
      setSelectedResult(null);
    }
  }, [filteredResults, selectedResult]);

  const getDirectionSteps = (result: RoomRouteResult) => {
    const floorLabel = toFloorLabel(result.floor.floorNumber, result.floor.floorName);
    return [
      `Go to ${result.building.campus} and enter ${result.building.name} (${result.building.code}).`,
      `Use the elevator or stairs to reach ${floorLabel}.`,
      `Follow the corridor signs and find room ${result.room.code} - ${result.room.name}.`,
    ];
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="relative pt-24 pb-16 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={heroCampus} alt="Campus route guide" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-primary/80" />
        </div>
        <div className="container mx-auto px-4 relative z-10 text-center py-16">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-4xl md:text-5xl font-bold text-primary-foreground mb-4"
          >
            Find a Room
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-primary-foreground/85 text-lg max-w-2xl mx-auto"
          >
            Search by room name or code, then click a room to see exactly which building and floor it is on.
          </motion.p>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-16 -mt-8 relative z-10">
        <div className="grid lg:grid-cols-[1.1fr_1fr] gap-6">
          <div className="bg-card border border-border rounded-2xl shadow-card p-5 md:p-6">
            <div className="relative mb-5">
              <Search className="h-5 w-5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search room code, name, building, or floor"
                className="w-full rounded-xl border border-input bg-background pl-10 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {loading ? (
              <div className="text-muted-foreground text-sm py-6">Loading rooms...</div>
            ) : filteredResults.length === 0 ? (
              <div className="text-muted-foreground text-sm py-6">
                No rooms found. Try searching with a room code like MAB-101.
              </div>
            ) : (
              <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
                {filteredResults.map((result, index) => {
                  const isSelected = selectedResult?.room.id === result.room.id;
                  return (
                    <motion.button
                      type="button"
                      key={result.room.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      onClick={() => setSelectedResult(result)}
                      className={`w-full text-left rounded-xl border p-4 transition-all ${
                        isSelected
                          ? "border-accent bg-accent/10"
                          : "border-border bg-background hover:border-accent/50"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-foreground">{result.room.name}</p>
                          <p className="text-sm text-muted-foreground">{result.room.code} • {result.room.type}</p>
                        </div>
                        <span className="text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground">
                          {result.room.status}
                        </span>
                      </div>
                      <div className="mt-3 grid sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          <span>{result.building.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Layers className="h-4 w-4" />
                          <span>{toFloorLabel(result.floor.floorNumber, result.floor.floorName)}</span>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-card border border-border rounded-2xl shadow-card p-5 md:p-6">
            {!selectedResult ? (
              <div className="h-full min-h-[260px] grid place-items-center text-center text-muted-foreground">
                <div>
                  <Navigation className="h-10 w-10 mx-auto mb-3 text-accent" />
                  <p className="font-medium text-foreground">Select a room to view its route</p>
                  <p className="text-sm mt-1">You will see the building, floor, and simple directions.</p>
                </div>
              </div>
            ) : (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <h2 className="font-display text-2xl font-bold text-foreground mb-4">Room Route Details</h2>

                <div className="space-y-4">
                  <div className="rounded-xl border border-border p-4 bg-background">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Destination</p>
                    <p className="font-semibold text-foreground">{selectedResult.room.code} - {selectedResult.room.name}</p>
                    <p className="text-sm text-muted-foreground mt-1">{selectedResult.room.type}</p>
                  </div>

                  <div className="rounded-xl border border-border p-4 bg-background">
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-accent mt-0.5" />
                      <div>
                        <p className="font-semibold text-foreground">
                          {selectedResult.building.name} ({selectedResult.building.code})
                        </p>
                        <p className="text-sm text-muted-foreground">{selectedResult.building.location}</p>
                        <p className="text-sm text-muted-foreground">Campus: {selectedResult.building.campus}</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border p-4 bg-background">
                    <div className="flex items-start gap-3">
                      <Layers className="h-5 w-5 text-accent mt-0.5" />
                      <div>
                        <p className="font-semibold text-foreground">
                          {toFloorLabel(selectedResult.floor.floorNumber, selectedResult.floor.floorName)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Accessibility: {selectedResult.floor.accessibility}
                        </p>
                        <p className="text-sm text-muted-foreground">{selectedResult.floor.description}</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border p-4 bg-background">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-3">How to Reach</p>
                    <div className="space-y-2">
                      {getDirectionSteps(selectedResult).map((step) => (
                        <div key={step} className="flex items-start gap-2 text-sm text-foreground">
                          <ArrowRight className="h-4 w-4 text-accent mt-0.5" />
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl border border-border p-4 bg-background">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Room Info</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <DoorOpen className="h-4 w-4" />
                        <span>Status: {selectedResult.room.status}</span>
                      </div>
                      <div className="text-muted-foreground">Capacity: {selectedResult.room.maxOccupancy}</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default RoomFinderPage;
