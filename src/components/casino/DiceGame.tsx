import { useState } from "react";
import { motion } from "framer-motion";
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";

interface DiceGameProps {
  balance: number;
  onWin: (amount: number) => void;
  onBet: (amount: number) => boolean;
}

const DICE_ICONS = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6];

const DiceGame = ({ balance, onWin, onBet }: DiceGameProps) => {
  const [betAmount, setBetAmount] = useState(5);
  const [target, setTarget] = useState(50);
  const [betType, setBetType] = useState<"over" | "under">("over");
  const [isRolling, setIsRolling] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [diceDisplay, setDiceDisplay] = useState(0);

  const winChance = betType === "over" ? (100 - target) : target;
  const multiplier = (99 / winChance); // 1% house edge
  const potentialWin = betAmount * multiplier;

  const roll = () => {
    if (!onBet(betAmount)) {
      toast.error("Insufficient balance!");
      return;
    }

    setIsRolling(true);
    setResult(null);

    // Dice animation
    let rolls = 0;
    const interval = setInterval(() => {
      setDiceDisplay(Math.floor(Math.random() * 6));
      rolls++;
      
      if (rolls >= 15) {
        clearInterval(interval);
        
        // Generate result (1-100)
        const finalResult = Math.floor(Math.random() * 100) + 1;
        setResult(finalResult);
        setDiceDisplay(Math.floor(Math.random() * 6));
        setIsRolling(false);

        // Check win
        const isWin = betType === "over" 
          ? finalResult > target 
          : finalResult < target;

        if (isWin) {
          onWin(potentialWin);
          toast.success(`🎲 Won! Rolled ${finalResult} - Won ${potentialWin.toFixed(2)} TON`);
        } else {
          toast.error(`Rolled ${finalResult} - Better luck next time!`);
        }
      }
    }, 50);
  };

  const DiceIcon = DICE_ICONS[diceDisplay];

  return (
    <Card className="p-4 bg-card border-border">
      <div className="space-y-4">
        {/* Dice Display */}
        <div className="relative h-40 bg-muted/50 rounded-xl flex items-center justify-center">
          <motion.div
            animate={isRolling ? { rotate: 360 } : {}}
            transition={{ duration: 0.2, repeat: isRolling ? Infinity : 0 }}
          >
            <DiceIcon className="w-20 h-20 text-primary" />
          </motion.div>

          {result !== null && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute bottom-4 text-3xl font-bold"
            >
              {result}
            </motion.div>
          )}
        </div>

        {/* Bet Type Toggle */}
        <div className="flex gap-2">
          <Button
            variant={betType === "under" ? "default" : "outline"}
            className="flex-1"
            onClick={() => setBetType("under")}
            disabled={isRolling}
          >
            Under {target}
          </Button>
          <Button
            variant={betType === "over" ? "default" : "outline"}
            className="flex-1"
            onClick={() => setBetType("over")}
            disabled={isRolling}
          >
            Over {target}
          </Button>
        </div>

        {/* Target Slider */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Target: {target}</span>
            <span>Win Chance: {winChance.toFixed(1)}%</span>
          </div>
          <Slider
            value={[target]}
            onValueChange={([value]) => setTarget(value)}
            min={5}
            max={95}
            step={1}
            disabled={isRolling}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Multiplier: {multiplier.toFixed(2)}x</span>
            <span>Potential Win: {potentialWin.toFixed(2)} TON</span>
          </div>
        </div>

        {/* Bet Amount */}
        <div className="flex gap-2">
          <Input
            type="number"
            value={betAmount}
            onChange={(e) => setBetAmount(Number(e.target.value))}
            min={1}
            max={balance}
            disabled={isRolling}
            className="flex-1"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setBetAmount(Math.max(1, betAmount / 2))}
            disabled={isRolling}
          >
            ½
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setBetAmount(Math.min(balance, betAmount * 2))}
            disabled={isRolling}
          >
            2x
          </Button>
        </div>

        {/* Roll Button */}
        <Button 
          className="w-full" 
          size="lg"
          onClick={roll}
          disabled={isRolling || betAmount > balance}
        >
          {isRolling ? "Rolling..." : `🎲 Roll (${betAmount} TON)`}
        </Button>
      </div>
    </Card>
  );
};

export default DiceGame;
