import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface PlinkoGameProps {
  balance: number;
  onWin: (amount: number) => void;
  onBet: (amount: number) => boolean;
}

const MULTIPLIERS = [10, 3, 1.5, 1, 0.5, 0.3, 0.5, 1, 1.5, 3, 10];
const ROWS = 8;

const PlinkoGame = ({ balance, onWin, onBet }: PlinkoGameProps) => {
  const [betAmount, setBetAmount] = useState(5);
  const [isDropping, setIsDropping] = useState(false);
  const [ballPosition, setBallPosition] = useState({ x: 50, y: 0 });
  const [finalSlot, setFinalSlot] = useState<number | null>(null);
  const [path, setPath] = useState<{ x: number; y: number }[]>([]);

  const drop = () => {
    if (!onBet(betAmount)) {
      toast.error("Insufficient balance!");
      return;
    }

    setIsDropping(true);
    setFinalSlot(null);
    setBallPosition({ x: 50, y: 0 });

    // Generate path
    let x = 50;
    const newPath: { x: number; y: number }[] = [{ x: 50, y: 0 }];
    
    for (let row = 0; row < ROWS; row++) {
      const direction = Math.random() > 0.5 ? 1 : -1;
      x += direction * (40 / ROWS);
      x = Math.max(5, Math.min(95, x));
      newPath.push({ x, y: ((row + 1) / ROWS) * 100 });
    }

    setPath(newPath);

    // Animate through path
    let step = 0;
    const interval = setInterval(() => {
      if (step >= newPath.length) {
        clearInterval(interval);
        
        // Calculate final slot
        const slotIndex = Math.floor((x / 100) * (MULTIPLIERS.length - 1));
        const boundedSlot = Math.max(0, Math.min(MULTIPLIERS.length - 1, slotIndex));
        setFinalSlot(boundedSlot);
        
        const multiplier = MULTIPLIERS[boundedSlot];
        const winAmount = betAmount * multiplier;
        
        setTimeout(() => {
          onWin(winAmount);
          setIsDropping(false);
          
          if (multiplier >= 3) {
            toast.success(`🎉 Big Win! ${multiplier}x = ${winAmount.toFixed(2)} TON`);
          } else if (multiplier >= 1) {
            toast.success(`Won ${winAmount.toFixed(2)} TON`);
          } else {
            toast.info(`${winAmount.toFixed(2)} TON (${multiplier}x)`);
          }
        }, 300);
        
        return;
      }
      
      setBallPosition(newPath[step]);
      step++;
    }, 100);
  };

  return (
    <Card className="p-4 bg-card border-border">
      <div className="space-y-4">
        {/* Plinko Board */}
        <div className="relative h-64 bg-gradient-to-b from-muted/80 to-muted/40 rounded-xl overflow-hidden">
          {/* Pegs */}
          {Array.from({ length: ROWS }).map((_, row) => (
            <div key={row} className="absolute w-full flex justify-center gap-4" style={{ top: `${(row / ROWS) * 85 + 5}%` }}>
              {Array.from({ length: row + 3 }).map((_, peg) => (
                <div
                  key={peg}
                  className="w-2 h-2 rounded-full bg-muted-foreground/40"
                />
              ))}
            </div>
          ))}

          {/* Ball */}
          <motion.div
            animate={{
              left: `${ballPosition.x}%`,
              top: `${ballPosition.y}%`,
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute w-4 h-4 -ml-2 -mt-2"
          >
            <div className="w-full h-full rounded-full bg-primary shadow-lg shadow-primary/50" />
          </motion.div>

          {/* Multiplier Slots */}
          <div className="absolute bottom-0 left-0 right-0 flex">
            {MULTIPLIERS.map((mult, i) => (
              <div
                key={i}
                className={`
                  flex-1 py-2 text-center text-xs font-bold
                  ${finalSlot === i ? 'bg-primary text-primary-foreground' : 'bg-muted/60'}
                  ${mult >= 3 ? 'text-green-500' : mult >= 1 ? 'text-yellow-500' : 'text-red-500'}
                  ${finalSlot === i ? '!text-primary-foreground' : ''}
                `}
              >
                {mult}x
              </div>
            ))}
          </div>
        </div>

        {/* Bet Controls */}
        <div className="flex gap-2">
          <Input
            type="number"
            value={betAmount}
            onChange={(e) => setBetAmount(Number(e.target.value))}
            min={1}
            max={balance}
            disabled={isDropping}
            className="flex-1"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setBetAmount(Math.max(1, betAmount / 2))}
            disabled={isDropping}
          >
            ½
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setBetAmount(Math.min(balance, betAmount * 2))}
            disabled={isDropping}
          >
            2x
          </Button>
        </div>

        {/* Drop Button */}
        <Button 
          className="w-full" 
          size="lg"
          onClick={drop}
          disabled={isDropping || betAmount > balance}
        >
          {isDropping ? "Dropping..." : `🎱 Drop Ball (${betAmount} TON)`}
        </Button>
      </div>
    </Card>
  );
};

export default PlinkoGame;
