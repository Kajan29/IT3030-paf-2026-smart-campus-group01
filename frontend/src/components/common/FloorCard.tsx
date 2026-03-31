import { Layers, DoorOpen, Building2 } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Floor } from "@/types/campusManagement";

interface FloorCardProps {
  floor: Floor;
  buildingName?: string;
  roomCount?: number;
  onClick?: () => void;
  selected?: boolean;
  index?: number;
}

export const FloorCard = ({ 
  floor, 
  buildingName,
  roomCount = 0,
  onClick, 
  selected = false, 
  index = 0 
}: FloorCardProps) => {
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
        {/* Header Section with Gradient */}
        <div className="relative h-32 bg-gradient-to-br from-primary/20 via-primary/10 to-accent/20 flex items-center justify-center overflow-hidden">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 5, 0],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent"
          />
          
          <div className="relative z-10 text-center">
            <div className="w-16 h-16 mx-auto mb-2 rounded-2xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-lg flex items-center justify-center">
              <Layers className="h-8 w-8 text-primary" />
            </div>
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm px-4 py-1 rounded-full">
              <p className="text-2xl font-bold text-primary">{floor.floorNumber}</p>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-5">
          <h3 className="font-display text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
            {floor.floorName}
          </h3>

          {buildingName && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <Building2 className="h-4 w-4 text-primary/70" />
              <span>{buildingName}</span>
            </div>
          )}

          {/* Room Count */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <DoorOpen className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Rooms</p>
                <p className="text-lg font-bold text-foreground">{roomCount}</p>
              </div>
            </div>

            {floor.description && (
              <div className="text-xs text-muted-foreground max-w-[150px] truncate">
                {floor.description}
              </div>
            )}
          </div>

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
