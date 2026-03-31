import { ChevronRight, Home } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
  icon?: React.ReactNode;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumb = ({ items, className }: BreadcrumbProps) => {
  return (
    <nav className={cn("flex items-center gap-2 text-sm", className)}>
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-2"
      >
        <Home className="h-4 w-4 text-muted-foreground" />
      </motion.div>

      {items.map((item, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          className="flex items-center gap-2"
        >
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          {item.onClick ? (
            <button
              onClick={item.onClick}
              className={cn(
                "flex items-center gap-1.5 hover:text-primary transition-colors",
                index === items.length - 1
                  ? "text-foreground font-semibold"
                  : "text-muted-foreground hover:underline"
              )}
            >
              {item.icon && <span className="flex items-center">{item.icon}</span>}
              {item.label}
            </button>
          ) : (
            <span
              className={cn(
                "flex items-center gap-1.5",
                index === items.length - 1
                  ? "text-foreground font-semibold"
                  : "text-muted-foreground"
              )}
            >
              {item.icon && <span className="flex items-center">{item.icon}</span>}
              {item.label}
            </span>
          )}
        </motion.div>
      ))}
    </nav>
  );
};
