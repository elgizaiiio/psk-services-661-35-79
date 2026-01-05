import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Rocket, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface CrashGameProps {
  balance: number;
  onWin: (amount: number) => void;
  onBet: (amount: number) => boolean;
}

const CrashGame = ({ balance, onWin, onBet }: CrashGameProps) => {
  const [betAmount, setBetAmount] = useState(10);
  const [multiplier, setMultiplier] = useState(1.0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasBet, setHasBet] = useState(false);
  const [crashed, setCrashed] = useState(false);
  const [cashedOut, setCashedOut] = useState(false);
  const [crashPoint, setCrashPoint] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const generateCrashPoint = () => {
    // House edge 3%
    const e = 0.97;
    const h = Math.random();
    return Math.max(1, Math.floor((100 * e) / (h * 100)) / 100);
  };

  const startGame = () => {
    if (!onBet(betAmount)) {
      toast.error("Insufficient balance!");
      return;
    }

    const point = generateCrashPoint();
    setCrashPoint(point);
    setIsPlaying(true);
    setHasBet(true);
    setCrashed(false);
    setCashedOut(false);
    setMultiplier(1.0);

    intervalRef.current = setInterval(() => {
      setMultiplier((prev) => {
        const newMultiplier = parseFloat((prev + 0.01).toFixed(2));
        if (newMultiplier >= point) {
          clearInterval(intervalRef.current!);
          setCrashed(true);
          setIsPlaying(false);
          setHasBet(false);
          toast.error(`Crashed at ${point.toFixed(2)}x!`);
          return point;
        }
        return newMultiplier;
      });
    }, 50);
  };

  const cashOut = () => {
    if (!hasBet || crashed) return;
    
    clearInterval(intervalRef.current!);
    setCashedOut(true);
    setIsPlaying(false);
    setHasBet(false);
    
    const winAmount = betAmount * multiplier;
    onWin(winAmount);
    toast.success(`Cashed out at ${multiplier.toFixed(2)}x! Won ${winAmount.toFixed(2)} TON`);
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const getMultiplierColor = () => {
    if (crashed) return "text-destructive";
    if (cashedOut) return "text-green-500";
    if (multiplier >= 2) return "text-green-500";
    if (multiplier >= 1.5) return "text-yellow-500";
    return "text-primary";
  };

  return (
    <Card className="p-4 bg-card border-border">
      <div className="space-y-4">
        {/* Game Display */}
        <div className="relative h-48 bg-muted/50 rounded-xl overflow-hidden flex items-center justify-center">
          {/* Rocket Animation */}
          <motion.div
            animate={isPlaying ? { 
              y: [-20, -100],
              scale: [1, 1.2]
            } : crashed ? {
              rotate: 180,
              y: 50,
              opacity: 0.5
            } : {}}
            transition={{ duration: 0.5, repeat: isPlaying ? Infinity : 0 }}
            className="absolute"
          >
            <Rocket className={`w-16 h-16 ${crashed ? 'text-destructive' : 'text-primary'}`} />
          </motion.div>

          {/* Multiplier Display */}
          <motion.div
            key={multiplier}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className={`text-5xl font-bold ${getMultiplierColor()}`}
          >
            {multiplier.toFixed(2)}x
          </motion.div>

          {/* Status */}
          <AnimatePresence>
            {crashed && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute bottom-4 text-destructive font-bold"
              >
                CRASHED!
              </motion.div>
            )}
            {cashedOut && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute bottom-4 text-green-500 font-bold"
              >
                CASHED OUT!
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bet Controls */}
        <div className="flex gap-2">
          <Input
            type="number"
            value={betAmount}
            onChange={(e) => setBetAmount(Number(e.target.value))}
            min={1}
            max={balance}
            disabled={isPlaying}
            className="flex-1"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setBetAmount(Math.max(1, betAmount / 2))}
            disabled={isPlaying}
          >
            ½
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setBetAmount(Math.min(balance, betAmount * 2))}
            disabled={isPlaying}
          >
            2x
          </Button>
        </div>

        {/* Action Button */}
        {!isPlaying ? (
          <Button 
            className="w-full" 
            size="lg"
            onClick={startGame}
            disabled={betAmount > balance}
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Place Bet ({betAmount} TON)
          </Button>
        ) : (
          <Button 
            className="w-full bg-green-600 hover:bg-green-700" 
            size="lg"
            onClick={cashOut}
            disabled={!hasBet || crashed}
          >
            Cash Out ({(betAmount * multiplier).toFixed(2)} TON)
          </Button>
        )}
      </div>
    </Card>
  );
};

export default CrashGame;
