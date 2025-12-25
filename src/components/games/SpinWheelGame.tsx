import React, { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface SpinWheelGameProps {
  coins: number;
  onWin: (amount: number) => void;
  onSpend: (amount: number) => boolean;
  hasFreeSpin?: boolean;
  onUseFreeSpin?: () => void;
}

const SEGMENTS = [
  { value: 100, color: "hsl(var(--primary))", label: "100" },
  { value: 50, color: "hsl(var(--muted))", label: "50" },
  { value: 200, color: "hsl(var(--accent))", label: "200" },
  { value: 0, color: "hsl(var(--destructive))", label: "0" },
  { value: 500, color: "hsl(142 76% 36%)", label: "500" },
  { value: 25, color: "hsl(var(--secondary))", label: "25" },
  { value: 75, color: "hsl(var(--primary))", label: "75" },
  { value: 1000, color: "hsl(48 96% 53%)", label: "1000" },
];

const SPIN_COST = 20;
const SEGMENT_ANGLE = 360 / SEGMENTS.length;

export const SpinWheelGame: React.FC<SpinWheelGameProps> = ({
  coins,
  onWin,
  onSpend,
  hasFreeSpin = false,
  onUseFreeSpin,
}) => {
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [lastWin, setLastWin] = useState<number | null>(null);

  const spin = useCallback(() => {
    if (isSpinning) return;

    // Check if can afford or has free spin
    if (!hasFreeSpin && coins < SPIN_COST) {
      toast.error("عملات غير كافية!");
      return;
    }

    // Spend coins or use free spin
    if (hasFreeSpin && onUseFreeSpin) {
      onUseFreeSpin();
    } else {
      if (!onSpend(SPIN_COST)) return;
    }

    setIsSpinning(true);
    setLastWin(null);

    // Random segment
    const winningIndex = Math.floor(Math.random() * SEGMENTS.length);
    const prize = SEGMENTS[winningIndex].value;

    // Calculate rotation (5 full spins + land on segment)
    const baseRotation = 360 * 5;
    const segmentRotation = winningIndex * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;
    const finalRotation = rotation + baseRotation + (360 - segmentRotation);

    setRotation(finalRotation);

    // After animation
    setTimeout(() => {
      setIsSpinning(false);
      setLastWin(prize);
      if (prize > 0) {
        onWin(prize);
        toast.success(`🎉 ربحت ${prize} عملة!`);
      } else {
        toast.error("حظ أوفر في المرة القادمة!");
      }
    }, 4000);
  }, [isSpinning, coins, hasFreeSpin, onSpend, onUseFreeSpin, onWin, rotation]);

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Wheel Container */}
      <div className="relative w-72 h-72">
        {/* Pointer */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10">
          <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-t-[20px] border-l-transparent border-r-transparent border-t-primary" />
        </div>

        {/* Wheel */}
        <motion.div
          className="w-full h-full rounded-full border-4 border-border overflow-hidden shadow-2xl"
          style={{ rotate: rotation }}
          animate={{ rotate: rotation }}
          transition={{ duration: 4, ease: [0.17, 0.67, 0.12, 0.99] }}
        >
          <svg viewBox="0 0 100 100" className="w-full h-full">
            {SEGMENTS.map((segment, i) => {
              const startAngle = i * SEGMENT_ANGLE;
              const endAngle = (i + 1) * SEGMENT_ANGLE;
              const startRad = (startAngle - 90) * (Math.PI / 180);
              const endRad = (endAngle - 90) * (Math.PI / 180);
              
              const x1 = 50 + 50 * Math.cos(startRad);
              const y1 = 50 + 50 * Math.sin(startRad);
              const x2 = 50 + 50 * Math.cos(endRad);
              const y2 = 50 + 50 * Math.sin(endRad);

              const largeArc = SEGMENT_ANGLE > 180 ? 1 : 0;

              const midAngle = (startAngle + endAngle) / 2;
              const midRad = (midAngle - 90) * (Math.PI / 180);
              const textX = 50 + 30 * Math.cos(midRad);
              const textY = 50 + 30 * Math.sin(midRad);

              return (
                <g key={i}>
                  <path
                    d={`M 50 50 L ${x1} ${y1} A 50 50 0 ${largeArc} 1 ${x2} ${y2} Z`}
                    fill={segment.color}
                    stroke="hsl(var(--border))"
                    strokeWidth="0.5"
                  />
                  <text
                    x={textX}
                    y={textY}
                    fill="white"
                    fontSize="6"
                    fontWeight="bold"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    transform={`rotate(${midAngle}, ${textX}, ${textY})`}
                  >
                    {segment.label}
                  </text>
                </g>
              );
            })}
            {/* Center circle */}
            <circle cx="50" cy="50" r="8" fill="hsl(var(--background))" stroke="hsl(var(--border))" strokeWidth="2" />
          </svg>
        </motion.div>
      </div>

      {/* Last Win */}
      {lastWin !== null && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={`text-2xl font-bold ${lastWin > 0 ? "text-green-500" : "text-destructive"}`}
        >
          {lastWin > 0 ? `+${lastWin} ⚡` : "0 ⚡"}
        </motion.div>
      )}

      {/* Spin Button */}
      <Button
        onClick={spin}
        disabled={isSpinning}
        size="lg"
        className="w-48 text-lg"
      >
        {isSpinning ? (
          "جاري الدوران..."
        ) : hasFreeSpin ? (
          "دوران مجاني! 🎁"
        ) : (
          `دوّر (${SPIN_COST} ⚡)`
        )}
      </Button>

      <p className="text-sm text-muted-foreground">
        رصيدك: {coins.toLocaleString()} ⚡
      </p>
    </div>
  );
};

export default SpinWheelGame;
