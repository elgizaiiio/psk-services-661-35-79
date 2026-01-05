import { useState } from "react";
import { motion } from "framer-motion";
import { CircleDot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface RouletteGameProps {
  balance: number;
  onWin: (amount: number) => void;
  onBet: (amount: number) => boolean;
}

type BetType = "red" | "black" | "green" | "odd" | "even" | "1-18" | "19-36";

const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
const ROULETTE_NUMBERS = Array.from({ length: 37 }, (_, i) => i); // 0-36

const RouletteGame = ({ balance, onWin, onBet }: RouletteGameProps) => {
  const [betAmount, setBetAmount] = useState(5);
  const [selectedBet, setSelectedBet] = useState<BetType>("red");
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [rotation, setRotation] = useState(0);

  const getMultiplier = (bet: BetType): number => {
    if (bet === "green") return 35;
    return 2;
  };

  const isWinningBet = (bet: BetType, number: number): boolean => {
    if (number === 0) return bet === "green";
    const isRed = RED_NUMBERS.includes(number);
    
    switch (bet) {
      case "red": return isRed;
      case "black": return !isRed;
      case "odd": return number % 2 === 1;
      case "even": return number % 2 === 0;
      case "1-18": return number >= 1 && number <= 18;
      case "19-36": return number >= 19 && number <= 36;
      default: return false;
    }
  };

  const spin = () => {
    if (!onBet(betAmount)) {
      toast.error("Insufficient balance!");
      return;
    }

    setIsSpinning(true);
    setResult(null);

    // Spin animation
    const spins = 5 + Math.random() * 3;
    const finalNumber = ROULETTE_NUMBERS[Math.floor(Math.random() * ROULETTE_NUMBERS.length)];
    const newRotation = rotation + (spins * 360) + (finalNumber / 37) * 360;
    
    setRotation(newRotation);

    setTimeout(() => {
      setResult(finalNumber);
      setIsSpinning(false);

      const won = isWinningBet(selectedBet, finalNumber);
      if (won) {
        const multiplier = getMultiplier(selectedBet);
        const winAmount = betAmount * multiplier;
        onWin(winAmount);
        toast.success(`🎯 ${finalNumber}! Won ${winAmount.toFixed(2)} TON (${multiplier}x)`);
      } else {
        toast.error(`${finalNumber} - Better luck next time!`);
      }
    }, 3000);
  };

  const getNumberColor = (n: number): string => {
    if (n === 0) return "bg-green-600";
    return RED_NUMBERS.includes(n) ? "bg-red-600" : "bg-zinc-900";
  };

  const betOptions: { type: BetType; label: string; color?: string }[] = [
    { type: "red", label: "Red", color: "bg-red-600" },
    { type: "black", label: "Black", color: "bg-zinc-900" },
    { type: "green", label: "0 (35x)", color: "bg-green-600" },
    { type: "odd", label: "Odd" },
    { type: "even", label: "Even" },
    { type: "1-18", label: "1-18" },
    { type: "19-36", label: "19-36" },
  ];

  return (
    <Card className="p-4 bg-card border-border">
      <div className="space-y-4">
        {/* Roulette Wheel */}
        <div className="relative h-48 bg-muted/50 rounded-xl flex items-center justify-center overflow-hidden">
          <motion.div
            animate={{ rotate: rotation }}
            transition={{ duration: 3, ease: "easeOut" }}
            className="w-40 h-40 rounded-full border-4 border-primary relative"
            style={{
              background: `conic-gradient(
                ${ROULETTE_NUMBERS.map((n, i) => {
                  const color = n === 0 ? '#16a34a' : RED_NUMBERS.includes(n) ? '#dc2626' : '#18181b';
                  const start = (i / 37) * 100;
                  const end = ((i + 1) / 37) * 100;
                  return `${color} ${start}% ${end}%`;
                }).join(', ')}
              )`
            }}
          >
            <div className="absolute inset-4 rounded-full bg-card flex items-center justify-center">
              <CircleDot className="w-8 h-8 text-primary" />
            </div>
          </motion.div>

          {/* Ball indicator */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2">
            <div className="w-3 h-3 rounded-full bg-white shadow-lg" />
          </div>

          {/* Result */}
          {result !== null && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={`absolute bottom-4 px-4 py-2 rounded-lg ${getNumberColor(result)} text-white font-bold`}
            >
              {result}
            </motion.div>
          )}
        </div>

        {/* Bet Selection */}
        <div className="grid grid-cols-4 gap-2">
          {betOptions.map((bet) => (
            <Button
              key={bet.type}
              variant={selectedBet === bet.type ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedBet(bet.type)}
              disabled={isSpinning}
              className={`text-xs ${bet.color && selectedBet === bet.type ? bet.color : ''}`}
            >
              {bet.label}
            </Button>
          ))}
        </div>

        {/* Bet Amount */}
        <div className="flex gap-2">
          <Input
            type="number"
            value={betAmount}
            onChange={(e) => setBetAmount(Number(e.target.value))}
            min={1}
            max={balance}
            disabled={isSpinning}
            className="flex-1"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setBetAmount(Math.max(1, betAmount / 2))}
            disabled={isSpinning}
          >
            ½
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setBetAmount(Math.min(balance, betAmount * 2))}
            disabled={isSpinning}
          >
            2x
          </Button>
        </div>

        {/* Spin Button */}
        <Button 
          className="w-full" 
          size="lg"
          onClick={spin}
          disabled={isSpinning || betAmount > balance}
        >
          {isSpinning ? "Spinning..." : `🎡 Spin (${betAmount} TON)`}
        </Button>
      </div>
    </Card>
  );
};

export default RouletteGame;
