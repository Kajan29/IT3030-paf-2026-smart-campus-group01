import { useEffect, useState } from "react";
import { Clock, AlertCircle, CheckCircle, Lock } from "lucide-react";
import bookingService from "@/services/bookingService";
import type { OccupancyBlock } from "@/types/booking";
import { Card } from "@/components/ui/card";

interface RoomAvailabilityTimelineProps {
  roomId: string;
  date: string;
  onSlotSelect?: (startTime: string, endTime: string) => void;
  highlightSlot?: { start: string; end: string };
}

/**
 * RoomAvailabilityTimeline Component
 * Shows a visual timeline/grid of room availability throughout the day
 * 
 * Color coding:
 * - Green: Available
 * - Yellow: Staff booking/Maintenance
 * - Red: Timetable (occupied)
 */
export const RoomAvailabilityTimeline = ({
  roomId,
  date,
  onSlotSelect,
  highlightSlot,
}: RoomAvailabilityTimelineProps) => {
  const [occupancy, setOccupancy] = useState<OccupancyBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Generate time slots for the day (30-minute intervals from 8 AM to 6 PM)
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour < 18; hour++) {
      for (let minute of [0, 30]) {
        const time = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
        slots.push(time);
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  useEffect(() => {
    const fetchOccupancy = async () => {
      try {
        setLoading(true);
        const data = await bookingService.getRoomOccupancy(roomId, date);
        setOccupancy(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching occupancy:", err);
        setError("Failed to load room availability");
      } finally {
        setLoading(false);
      }
    };

    fetchOccupancy();
  }, [roomId, date]);

  // Check if a time slot is occupied
  const isSlotOccupied = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number);
    const slotStart = new Date(date);
    slotStart.setHours(hours, minutes);
    const slotEnd = new Date(slotStart);
    slotEnd.setMinutes(slotEnd.getMinutes() + 30);

    return occupancy.some((block) => {
      const blockStart = new Date(block.startTime);
      const blockEnd = new Date(block.endTime);
      return slotStart < blockEnd && slotEnd > blockStart;
    });
  };

  // Get occupancy type for a time slot
  const getSlotType = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number);
    const slotStart = new Date(date);
    slotStart.setHours(hours, minutes);
    const slotEnd = new Date(slotStart);
    slotEnd.setMinutes(slotEnd.getMinutes() + 30);

    for (const block of occupancy) {
      const blockStart = new Date(block.startTime);
      const blockEnd = new Date(block.endTime);
      if (slotStart < blockEnd && slotEnd > blockStart) {
        if (block.type === "TIMETABLE") return "occupied";
        if (block.type.startsWith("BLACKOUT")) return "maintenance";
        if (block.type === "BOOKING") return "reserved";
      }
    }
    return "available";
  };

  // Check if slot is highlighted
  const isHighlighted = (time: string) => {
    if (!highlightSlot) return false;
    const [hours, minutes] = time.split(":").map(Number);
    const slotStart = new Date(date);
    slotStart.setHours(hours, minutes);
    
    const highlightStart = new Date(highlightSlot.start);
    const highlightEnd = new Date(highlightSlot.end);
    
    return slotStart >= highlightStart && slotStart < highlightEnd;
  };

  const getSlotColor = (type: string) => {
    switch (type) {
      case "available":
        return "bg-emerald-100 dark:bg-emerald-900/30 hover:bg-emerald-200 dark:hover:bg-emerald-800/50 cursor-pointer border-emerald-300 dark:border-emerald-700";
      case "reserved":
        return "bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700";
      case "occupied":
        return "bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700";
      case "maintenance":
        return "bg-orange-100 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700";
      default:
        return "bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700";
    }
  };

  const handleSlotClick = (time: string) => {
    const type = getSlotType(time);
    if (type === "available" && onSlotSelect) {
      const [hours, minutes] = time.split(":").map(Number);
      const startDate = new Date(date);
      startDate.setHours(hours, minutes);
      const endDate = new Date(startDate);
      endDate.setMinutes(endDate.getMinutes() + 30);

      onSlotSelect(
        startDate.toISOString(),
        endDate.toISOString()
      );
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Clock className="mx-auto h-8 w-8 text-muted-foreground animate-spin mb-2" />
            <p className="text-muted-foreground">Loading availability...</p>
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6 border-red-200 bg-red-50 dark:bg-red-900/20">
        <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
          <AlertCircle className="h-5 w-5" />
          <p>{error}</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Room Availability Timeline</h3>
        <p className="text-sm text-muted-foreground">
          {new Date(date).toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm mb-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-emerald-300 rounded" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-amber-300 rounded" />
          <span>Reserved</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-300 rounded" />
          <span>Occupied</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-orange-300 rounded" />
          <span>Maintenance</span>
        </div>
      </div>

      {/* Timeline Grid */}
      <Card className="p-4 overflow-x-auto">
        <div className="grid gap-1" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))" }}>
          {timeSlots.map((time) => {
            const type = getSlotType(time);
            const highlighted = isHighlighted(time);

            return (
              <div
                key={time}
                className={`
                  p-3 rounded-lg border-2 text-center text-sm font-medium transition-all
                  ${getSlotColor(type)}
                  ${highlighted ? "ring-2 ring-blue-400 ring-offset-2" : ""}
                  ${type === "available" ? "hover:shadow-md" : ""}
                `}
                onClick={() => handleSlotClick(time)}
                title={time}
              >
                <div className="flex items-center justify-center gap-1">
                  {type === "available" && (
                    <>
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                      <span>{time}</span>
                    </>
                  )}
                  {type === "occupied" && (
                    <>
                      <Lock className="h-4 w-4 text-red-600" />
                      <span>{time}</span>
                    </>
                  )}
                  {(type === "reserved" || type === "maintenance") && (
                    <>
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      <span>{time}</span>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Occupancy Details */}
      {occupancy.length > 0 && (
        <Card className="p-4 space-y-3">
          <h4 className="font-semibold">Scheduled Activities</h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {occupancy.map((block, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg border text-sm"
                style={{
                  borderColor:
                    block.type === "TIMETABLE"
                      ? "#fee2e2"
                      : block.type.startsWith("BLACKOUT")
                        ? "#fed7aa"
                        : "#fef3c7",
                  backgroundColor:
                    block.type === "TIMETABLE"
                      ? "rgba(254, 226, 226, 0.5)"
                      : block.type.startsWith("BLACKOUT")
                        ? "rgba(254, 215, 170, 0.5)"
                        : "rgba(254, 243, 199, 0.5)",
                }}
              >
                <div className="font-medium text-foreground">{block.description}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {new Date(block.startTime).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  -{" "}
                  {new Date(block.endTime).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
                {block.details && (
                  <div className="text-xs text-muted-foreground mt-1">By: {block.details}</div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* No Occupancy */}
      {occupancy.length === 0 && (
        <Card className="p-6 text-center">
          <CheckCircle className="mx-auto h-8 w-8 text-emerald-600 mb-2" />
          <p className="text-muted-foreground">Room is completely free this day!</p>
        </Card>
      )}
    </div>
  );
};

export default RoomAvailabilityTimeline;
