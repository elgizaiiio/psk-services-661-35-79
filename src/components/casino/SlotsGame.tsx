import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cherry, Grape, Apple, Star, Gem, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface SlotsGameProps {
  balance: number;
  onWin: (amount: number) => void;
  onBet: (amount: number) => boolean;
}

const SYMBOLS = [
  { icon: Cherry, value: 2, color: "text-red-500" },
  { icon: Grape, value: 3, color: "text-purple-500" },
  { icon: Apple, value: 4, color: "text-green-500" },
  { icon: Star, value: 5, color: "text-yellow-500" },
  { icon: Gem, value: 10, color: "text-cyan-500" },
  { icon: Zap, value: 25, color: "text-primary" },
];

const SlotsGame = ({ balance, onWin, onBet }: SlotsGameProps) => {
  const [betAmount, setBetAmount] = useState(5);
  const [isSpinning, setIsSpinning] = useState(false);
  const [reels, setReels] = useState([0, 1, 2]);
  const [isWin, setIsWin] = useState(false);

  const getRandomSymbol = () => Math.floor(Math.random() * SYMBOLS.length);

  const spin = useCallback(() => {
    if (!onBet(betAmount)) {
      toast.error("Insufficient balance!");
      return;
    }

    setIsSpinning(true);
    setIsWin(false);

    // Spin animation
    let spins = 0;
    const maxSpins = 20;
    const interval = setInterval(() => {
      setReels([getRandomSymbol(), getRandomSymbol(), getRandomSymbol()]);
      spins++;
      
      if (spins >= maxSpins) {
        clearInterval(interval);
        
        // Final result with house edge
        const finalReels = [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()];
        
        // 15% chance of win (adjusted for house edge)
        const shouldWin = Math.random() < 0.15;
        if (shouldWin) {
          const winSymbol = getRandomSymbol();
          finalReels[0] = winSymbol;
          finalReels[1] = winSymbol;
          finalReels[2] = winSymbol;
        }
        
        setReels(finalReels);
        setIsSpinning(false);

        // Check win
        if (finalReels[0] === finalReels[1] && finalReels[1] === finalReels[2]) {
          const multiplier = SYMBOLS[finalReels[0]].value;
          const winAmount = betAmount * multiplier;
          onWin(winAmount);
          setIsWin(true);
          toast.success(`🎰 JACKPOT! Won ${winAmount.toFixed(2)} TON (${multiplier}x)`);
        } else if (finalReels[0] === finalReels[1] || finalReels[1] === finalReels[2]) {
          const winAmount = betAmount * 1.5;
          onWin(winAmount);
          setIsWin(true);
          toast.success(`Won ${winAmount.toFixed(2)} TON!`);
        }
      }
    }, 80);
  }, [betAmount, onBet, onWin]);

  return (
    <Card className="p-4 bg-card border-border">
      <div className="space-y-4">
        {/* Slot Machine Display */}
        <div className="relative bg-gradient-to-b from-muted/80 to-muted/40 rounded-xl p-6 overflow-hidden">
          {/* Win Glow */}
          <AnimatePresence>
            {isWin && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-primary/20 animate-pulse"
              />
            )}
          </AnimatePresence>

          {/* Reels */}
          <div className="flex justify-center gap-4">
            {reels.map((symbolIndex, reelIndex) => {
              const Symbol = SYMBOLS[symbolIndex];
              return (
                <motion.div
                  key={reelIndex}
                  animate={isSpinning ? { y: [-10, 10, -10] } : {}}
                  transition={{ duration: 0.1, repeat: isSpinning ? Infinity : 0 }}
                  className={`
                    w-20 h-20 rounded-xl bg-background/80 
                    flex items-center justify-center
                    border-2 ${isWin ? 'border-primary' : 'border-border'}
                  `}
                >
                  <Symbol.icon className={`w-12 h-12 ${Symbol.color}`} />
                </motion.div>
              );
            })}
          </div>

          {/* Payline */}
          <div className="absolute left-4 right-4 top-1/2 h-0.5 bg-primary/30" />
        </div>

        {/* Paytable */}
        <div className="grid grid-cols-6 gap-1 text-xs text-center">
          {SYMBOLS.map((symbol, i) => (
            <div key={i} className="flex flex-col items-center gap-1 p-2 bg-muted/30 rounded">
              <symbol.icon className={`w-4 h-4 ${symbol.color}`} />
              <span className="text-muted-foreground">{symbol.value}x</span>
            </div>
          ))}
        </div>

        {/* Bet Controls */}
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
          {isSpinning ? "Spinning..." : `🎰 SPIN (${betAmount} TON)`}
        </Button>
      </div>
    </Card>
  );
};

export default SlotsGame;
