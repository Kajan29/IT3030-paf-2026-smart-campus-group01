import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, Building2, Layers, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Breadcrumb, type BreadcrumbItem } from "@/components/common/Breadcrumb";
import { BuildingCard } from "@/components/common/BuildingCard";
import { FloorCard } from "@/components/common/FloorCard";
import { RoomCard } from "@/components/common/RoomCard";
import facilityService from "@/services/facilityService";
import type { Building, Floor, Room } from "@/types/campusManagement";
import {
  buildings as fallbackBuildings,
  floors as fallbackFloors,
  rooms as fallbackRooms,
} from "@/data/campusManagementData";
import heroCampus from "@/assets/hero-campus.jpg";

type BookingStep = "building" | "floor" | "room" | "confirm";

const timeSlots = [
  "08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM", 
  "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM", 
  "04:00 PM", "05:00 PM"
];

const BookRoomPage = () => {
  const [step, setStep] = useState<BookingStep>("building");
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<Floor | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [booked, setBooked] = useState(false);

  const [buildings, setBuildings] = useState<Building[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

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

        if (buildingData.length > 0) {
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
    return () => { mounted = false; };
  }, []);

  const availableFloors = floors.filter(f => 
    f.buildingId === selectedBuilding?.id
  );

  const availableRooms = rooms.filter(r => 
    r.floorId === selectedFloor?.id && 
    r.status === "Available" && 
    r.bookingAvailable
  );

  const getBuildingRoomCount = (buildingId: string) => {
    return rooms.filter(r => r.buildingId === buildingId).length;
  };

  const roomCounts = new Map<string, number>();
  rooms.forEach(room => {
    const count = roomCounts.get(room.floorId) || 0;
    roomCounts.set(room.floorId, count + 1);
  });

  const handleBuildingSelect = (building: Building) => {
    setSelectedBuilding(building);
    setSelectedFloor(null);
    setSelectedRoom(null);
    setStep("floor");
  };

  const handleFloorSelect = (floor: Floor) => {
    setSelectedFloor(floor);
    setSelectedRoom(null);
    setStep("room");
  };

  const handleRoomSelect = (room: Room) => {
    setSelectedRoom(room);
    setStep("confirm");
  };

  const handleBack = () => {
    if (step === "floor") {
      setStep("building");
      setSelectedFloor(null);
      setSelectedRoom(null);
    } else if (step === "room") {
      setStep("floor");
      setSelectedRoom(null);
    } else if (step === "confirm") {
      setStep("room");
    }
  };

  const handleBook = () => {
    if (selectedRoom && selectedDate && selectedTime) {
      setBooked(true);
      setTimeout(() => {
        setBooked(false);
        // Reset to start
        setStep("building");
        setSelectedBuilding(null);
        setSelectedFloor(null);
        setSelectedRoom(null);
        setSelectedDate("");
        setSelectedTime("");
      }, 3000);
    }
  };

  const breadcrumbItems: BreadcrumbItem[] = [];
  if (selectedBuilding) {
    breadcrumbItems.push({
      label: selectedBuilding.name,
      onClick: () => setStep("building"),
      icon: <Building2 className="h-4 w-4" />,
    });
  }
  if (selectedFloor) {
    breadcrumbItems.push({
      label: selectedFloor.floorName,
      onClick: () => setStep("floor"),
      icon: <Layers className="h-4 w-4" />,
    });
  }
  if (selectedRoom) {
    breadcrumbItems.push({
      label: selectedRoom.name,
    });
  }

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
            Select your building, floor, and room in just a few clicks
          </motion.p>
        </div>
      </section>

      {/* Booking Section */}
      <section className="container mx-auto px-4 py-12">
        {/* Breadcrumb & Back Button */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex-1">
            {breadcrumbItems.length > 0 && (
              <Breadcrumb items={breadcrumbItems} />
            )}
          </div>
          {step !== "building" && (
            <Button
              variant="outline"
              onClick={handleBack}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          )}
        </div>

        {/* Step Indicators */}
        <div className="flex items-center justify-center gap-4 mb-12">
          {[
            { step: "building", label: "Building", icon: Building2 },
            { step: "floor", label: "Floor", icon: Layers },
            { step: "room", label: "Room", icon: Calendar },
          ].map(({ step: stepName, label, icon: Icon }, index) => (
            <div key={stepName} className="flex items-center gap-4">
              <div className={`flex items-center gap-2 ${
                step === stepName ? "text-primary" : 
                (step === "floor" && stepName === "building") ||
                (step === "room" && (stepName === "building" || stepName === "floor")) ||
                (step === "confirm" && stepName !== "confirm") 
                ? "text-emerald-600" : "text-muted-foreground"
              }`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  step === stepName 
                    ? "bg-primary text-primary-foreground" 
                    : (step === "floor" && stepName === "building") ||
                      (step === "room" && (stepName === "building" || stepName === "floor")) ||
                      (step === "confirm" && stepName !== "confirm")
                    ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600"
                    : "bg-muted"
                }`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="font-medium hidden sm:inline">{label}</span>
              </div>
              {index < 2 && <div className="w-12 h-0.5 bg-border" />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Select Building */}
          {step === "building" && (
            <motion.div
              key="building"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-2xl font-bold text-foreground mb-6">Select a Building</h2>
              {loading ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-96 bg-muted animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {buildings.map((building, index) => (
                    <BuildingCard
                      key={building.id}
                      building={building}
                      onClick={() => handleBuildingSelect(building)}
                      selected={selectedBuilding?.id === building.id}
                      index={index}
                      roomCount={getBuildingRoomCount(building.id)}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Step 2: Select Floor */}
          {step === "floor" && (
            <motion.div
              key="floor"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-2xl font-bold text-foreground mb-2">Select a Floor</h2>
              <p className="text-muted-foreground mb-6">
                in {selectedBuilding?.name}
              </p>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {availableFloors.map((floor, index) => (
                  <FloorCard
                    key={floor.id}
                    floor={floor}
                    buildingName={selectedBuilding?.name}
                    roomCount={roomCounts.get(floor.id) || 0}
                    onClick={() => handleFloorSelect(floor)}
                    selected={selectedFloor?.id === floor.id}
                    index={index}
                  />
                ))}
              </div>
              {availableFloors.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  No floors found in this building.
                </div>
              )}
            </motion.div>
          )}

          {/* Step 3: Select Room */}
          {step === "room" && (
            <motion.div
              key="room"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-2xl font-bold text-foreground mb-2">Select a Room</h2>
              <p className="text-muted-foreground mb-6">
                on {selectedFloor?.floorName}, {selectedBuilding?.name}
              </p>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableRooms.map((room, index) => (
                  <RoomCard
                    key={room.id}
                    room={room}
                    buildingName={selectedBuilding?.name}
                    floorName={selectedFloor?.floorName}
                    onClick={() => handleRoomSelect(room)}
                    selected={selectedRoom?.id === room.id}
                    index={index}
                  />
                ))}
              </div>
              {availableRooms.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  No available rooms on this floor.
                </div>
              )}
            </motion.div>
          )}

          {/* Step 4: Confirm Booking */}
          {step === "confirm" && selectedRoom && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="max-w-3xl mx-auto"
            >
              <h2 className="text-2xl font-bold text-foreground mb-6 text-center">Confirm Your Booking</h2>
              
              {/* Selected Room Summary */}
              <div className="mb-8">
                <RoomCard
                  room={selectedRoom}
                  buildingName={selectedBuilding?.name}
                  floorName={selectedFloor?.floorName}
                  selected={true}
                  showDetails={true}
                />
              </div>

              {/* Date & Time Selection */}
              <div className="bg-card border border-border rounded-lg p-6 mb-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-primary" /> Select Date
                    </label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full p-3 rounded-lg border-2 border-border bg-background text-foreground focus:border-primary transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Clock className="h-5 w-5 text-primary" /> Select Time Slot
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {timeSlots.map((t) => (
                        <button
                          key={t}
                          onClick={() => setSelectedTime(t)}
                          className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                            selectedTime === t
                              ? "bg-primary text-primary-foreground shadow-md scale-105"
                              : "bg-muted text-muted-foreground hover:bg-primary/20 hover:text-primary"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Confirm Button */}
              <div className="text-center">
                <Button
                  size="lg"
                  disabled={!selectedDate || !selectedTime || booked}
                  onClick={handleBook}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 px-12 py-6 text-lg font-bold"
                >
                  {booked ? "✓ Booking Confirmed!" : "Confirm Booking"}
                </Button>
                {(!selectedDate || !selectedTime) && !booked && (
                  <p className="text-muted-foreground text-sm mt-3">
                    Please select both date and time to confirm
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <Footer />
    </div>
  );
};

export default BookRoomPage;
