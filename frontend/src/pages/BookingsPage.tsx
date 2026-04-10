import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, Building2, Layers, ArrowLeft, Users, AlertTriangle, Ban, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Breadcrumb, type BreadcrumbItem } from "@/components/common/Breadcrumb";
import { BuildingCard } from "@/components/common/BuildingCard";
import { FloorCard } from "@/components/common/FloorCard";
import { RoomCard } from "@/components/common/RoomCard";
import facilityService from "@/services/facilityService";
import bookingService from "@/services/bookingService";
import userService from "@/services/userService";
import type { Building, Floor, Room } from "@/types/campusManagement";
import { toast } from "react-toastify";
import {
  buildings as fallbackBuildings,
  floors as fallbackFloors,
  rooms as fallbackRooms,
} from "@/data/campusManagementData";
import heroCampus from "@/assets/hero-campus.jpg";

type BookingStep = "building" | "floor" | "room" | "confirm";

const STUDY_ROOM_TYPE_KEYWORDS = [
  "study",
  "library",
  "discussion",
  "tutorial",
  "research",
  "common",
  "seminar",
  "computer lab",
];

const normalizeRoomStatus = (status?: string) => (status || "").trim().toLowerCase();
const normalizeValue = (value?: string) => (value || "").trim().toLowerCase();

const isStudyAreaRoom = (room: Room) => {
  const normalizedType = (room.type || "").trim().toLowerCase();
  const normalizedCode = (room.code || "").trim().toLowerCase();
  return (
    STUDY_ROOM_TYPE_KEYWORDS.some((keyword) => normalizedType.includes(keyword)) ||
    normalizedCode.startsWith("sr-")
  );
};

const isRoomBookableForStudents = (room: Room) => {
  const statusBookable = ["available", "open"].includes(normalizeRoomStatus(room.status));
  const maintenanceOperational = normalizeValue(room.maintenanceStatus) === "operational";
  const conditionSuitable = ["excellent", "good"].includes(normalizeValue(room.condition));
  const hasAssignedStaff = !!room.assignedStaffId;
  return statusBookable && room.bookingAvailable !== false && maintenanceOperational && conditionSuitable && hasAssignedStaff;
};

// Two-hour time slots from 08:00 to 16:00 (last slot ends at 18:00)
const timeSlots = [
  { label: "08:00 AM - 10:00 AM", start: "08:00", end: "10:00" },
  { label: "10:00 AM - 12:00 PM", start: "10:00", end: "12:00" },
  { label: "12:00 PM - 02:00 PM", start: "12:00", end: "14:00" },
  { label: "02:00 PM - 04:00 PM", start: "14:00", end: "16:00" },
  { label: "04:00 PM - 06:00 PM", start: "16:00", end: "18:00" },
];

// Returns today's date as YYYY-MM-DD
const getTodayStr = () => new Date().toISOString().split("T")[0];

const BookRoomPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<BookingStep>("building");
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<Floor | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<typeof timeSlots[number] | null>(null);
  const [seatsToBook, setSeatsToBook] = useState(1);
  const [booked, setBooked] = useState(false);
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);

  // Booking restriction state
  const [bookingRestricted, setBookingRestricted] = useState(false);
  const [restrictionReason, setRestrictionReason] = useState<string | null>(null);

  // Seat availability state
  const [seatInfo, setSeatInfo] = useState<{ totalCapacity: number; seatsBooked: number; seatsAvailable: number } | null>(null);
  const [loadingSeats, setLoadingSeats] = useState(false);

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

  // Check if user's booking access is restricted
  useEffect(() => {
    const checkRestriction = async () => {
      try {
        const response = await userService.getProfile();
        const profile = response.data?.data || response.data;
        if (profile?.bookingRestricted) {
          setBookingRestricted(true);
          setRestrictionReason(profile.bookingRestrictionReason || null);
        }
      } catch {
        // Not logged in or error — restriction check will happen server-side
      }
    };
    checkRestriction();
  }, []);

  // Fetch seat availability whenever room, date, or slot changes
  useEffect(() => {
    if (!selectedRoom || !selectedDate || !selectedSlot) {
      setSeatInfo(null);
      return;
    }

    let cancelled = false;
    const fetchSeats = async () => {
      setLoadingSeats(true);
      try {
        const startTime = `${selectedDate}T${selectedSlot.start}:00`;
        const endTime = `${selectedDate}T${selectedSlot.end}:00`;
        const data = await bookingService.getSeatAvailability(String(selectedRoom.id), startTime, endTime);
        if (!cancelled) {
          setSeatInfo(data);
        }
      } catch {
        if (!cancelled) setSeatInfo(null);
      } finally {
        if (!cancelled) setLoadingSeats(false);
      }
    };

    fetchSeats();
    return () => { cancelled = true; };
  }, [selectedRoom, selectedDate, selectedSlot]);

  const studyBookableRooms = rooms.filter(
    (room) => isRoomBookableForStudents(room) && isStudyAreaRoom(room)
  );

  const availableBuildings = buildings.filter((building) =>
    studyBookableRooms.some((room) => room.buildingId === building.id)
  );

  const availableFloors = floors.filter(
    (floor) =>
      floor.buildingId === selectedBuilding?.id &&
      studyBookableRooms.some((room) => room.floorId === floor.id)
  );

  const availableRooms = studyBookableRooms.filter(
    (room) => room.floorId === selectedFloor?.id
  );

  const getBuildingRoomCount = (buildingId: string) => {
    return studyBookableRooms.filter((room) => room.buildingId === buildingId).length;
  };

  const roomCounts = new Map<string, number>();
  studyBookableRooms.forEach((room) => {
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
    setSelectedSlot(null);
    setSelectedDate("");
    setSeatInfo(null);
    setSeatsToBook(1);
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
      setSelectedSlot(null);
      setSelectedDate("");
      setSeatInfo(null);
    }
  };

  const handleBook = async () => {
    if (!selectedRoom || !selectedDate || !selectedSlot) {
      return;
    }

    // Validate date is not in the past
    const today = getTodayStr();
    if (selectedDate < today) {
      toast.error("Cannot book a date in the past. Please select today or a future date.");
      return;
    }

    // Validate seat availability
    if (seatInfo && seatInfo.seatsAvailable < seatsToBook) {
      toast.error(`Only ${seatInfo.seatsAvailable} seat(s) available. Room is ${seatInfo.seatsAvailable === 0 ? "fully booked" : "almost full"} for this time.`);
      return;
    }

    setIsSubmittingBooking(true);
    try {
      const roomIdAsNumber = Number(selectedRoom.id);
      if (!Number.isFinite(roomIdAsNumber)) {
        throw new Error("This room cannot be booked right now. Please refresh and try again.");
      }

      const response = await bookingService.createBooking({
        roomId: String(roomIdAsNumber),
        startTime: `${selectedDate}T${selectedSlot.start}:00`,
        endTime: `${selectedDate}T${selectedSlot.end}:00`,
        bookingType: "STUDENT",
        purpose: `Study booking for ${selectedRoom.name}`,
        seatsBooked: seatsToBook,
      });

      setBooked(true);
      if (response?.status === "PENDING") {
        toast.success("Booking request submitted and is pending admin approval. You'll receive an OTP email once approved.");
      } else {
        toast.success("Booking submitted successfully.");
      }

      setTimeout(() => {
        setBooked(false);
        setStep("building");
        setSelectedBuilding(null);
        setSelectedFloor(null);
        setSelectedRoom(null);
        setSelectedDate("");
        setSelectedSlot(null);
        setSeatInfo(null);
        setSeatsToBook(1);
      }, 3000);
    } catch (error: any) {
      const apiMessage =
        error?.response?.data?.details?.[0] ||
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message ||
        "Failed to create booking.";

      if (String(apiMessage).toLowerCase().includes("already have a booking at this time")) {
        // User has a conflicting booking at this time
      }
      if (String(apiMessage).toLowerCase().includes("booking access has been restricted")) {
        setBookingRestricted(true);
        toast.error("Your booking access is restricted. Please visit the Contact Us page.");
        return;
      }
      toast.error(apiMessage);
    } finally {
      setIsSubmittingBooking(false);
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
            Student bookings are limited to study areas and are submitted for admin approval.
          </motion.p>
        </div>
      </section>

      {/* Booking Section */}
      <section className="container mx-auto px-4 py-12">

        {/* Booking Restriction Banner */}
        {bookingRestricted && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 rounded-xl border-2 border-red-300 bg-red-50 p-6 text-center"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-2 text-red-700">
                <Ban className="h-8 w-8" />
                <h3 className="text-xl font-bold">Booking Access Restricted</h3>
              </div>
              <p className="text-red-700 max-w-xl">
                Your booking access has been restricted by administration
                {restrictionReason ? ` (${restrictionReason})` : ""}.
                You are currently unable to make new room bookings.
              </p>
              <p className="text-red-600 text-sm">
                If you believe this is an error or would like to resolve this, please contact us.
              </p>
              <Button
                onClick={() => navigate("/contact")}
                className="bg-red-600 text-white hover:bg-red-700 gap-2 px-8 py-3 text-base font-semibold"
                size="lg"
              >
                <MessageSquare className="h-5 w-5" />
                Contact Us to Resolve
              </Button>
            </div>
          </motion.div>
        )}

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
                  {availableBuildings.map((building, index) => (
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
              {!loading && availableBuildings.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  No study-related rooms are available for booking right now.
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

              {/* Room capacity info */}
              {(selectedRoom as any).seatingCapacity && (
                <div className="mb-4 flex items-center gap-2 px-4 py-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-800">
                  <Users className="h-5 w-5" />
                  <span className="text-sm font-medium">
                    Total Room Capacity: {(selectedRoom as any).seatingCapacity} seats
                  </span>
                </div>
              )}

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
                      onChange={(e) => {
                        setSelectedDate(e.target.value);
                        setSelectedSlot(null);
                        setSeatInfo(null);
                      }}
                      min={getTodayStr()}
                      className="w-full p-3 rounded-lg border-2 border-border bg-background text-foreground focus:border-primary transition-colors"
                    />
                    {selectedDate && selectedDate < getTodayStr() && (
                      <p className="text-red-600 text-xs mt-1">Cannot select a past date.</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Clock className="h-5 w-5 text-primary" /> Select 2-Hour Time Slot
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                      {timeSlots.map((slot) => {
                        // Disable time slots that have already passed when date is today
                        const isToday = selectedDate === getTodayStr();
                        const now = new Date();
                        const slotEndHour = parseInt(slot.end.split(":")[0], 10);
                        const isPast = isToday && now.getHours() >= slotEndHour;

                        return (
                        <button
                          key={slot.start}
                          onClick={() => !isPast && setSelectedSlot(slot)}
                          disabled={isPast}
                          className={`px-4 py-3 rounded-lg text-sm font-semibold transition-all text-left ${
                            isPast
                              ? "bg-gray-100 text-gray-400 cursor-not-allowed line-through"
                              : selectedSlot?.start === slot.start
                              ? "bg-primary text-primary-foreground shadow-md scale-[1.02]"
                              : "bg-muted text-muted-foreground hover:bg-primary/20 hover:text-primary"
                          }`}
                        >
                          {slot.label}
                          {isPast && <span className="ml-2 text-xs font-normal">(Past)</span>}
                        </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Seat Availability Info */}
              {selectedDate && selectedSlot && (
                <div className="mb-6">
                  {loadingSeats ? (
                    <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 text-gray-600">
                      <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm">Checking seat availability...</span>
                    </div>
                  ) : seatInfo ? (
                    <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${
                      seatInfo.seatsAvailable === 0
                        ? "bg-red-50 border-red-200 text-red-800"
                        : seatInfo.seatsAvailable <= 3
                        ? "bg-amber-50 border-amber-200 text-amber-800"
                        : "bg-emerald-50 border-emerald-200 text-emerald-800"
                    }`}>
                      {seatInfo.seatsAvailable === 0 ? (
                        <AlertTriangle className="h-5 w-5" />
                      ) : (
                        <Users className="h-5 w-5" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-semibold">
                          {seatInfo.seatsAvailable === 0
                            ? "Room is fully booked for this time slot!"
                            : `${seatInfo.seatsAvailable} of ${seatInfo.totalCapacity} seats available`}
                        </p>
                        <p className="text-xs opacity-80">
                          {seatInfo.seatsBooked} seat(s) already booked for {selectedSlot.label}
                        </p>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}

              {/* Seats to book */}
              {seatInfo && seatInfo.seatsAvailable > 0 && (
                <div className="bg-card border border-border rounded-lg p-4 mb-6">
                  <label className="text-sm font-semibold text-foreground mb-2 block">
                    How many seats do you want to book?
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min={1}
                      max={seatInfo.seatsAvailable}
                      value={seatsToBook}
                      onChange={(e) => {
                        const v = Math.max(1, Math.min(seatInfo.seatsAvailable, Number(e.target.value) || 1));
                        setSeatsToBook(v);
                      }}
                      className="w-20 p-2 rounded-lg border-2 border-border bg-background text-foreground text-center font-semibold"
                    />
                    <span className="text-sm text-muted-foreground">
                      (Max {seatInfo.seatsAvailable} available)
                    </span>
                  </div>
                </div>
              )}

              {/* Confirm Button */}
              <div className="text-center">
                <Button
                  size="lg"
                  disabled={
                    !selectedDate || 
                    !selectedSlot || 
                    booked || 
                    isSubmittingBooking || 
                    (seatInfo !== null && seatInfo.seatsAvailable === 0) ||
                    selectedDate < getTodayStr()
                  }
                  onClick={handleBook}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 px-12 py-6 text-lg font-bold"
                >
                  {booked
                    ? "Booking Request Submitted"
                    : isSubmittingBooking
                    ? "Submitting..."
                    : "Submit Booking Request"}
                </Button>
                {(!selectedDate || !selectedSlot) && !booked && (
                  <p className="text-muted-foreground text-sm mt-3">
                    Please select both date and a 2-hour time slot to confirm
                  </p>
                )}
                {seatInfo && seatInfo.seatsAvailable === 0 && (
                  <p className="text-red-600 text-sm mt-3">
                    This room is fully booked for the selected time slot. Please choose a different time or room.
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
