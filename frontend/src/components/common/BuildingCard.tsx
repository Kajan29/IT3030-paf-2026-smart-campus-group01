import { Building2, Layers, MapPin, Calendar, DoorOpen, Clock3 } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Building, BuildingStatus } from "@/types/campusManagement";

interface BuildingCardProps {
  building: Building;
  onClick?: () => void;
  selected?: boolean;
  index?: number;
  showDetails?: boolean;
  roomCount?: number;
}

const statusBadgeClass: Record<BuildingStatus, string> = {
  Active: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800",
  "Under Maintenance": "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800",
  Inactive: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700",
};

export const BuildingCard = ({ 
  building, 
  onClick, 
  selected = false, 
  index = 0,
  showDetails = true,
  roomCount = 0
}: BuildingCardProps) => {
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
            : "border-border hover:border-primary/50"
        )}
        onClick={onClick}
      >
        {/* Image Section */}
        <div className="relative h-48 overflow-hidden bg-gradient-to-br from-primary/10 to-accent/10">
          {building.imageUrl ? (
            <img
              src={building.imageUrl}
              alt={building.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Building2 className="h-20 w-20 text-primary/30" />
            </div>
          )}
          
          {/* Status Badge */}
          <div className="absolute top-3 right-3">
            <span className={cn(
              "px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm",
              statusBadgeClass[building.status]
            )}>
              {building.status}
            </span>
          </div>

          {/* Building Code Badge */}
          <div className="absolute top-3 left-3">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary/90 text-primary-foreground backdrop-blur-sm">
              {building.code}
            </span>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-5">
          <div className="mb-3">
            <h3 className="font-display text-xl font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
              {building.name}
            </h3>
            <p className="text-sm text-muted-foreground font-medium">{building.type}</p>
          </div>

          {showDetails && (
            <>
              {/* Location & Campus */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 text-primary/70" />
                  <span>{building.location}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building2 className="h-4 w-4 text-primary/70" />
                  <span>{building.campus}</span>
                </div>
                {(building.openingTime || building.closingTime) && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock3 className="h-4 w-4 text-primary/70" />
                    <span>
                      {building.openingTime || "08:00"} - {building.closingTime || "18:00"}
                      {building.closedOnWeekends ? " · Weekends closed" : ""}
                    </span>
                  </div>
                )}
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Layers className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Floors</p>
                    <p className="text-lg font-bold text-foreground">{building.totalFloors}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <DoorOpen className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Rooms</p>
                    <p className="text-lg font-bold text-foreground">{roomCount}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Est.</p>
                    <p className="text-lg font-bold text-foreground">{building.yearEstablished}</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Description */}
          {building.description && showDetails && (
            <p className="text-xs text-muted-foreground mt-4 line-clamp-2">
              {building.description}
            </p>
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
