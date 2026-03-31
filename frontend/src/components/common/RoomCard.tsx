import { DoorOpen, Users, MapPin, CheckCircle, AlertCircle, Wifi, Monitor, Projector } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Room, RoomStatus } from "@/types/campusManagement";

interface RoomCardProps {
  room: Room;
  buildingName?: string;
  floorName?: string;
  onClick?: () => void;
  selected?: boolean;
  index?: number;
  showDetails?: boolean;
}

const statusConfig: Record<RoomStatus, { class: string; icon: React.ReactNode; text: string }> = {
  Available: {
    class: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800",
    icon: <CheckCircle className="h-3 w-3" />,
    text: "Available",
  },
  Occupied: {
    class: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800",
    icon: <AlertCircle className="h-3 w-3" />,
    text: "Occupied",
  },
  Maintenance: {
    class: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800",
    icon: <AlertCircle className="h-3 w-3" />,
    text: "Maintenance",
  },
  "Out of Service": {
    class: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700",
    icon: <AlertCircle className="h-3 w-3" />,
    text: "Out of Service",
  },
};

const amenityIcons: Record<string, React.ReactNode> = {
  WiFi: <Wifi className="h-4 w-4" />,
  Projector: <Projector className="h-4 w-4" />,
  "Smart Board": <Monitor className="h-4 w-4" />,
  Computer: <Monitor className="h-4 w-4" />,
};

export const RoomCard = ({ 
  room, 
  buildingName,
  floorName,
  onClick, 
  selected = false, 
  index = 0,
  showDetails = true 
}: RoomCardProps) => {
  const isBookable = room.status === "Available" && room.bookingAvailable;
  const statusInfo = statusConfig[room.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -4 }}
      className="h-full"
    >
      <Card
        className={cn(
          "group h-full overflow-hidden cursor-pointer transition-all duration-300",
          "border-2 hover:shadow-xl",
          selected
            ? "border-primary shadow-lg ring-2 ring-primary/20"
            : "border-border hover:border-primary/50",
          !isBookable && "opacity-75"
        )}
        onClick={onClick}
      >
        {/* Image Section */}
        <div className="relative h-44 overflow-hidden bg-gradient-to-br from-accent/10 to-primary/10">
          {room.imageUrl ? (
            <img
              src={room.imageUrl}
              alt={room.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <DoorOpen className="h-16 w-16 text-primary/30" />
            </div>
          )}
          
          {/* Status Badge */}
          <div className="absolute top-3 right-3">
            <span className={cn(
              "px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm flex items-center gap-1.5",
              statusInfo.class
            )}>
              {statusInfo.icon}
              {statusInfo.text}
            </span>
          </div>

          {/* Room Number Badge */}
          <div className="absolute top-3 left-3">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary/90 text-primary-foreground backdrop-blur-sm">
              {room.roomNumber}
            </span>
          </div>

          {/* Booking Available Badge */}
          {isBookable && (
            <div className="absolute bottom-3 left-3">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500 text-white backdrop-blur-sm">
                Bookable
              </span>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-5">
          <div className="mb-3">
            <h3 className="font-display text-lg font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
              {room.name}
            </h3>
            <p className="text-sm text-muted-foreground font-medium">{room.type}</p>
          </div>

          {showDetails && (
            <>
              {/* Location Info */}
              {(buildingName || floorName) && (
                <div className="space-y-1 mb-4">
                  {buildingName && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 text-primary/70" />
                      <span>{buildingName}</span>
                    </div>
                  )}
                  {floorName && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground ml-5">
                      <span>•</span>
                      <span>{floorName}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Capacity */}
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Capacity</p>
                  <p className="text-lg font-bold text-foreground">{room.maxOccupancy}</p>
                </div>
              </div>

              {/* Amenities */}
              {room.amenities && room.amenities.length > 0 && (
                <div className="pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-2">Amenities</p>
                  <div className="flex flex-wrap gap-2">
                    {room.amenities.slice(0, 4).map((amenity, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-accent/10 text-accent text-xs"
                      >
                        {amenityIcons[amenity] || <CheckCircle className="h-3 w-3" />}
                        <span>{amenity}</span>
                      </div>
                    ))}
                    {room.amenities.length > 4 && (
                      <div className="flex items-center px-2 py-1 rounded-md bg-muted text-muted-foreground text-xs">
                        +{room.amenities.length - 4}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Selected Indicator */}
          {selected && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mt-4 flex items-center justify-center gap-2 text-primary font-semibold text-sm bg-primary/10 py-2 rounded-lg"
            >
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Selected
            </motion.div>
          )}
        </div>
      </Card>
    </motion.div>
  );
};
