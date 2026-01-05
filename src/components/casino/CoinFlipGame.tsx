import { useState } from "react";
import { motion } from "framer-motion";
import { Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface CoinFlipGameProps {
  balance: number;
  onWin: (amount: number) => void;
  onBet: (amount: number) => boolean;
}

const CoinFlipGame = ({ balance, onWin, onBet }: CoinFlipGameProps) => {
  const [betAmount, setBetAmount] = useState(5);
  const [choice, setChoice] = useState<"heads" | "tails">("heads");
  const [isFlipping, setIsFlipping] = useState(false);
  const [result, setResult] = useState<"heads" | "tails" | null>(null);
  const [flipRotation, setFlipRotation] = useState(0);

  const MULTIPLIER = 1.95; // 2.5% house edge

  const flip = () => {
    if (!onBet(betAmount)) {
      toast.error("Insufficient balance!");
      return;
    }

    setIsFlipping(true);
    setResult(null);

    // Random result
    const coinResult = Math.random() > 0.5 ? "heads" : "tails";
    
    // Calculate rotation (heads = 0°, tails = 180°)
    const flips = 5 + Math.floor(Math.random() * 3);
    const finalRotation = flipRotation + (flips * 360) + (coinResult === "tails" ? 180 : 0);
    setFlipRotation(finalRotation);

    setTimeout(() => {
      setResult(coinResult);
      setIsFlipping(false);

      if (choice === coinResult) {
        const winAmount = betAmount * MULTIPLIER;
        onWin(winAmount);
        toast.success(`🪙 ${coinResult.toUpperCase()}! Won ${winAmount.toFixed(2)} TON`);
      } else {
        toast.error(`${coinResult.toUpperCase()} - Better luck next time!`);
      }
    }, 2000);
  };

  return (
    <Card className="p-4 bg-card border-border">
      <div className="space-y-4">
        {/* Coin Display */}
        <div className="relative h-48 bg-muted/50 rounded-xl flex items-center justify-center">
          <motion.div
            animate={{ rotateY: flipRotation }}
            transition={{ duration: 2, ease: "easeOut" }}
            style={{ transformStyle: "preserve-3d" }}
            className="relative w-32 h-32"
          >
            {/* Heads Side */}
            <div 
              className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center border-4 border-yellow-300 shadow-lg"
              style={{ backfaceVisibility: "hidden" }}
            >
              <span className="text-4xl font-bold text-yellow-900">H</span>
            </div>
            
            {/* Tails Side */}
            <div 
              className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-500 to-yellow-700 flex items-center justify-center border-4 border-yellow-400 shadow-lg"
              style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
            >
              <span className="text-4xl font-bold text-yellow-900">T</span>
            </div>
          </motion.div>

          {/* Result Text */}
          {result && !isFlipping && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-4 text-lg font-bold"
            >
              {result.toUpperCase()}
            </motion.div>
          )}
        </div>

        {/* Choice Selection */}
        <div className="flex gap-2">
          <Button
            variant={choice === "heads" ? "default" : "outline"}
            className="flex-1"
            onClick={() => setChoice("heads")}
            disabled={isFlipping}
          >
            🪙 Heads
          </Button>
          <Button
            variant={choice === "tails" ? "default" : "outline"}
            className="flex-1"
            onClick={() => setChoice("tails")}
            disabled={isFlipping}
          >
            🪙 Tails
          </Button>
        </div>

        {/* Multiplier Info */}
        <div className="text-center text-sm text-muted-foreground">
          Win {MULTIPLIER}x your bet • 50% chance
        </div>

        {/* Bet Amount */}
        <div className="flex gap-2">
          <Input
            type="number"
            value={betAmount}
            onChange={(e) => setBetAmount(Number(e.target.value))}
            min={1}
            max={balance}
            disabled={isFlipping}
            className="flex-1"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setBetAmount(Math.max(1, betAmount / 2))}
            disabled={isFlipping}
          >
            ½
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setBetAmount(Math.min(balance, betAmount * 2))}
            disabled={isFlipping}
          >
            2x
          </Button>
        </div>

        {/* Flip Button */}
        <Button 
          className="w-full" 
          size="lg"
          onClick={flip}
          disabled={isFlipping || betAmount > balance}
        >
          {isFlipping ? "Flipping..." : `🪙 Flip (${betAmount} TON)`}
        </Button>
      </div>
    </Card>
  );
};

export default CoinFlipGame;
