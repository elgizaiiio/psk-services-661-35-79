import React from "react";
import { GridBackground } from "@/components/ui/grid-background";
import { cn } from "@/lib/utils";

interface GlobalBackgroundProps {
  className?: string;
}

export const GlobalBackground: React.FC<GlobalBackgroundProps> = ({ 
  className
}) => {
  return (
    <div className="fixed inset-0 w-full h-full z-0 pointer-events-none">
      <GridBackground className={cn("w-full h-full", className)} />
    </div>
  );
};

export default GlobalBackground;