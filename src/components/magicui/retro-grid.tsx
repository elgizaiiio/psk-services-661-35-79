"use client";

import { cn } from "@/lib/utils";

interface RetroGridProps {
  className?: string;
  angle?: number;
  cellSize?: number;
  opacity?: number;
  showFade?: boolean;
}

export function RetroGrid({ className, angle = 65, cellSize = 60, opacity = 0.5, showFade = true }: RetroGridProps) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden [perspective:200px]",
        className,
      )}
      style={{
        "--grid-angle": `${angle}deg`,
        opacity,
      } as React.CSSProperties}
    >
      {/* Grid */}
      <div className="absolute inset-0 [transform:rotateX(var(--grid-angle))]">
        <div
          className={cn(
            "animate-grid",
            "[background-repeat:repeat] [height:300vh] [inset:0%] [margin-left:-50%] [transform-origin:100%_0_0] [width:600vw]",

            // Light Styles
            "[background-image:linear-gradient(to_right,rgba(0,0,0,0.3)_1px,transparent_0),linear-gradient(to_bottom,rgba(0,0,0,0.3)_1px,transparent_0)]",

            // Dark styles
            "dark:[background-image:linear-gradient(to_right,rgba(255,255,255,0.2)_1px,transparent_0),linear-gradient(to_bottom,rgba(255,255,255,0.2)_1px,transparent_0)]",
          )}
          style={{ backgroundSize: `${cellSize}px ${cellSize}px` }}
        />
      </div>

      {/* Fade */}
      {showFade ? <div className="absolute inset-0 bg-gradient-to-t from-background via-background/90 to-transparent" /> : null}
    </div>
  );
}

export default RetroGrid;