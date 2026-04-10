import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Building2,
  CheckCircle,
  Clock3,
  Compass,
  DoorOpen,
  Filter,
  Footprints,
  Layers,
  MapPin,
  Monitor,
  Navigation,
  Projector,
  Search,
  Snowflake,
  ThermometerSun,
  Users,
  Wifi,
  X,
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
import lectureHallImg from "@/assets/lecture-hall.jpg";
import libraryImg from "@/assets/library.jpg";
import libraryInteriorImg from "@/assets/library-interior.png";
import scienceLabImg from "@/assets/science-lab.png";
import campusAerialImg from "@/assets/campus-aerial.png";

type RoomRouteResult = {
  room: Room;
  building: Building;
  floor: Floor;
};

type RoomTypeFilter = "All" | string;

const roomTypeImageMap: Record<string, string> = {
  "Lecture Hall": lectureHallImg,
  "Tutorial Room": lectureHallImg,
  "Seminar Hall": lectureHallImg,
  "Laboratory": scienceLabImg,
  "Computer Lab": scienceLabImg,
  "Server Room": scienceLabImg,
  "Research Room": scienceLabImg,
  "Library": libraryImg,
  "Discussion Room": libraryInteriorImg,
  "Auditorium": campusAerialImg,
  "Multipurpose Hall": campusAerialImg,
};

const resolveRoomImage = (room: Room): string => {
  if (room.imageUrl) return room.imageUrl;
  return roomTypeImageMap[room.type] || heroCampus;
};

/** Returns the local fallback image for a room type (used when external URL fails) */
const getFallbackImage = (room: Room): string =>
  roomTypeImageMap[room.type] || heroCampus;

/** onError handler for room images — swaps to a local fallback */
const handleImageError = (
  e: React.SyntheticEvent<HTMLImageElement>,
  room: Room,
) => {
  const fallback = getFallbackImage(room);
  if (e.currentTarget.src !== fallback) {
    e.currentTarget.src = fallback;
  }
};

const toFloorLabel = (floorNumber: number, floorName?: string): string => {
  if (floorName?.trim()) return floorName;
  if (floorNumber === 0) return "Ground Floor";
  return `Floor ${floorNumber}`;
};

const statusConfig: Record<string, { class: string; icon: React.ReactNode; label: string }> = {
  Available: {
    class: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800",
    icon: <CheckCircle className="h-3 w-3" />,
    label: "Available",
  },
  Occupied: {
    class: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800",
    icon: <DoorOpen className="h-3 w-3" />,
    label: "Occupied",
  },
  "Under Maintenance": {
    class: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800",
    icon: <DoorOpen className="h-3 w-3" />,
    label: "Maintenance",
  },
  Inactive: {
    class: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700",
    icon: <DoorOpen className="h-3 w-3" />,
    label: "Inactive",
  },
};

const getStatusInfo = (status?: string) => {
  if (!status) return statusConfig.Inactive;
  if (statusConfig[status]) return statusConfig[status];
  const n = status.trim().toLowerCase();
  if (n.includes("avail")) return statusConfig.Available;
  if (n.includes("occup")) return statusConfig.Occupied;
  if (n.includes("maint")) return statusConfig["Under Maintenance"];
  return statusConfig.Inactive;
};

const amenityIcons: Record<string, React.ReactNode> = {
  WiFi: <Wifi className="h-3.5 w-3.5" />,
  Projector: <Projector className="h-3.5 w-3.5" />,
  "Smart Board": <Monitor className="h-3.5 w-3.5" />,
  Computer: <Monitor className="h-3.5 w-3.5" />,
};

const RoomFinderPage = (): JSX.Element => {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [activeType, setActiveType] = useState<RoomTypeFilter>("All");
  const [activeBuilding, setActiveBuilding] = useState<string>("All");
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

  const roomTypes = useMemo(() => {
    const types = new Set(routeResults.map((r) => r.room.type));
    return ["All", ...Array.from(types).sort()];
  }, [routeResults]);

  const buildingNames = useMemo(() => {
    const names = new Map<string, string>();
    routeResults.forEach((r) => names.set(r.building.id, r.building.name));
    return [{ id: "All", name: "All Buildings" }, ...Array.from(names.entries()).map(([id, name]) => ({ id, name }))];
  }, [routeResults]);

  const filteredResults = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return routeResults.filter(({ room, building, floor }) => {
      if (activeType !== "All" && room.type !== activeType) return false;
      if (activeBuilding !== "All" && building.id !== activeBuilding) return false;

      if (normalizedQuery) {
        const searchableText = [
          room.name, room.code, room.type,
          building.name, building.code, building.location, building.campus,
          floor.floorName,
        ].join(" ").toLowerCase();
        if (!searchableText.includes(normalizedQuery)) return false;
      }

      return true;
    });
  }, [query, activeType, activeBuilding, routeResults]);

  const getDirectionSteps = (result: RoomRouteResult) => {
    const floorLabel = toFloorLabel(result.floor.floorNumber, result.floor.floorName);
    const isGroundFloor = result.floor.floorNumber === 0;
    return [
      {
        icon: MapPin,
        title: "Find the Campus",
        desc: `Go to ${result.building.campus}. The building is located at ${result.building.location}.`,
        color: "text-blue-600 dark:text-blue-400",
        bg: "bg-blue-100 dark:bg-blue-900/30",
      },
      {
        icon: Building2,
        title: `Enter ${result.building.code}`,
        desc: `Look for ${result.building.name} (${result.building.code})${result.building.openingTime ? ` — opens at ${result.building.openingTime}` : ""}.`,
        color: "text-violet-600 dark:text-violet-400",
        bg: "bg-violet-100 dark:bg-violet-900/30",
      },
      {
        icon: isGroundFloor ? Footprints : Layers,
        title: isGroundFloor ? "Stay on Ground Floor" : `Go to ${floorLabel}`,
        desc: isGroundFloor
          ? `Your room is on the ground floor — no stairs or elevator needed.`
          : `Take the elevator or stairs to ${floorLabel}. ${result.floor.accessibility === "Accessible" ? "This floor is fully wheelchair accessible." : result.floor.accessibility === "Partial" ? "This floor has partial accessibility." : ""}`,
        color: "text-amber-600 dark:text-amber-400",
        bg: "bg-amber-100 dark:bg-amber-900/30",
      },
      {
        icon: DoorOpen,
        title: `Arrive at ${result.room.code}`,
        desc: `Follow corridor signs to room ${result.room.code} — ${result.room.name}. ${result.room.type} with capacity for ${result.room.maxOccupancy || result.room.seatingCapacity} people.`,
        color: "text-emerald-600 dark:text-emerald-400",
        bg: "bg-emerald-100 dark:bg-emerald-900/30",
      },
    ];
  };

  const stats = useMemo(() => ({
    totalRooms: routeResults.length,
    totalBuildings: new Set(routeResults.map((r) => r.building.id)).size,
    availableRooms: routeResults.filter((r) => r.room.status?.toLowerCase().includes("avail")).length,
  }), [routeResults]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-24 pb-16 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={heroCampus} alt="Campus" className="w-full h-full object-cover" />
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
            Browse every room across campus. Filter by type or building, then click for directions.
          </motion.p>

          {/* Quick Stats */}
          {!loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="flex flex-wrap items-center justify-center gap-6 mt-8"
            >
              {[
                { label: "Total Rooms", value: stats.totalRooms, icon: DoorOpen },
                { label: "Buildings", value: stats.totalBuildings, icon: Building2 },
                { label: "Available Now", value: stats.availableRooms, icon: CheckCircle },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center gap-3 bg-white/10 backdrop-blur-sm px-5 py-3 rounded-xl">
                  <stat.icon className="h-5 w-5 text-primary-foreground/80" />
                  <div className="text-left">
                    <p className="text-2xl font-bold text-primary-foreground">{stat.value}</p>
                    <p className="text-xs text-primary-foreground/70">{stat.label}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* Elevated Search Box */}
      <section className="container mx-auto px-4 -mt-8 relative z-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="max-w-2xl mx-auto bg-card border border-border rounded-2xl shadow-xl p-5"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Search className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 relative">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search rooms — try a name, code, building, or type..."
                className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground/60"
              />
            </div>
          </div>
          {query.trim() && (
            <p className="text-xs text-muted-foreground mt-2 ml-14">
              {filteredResults.length} result{filteredResults.length !== 1 ? "s" : ""} for "{query.trim()}"
            </p>
          )}
        </motion.div>
      </section>

      {/* Filters + Grid */}
      <section className="container mx-auto px-4 py-10">
        {/* Room Type Filters */}
        <div className="flex flex-wrap gap-2 justify-center mb-4">
          {roomTypes.map((type) => (
            <button
              key={type}
              onClick={() => setActiveType(type)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeType === type
                  ? "bg-accent text-accent-foreground shadow-md"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              {type === "All" ? <Filter className="h-3.5 w-3.5" /> : <DoorOpen className="h-3.5 w-3.5" />}
              {type}
            </button>
          ))}
        </div>

        {/* Building Filter */}
        <div className="flex flex-wrap gap-2 justify-center mb-10">
          {buildingNames.map((b) => (
            <button
              key={b.id}
              onClick={() => setActiveBuilding(b.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                activeBuilding === b.id
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              <Building2 className="h-3 w-3" />
              {b.name}
            </button>
          ))}
        </div>

        {/* Results Grid */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl overflow-hidden animate-pulse">
                <div className="h-44 bg-muted" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                  <div className="h-3 bg-muted rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredResults.length === 0 ? (
          <div className="text-center py-20">
            <DoorOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground/40" />
            <p className="text-lg font-medium text-foreground mb-1">No rooms found</p>
            <p className="text-sm text-muted-foreground">Try a different search term, room type, or building filter.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredResults.map((result, index) => {
              const { room, building, floor } = result;
              const statusInfo = getStatusInfo(room.status);
              const facilities = Array.isArray(room.facilities) ? room.facilities : [];

              return (
                <motion.button
                  type="button"
                  key={room.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  whileHover={{ y: -4 }}
                  onClick={() => setSelectedResult(result)}
                  className="text-left bg-card border-2 border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:border-primary/50 transition-all group"
                >
                  {/* Image */}
                  <div className="relative h-44 overflow-hidden bg-gradient-to-br from-accent/10 to-primary/10">
                    <img
                      src={resolveRoomImage(room)}
                      alt={room.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      loading="lazy"
                      onError={(e) => handleImageError(e, room)}
                    />

                    {/* Status Badge */}
                    <div className="absolute top-3 right-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-sm flex items-center gap-1.5 ${statusInfo.class}`}>
                        {statusInfo.icon}
                        {statusInfo.label}
                      </span>
                    </div>

                    {/* Room Code Badge */}
                    <div className="absolute top-3 left-3">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary/90 text-primary-foreground backdrop-blur-sm">
                        {room.code}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h3 className="font-display text-lg font-bold text-foreground mb-0.5 group-hover:text-primary transition-colors line-clamp-1">
                      {room.name}
                    </h3>
                    <p className="text-sm text-muted-foreground font-medium mb-3">{room.type}</p>

                    {/* Building & Floor */}
                    <div className="space-y-1 mb-4">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 text-primary/70" />
                        <span className="truncate">{building.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Layers className="h-3 w-3 text-primary/70" />
                        <span>{toFloorLabel(floor.floorNumber, floor.floorName)}</span>
                      </div>
                    </div>

                    {/* Capacity & Hours */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Users className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Capacity</p>
                          <p className="text-sm font-bold text-foreground">{room.maxOccupancy || room.seatingCapacity}</p>
                        </div>
                      </div>
                      {(room.openingTime || room.closingTime) && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock3 className="h-3 w-3" />
                          <span>{room.openingTime || "08:00"} - {room.closingTime || "18:00"}</span>
                        </div>
                      )}
                    </div>

                    {/* Amenities */}
                    {facilities.length > 0 && (
                      <div className="pt-3 border-t border-border">
                        <div className="flex flex-wrap gap-1.5">
                          {facilities.slice(0, 3).map((amenity, i) => (
                            <span
                              key={i}
                              className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-accent/10 text-accent text-xs"
                            >
                              {amenityIcons[amenity] || <CheckCircle className="h-3 w-3" />}
                              {amenity}
                            </span>
                          ))}
                          {facilities.length > 3 && (
                            <span className="px-2 py-0.5 rounded-md bg-muted text-muted-foreground text-xs">
                              +{facilities.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}

        {/* Results count */}
        {!loading && filteredResults.length > 0 && (
          <p className="text-center text-sm text-muted-foreground mt-8">
            Showing {filteredResults.length} of {routeResults.length} rooms
          </p>
        )}
      </section>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedResult && (() => {
          const room = selectedResult.room;
          const building = selectedResult.building;
          const floor = selectedResult.floor;
          const statusInfo = getStatusInfo(room.status);
          const steps = getDirectionSteps(selectedResult);
          const facilities = Array.isArray(room.facilities) ? room.facilities : [];
          const capacity = room.maxOccupancy || room.seatingCapacity;

          return (
          <div
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm p-3 flex items-center justify-center"
            onClick={() => setSelectedResult(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="w-full max-w-[90vw] xl:max-w-7xl bg-card rounded-2xl border border-border shadow-2xl flex flex-col max-h-[96vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* ── Top: Image + Title + Stats (compact) ── */}
              <div className="flex flex-col lg:flex-row shrink-0">
                {/* Image */}
                <div className="relative lg:w-[340px] xl:w-[400px] shrink-0 h-44 lg:h-auto overflow-hidden bg-gradient-to-br from-accent/10 to-primary/10 rounded-t-2xl lg:rounded-tr-none lg:rounded-tl-2xl">
                  <img
                    src={resolveRoomImage(room)}
                    alt={room.name}
                    className="w-full h-full object-cover"
                    onError={(e) => handleImageError(e, room)}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent lg:bg-gradient-to-r" />

                  <button
                    type="button"
                    onClick={() => setSelectedResult(null)}
                    className="absolute top-3 right-3 lg:hidden bg-black/50 text-white rounded-full p-1.5 hover:bg-black/70 transition-colors"
                    aria-label="Close"
                  >
                    <X className="h-4 w-4" />
                  </button>

                  <div className="absolute bottom-3 left-4 right-4">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary text-primary-foreground inline-block mb-1.5">
                      {room.code}
                    </span>
                    <h2 className="font-display text-xl sm:text-2xl font-bold text-white drop-shadow-lg leading-tight">
                      {room.name}
                    </h2>
                    <p className="text-white/70 text-xs mt-0.5">{room.type}</p>
                  </div>
                </div>

                {/* Stats + Location next to image */}
                <div className="flex-1 min-w-0">
                  {/* Close button for desktop */}
                  <div className="hidden lg:flex justify-end p-2">
                    <button
                      type="button"
                      onClick={() => setSelectedResult(null)}
                      className="text-muted-foreground hover:text-foreground rounded-full p-1.5 hover:bg-muted transition-colors"
                      aria-label="Close"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-4 divide-x divide-border border-b border-border bg-muted/30 lg:border-t-0 lg:rounded-tr-2xl overflow-hidden">
                    <div className="flex items-center justify-center gap-1.5 py-2.5 px-1">
                      <Users className="h-3.5 w-3.5 text-primary shrink-0" />
                      <div className="text-center">
                        <p className="text-base font-bold text-foreground leading-none">{capacity}</p>
                        <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Capacity</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-1.5 py-2.5 px-1">
                      <Layers className="h-3.5 w-3.5 text-primary shrink-0" />
                      <div className="text-center">
                        <p className="text-base font-bold text-foreground leading-none">
                          {floor.floorNumber === 0 ? "G" : floor.floorNumber}
                        </p>
                        <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Floor</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-1.5 py-2.5 px-1">
                      <Clock3 className="h-3.5 w-3.5 text-primary shrink-0" />
                      <div className="text-center">
                        <p className="text-xs font-bold text-foreground leading-none">
                          {room.openingTime || "08:00"} – {room.closingTime || "18:00"}
                        </p>
                        <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Hours</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-center py-2.5 px-1">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-semibold flex items-center gap-1 ${statusInfo.class}`}>
                        {statusInfo.icon}
                        {statusInfo.label}
                      </span>
                    </div>
                  </div>

                  {/* Location summary inline */}
                  <div className="px-4 py-3 border-b border-border flex items-center gap-3">
                    {building.imageUrl && (
                      <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-muted hidden sm:block">
                        <img src={building.imageUrl} alt={building.name} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Building2 className="h-3.5 w-3.5 text-primary shrink-0" />
                        <p className="font-semibold text-sm text-foreground truncate">{building.name} ({building.code})</p>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{building.location}</span>
                        <span className="flex items-center gap-1"><Navigation className="h-3 w-3" />{building.campus}</span>
                        <span className="flex items-center gap-1"><Layers className="h-3 w-3" />{toFloorLabel(floor.floorNumber, floor.floorName)}</span>
                        {floor.accessibility && <span className="flex items-center gap-1"><Users className="h-3 w-3" />{floor.accessibility}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Bottom: Two-column body ── */}
              <div className="flex-1 min-h-0 overflow-y-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 lg:divide-x divide-border">

                  {/* Left Column — Directions */}
                  <div className="p-4 sm:p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Compass className="h-4 w-4 text-primary" />
                      </div>
                      <h3 className="font-display text-base font-bold text-foreground">How to Get There</h3>
                    </div>

                    <div className="relative ml-0.5">
                      <div className="absolute left-[17px] top-5 bottom-5 w-0.5 bg-gradient-to-b from-blue-300 via-violet-300 via-amber-300 to-emerald-300 dark:from-blue-700 dark:via-violet-700 dark:via-amber-700 dark:to-emerald-700 rounded-full" />

                      {steps.map((step, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.15 + i * 0.1 }}
                          className="flex gap-3 py-2 relative"
                        >
                          <div className={`w-9 h-9 rounded-xl ${step.bg} flex items-center justify-center shrink-0 z-10 ring-4 ring-card`}>
                            <step.icon className={`h-4 w-4 ${step.color}`} />
                          </div>
                          <div className="pt-0 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Step {i + 1}</span>
                              {i === steps.length - 1 && (
                                <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Destination</span>
                              )}
                            </div>
                            <p className="font-semibold text-foreground text-sm leading-tight">{step.title}</p>
                            <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {/* Description */}
                    {room.description && (
                      <div className="rounded-lg border border-border p-3 bg-muted/30 mt-3">
                        <p className="text-xs text-muted-foreground leading-relaxed">{room.description}</p>
                      </div>
                    )}
                  </div>

                  {/* Right Column — Details + Amenities */}
                  <div className="p-4 sm:p-5 space-y-4 border-t border-border lg:border-t-0">

                    {/* Room Details Grid */}
                    <div>
                      <div className="flex items-center gap-2 mb-2.5">
                        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                          <DoorOpen className="h-4 w-4 text-primary" />
                        </div>
                        <h3 className="font-display text-base font-bold text-foreground">Room Details</h3>
                      </div>
                      <div className="grid grid-cols-2 xl:grid-cols-3 gap-2">
                        {room.condition && (
                          <div className="rounded-lg border border-border p-2.5 bg-background">
                            <p className="text-[9px] uppercase tracking-wider text-muted-foreground mb-0.5">Condition</p>
                            <p className="text-sm font-semibold text-foreground">{room.condition}</p>
                          </div>
                        )}
                        {room.climateControl && (
                          <div className="rounded-lg border border-border p-2.5 bg-background">
                            <div className="flex items-center gap-1">
                              {room.climateControl === "AC" ? (
                                <Snowflake className="h-3 w-3 text-blue-500" />
                              ) : (
                                <ThermometerSun className="h-3 w-3 text-orange-500" />
                              )}
                              <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Climate</p>
                            </div>
                            <p className="text-sm font-semibold text-foreground mt-0.5">
                              {room.climateControl === "AC" ? "Air Conditioned" : "Natural Ventilation"}
                            </p>
                          </div>
                        )}
                        {room.boardType && room.boardType !== "None" && (
                          <div className="rounded-lg border border-border p-2.5 bg-background">
                            <p className="text-[9px] uppercase tracking-wider text-muted-foreground mb-0.5">Board</p>
                            <p className="text-sm font-semibold text-foreground">{room.boardType}</p>
                          </div>
                        )}
                        {room.internetAvailable && (
                          <div className="rounded-lg border border-border p-2.5 bg-background">
                            <div className="flex items-center gap-1 mb-0.5">
                              <Wifi className="h-3 w-3 text-blue-500" />
                              <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Internet</p>
                            </div>
                            <p className="text-sm font-semibold text-foreground">Available</p>
                          </div>
                        )}
                        {room.projectorAvailable && (
                          <div className="rounded-lg border border-border p-2.5 bg-background">
                            <div className="flex items-center gap-1 mb-0.5">
                              <Projector className="h-3 w-3 text-violet-500" />
                              <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Projector</p>
                            </div>
                            <p className="text-sm font-semibold text-foreground">Available</p>
                          </div>
                        )}
                        {room.accessibilitySupport && (
                          <div className="rounded-lg border border-border p-2.5 bg-background">
                            <p className="text-[9px] uppercase tracking-wider text-muted-foreground mb-0.5">Accessibility</p>
                            <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Supported</p>
                          </div>
                        )}
                        {room.areaSqMeters && (
                          <div className="rounded-lg border border-border p-2.5 bg-background">
                            <p className="text-[9px] uppercase tracking-wider text-muted-foreground mb-0.5">Area</p>
                            <p className="text-sm font-semibold text-foreground">{room.areaSqMeters} m²</p>
                          </div>
                        )}
                        {room.powerBackupAvailable && (
                          <div className="rounded-lg border border-border p-2.5 bg-background">
                            <p className="text-[9px] uppercase tracking-wider text-muted-foreground mb-0.5">Power Backup</p>
                            <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Yes</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Amenities */}
                    {facilities.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2.5">
                          <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center">
                            <CheckCircle className="h-4 w-4 text-accent" />
                          </div>
                          <h3 className="font-display text-base font-bold text-foreground">Amenities</h3>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {facilities.map((amenity, i) => (
                            <span
                              key={i}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-accent/10 text-accent-foreground text-xs font-medium border border-accent/15"
                            >
                              {amenityIcons[amenity] || <CheckCircle className="h-3.5 w-3.5" />}
                              {amenity}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
          );
        })()}
      </AnimatePresence>

      <Footer />
    </div>
  );
};

export default RoomFinderPage;
