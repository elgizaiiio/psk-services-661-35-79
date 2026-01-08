import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface DiceGameProps {
  coins: number;
  onWin: (amount: number) => void;
  onSpend: (amount: number) => boolean;
}

const BET_AMOUNT = 15;
const WIN_MULTIPLIER = 5;

const DICE_FACES = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

export const DiceGame: React.FC<DiceGameProps> = ({
  coins,
  onWin,
  onSpend,
}) => {
  const [guess, setGuess] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [displayDice, setDisplayDice] = useState<number>(0);

  const roll = () => {
    if (guess === null) {
      toast.error("Choose a number first!");
      return;
    }

    if (coins < BET_AMOUNT) {
      toast.error("Not enough coins!");
      return;
    }

    if (!onSpend(BET_AMOUNT)) return;

    setIsRolling(true);
    setResult(null);

    // Animate dice rolling
    let rollCount = 0;
    const rollInterval = setInterval(() => {
      setDisplayDice(Math.floor(Math.random() * 6));
      rollCount++;
      if (rollCount > 15) {
        clearInterval(rollInterval);
        
        // Final result
        const finalResult = Math.floor(Math.random() * 6) + 1;
        setDisplayDice(finalResult - 1);
        setResult(finalResult);
        setIsRolling(false);

        if (finalResult === guess) {
          const winAmount = BET_AMOUNT * WIN_MULTIPLIER;
          onWin(winAmount);
          toast.success(`🎲 Correct! You won ${winAmount} coins!`);
        } else {
          toast.error(`The number was ${finalResult}. Better luck!`);
        }
      }
    }, 100);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Dice */}
      <motion.div
        className="w-32 h-32 bg-card border-2 border-border rounded-2xl flex items-center justify-center text-7xl shadow-lg"
        animate={isRolling ? {
          rotate: [0, 360],
          scale: [1, 1.1, 1],
        } : {}}
        transition={{ duration: 0.5, repeat: isRolling ? Infinity : 0 }}
      >
        {DICE_FACES[displayDice]}
      </motion.div>

      {/* Result */}
      {result !== null && !isRolling && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`text-xl font-bold ${result === guess ? "text-green-500" : "text-destructive"}`}
        >
          Result: {result} {result === guess ? "✓ You Win!" : "✗ You Lose"}
        </motion.div>
      )}

      {/* Guess Buttons */}
      <div className="flex flex-col items-center gap-2">
        <p className="text-sm text-muted-foreground">Guess the number:</p>
        <div className="grid grid-cols-6 gap-2">
          {[1, 2, 3, 4, 5, 6].map((num) => (
            <Button
              key={num}
              variant={guess === num ? "default" : "outline"}
              size="lg"
              onClick={() => setGuess(num)}
              disabled={isRolling}
              className="w-12 h-12 text-xl"
            >
              {num}
            </Button>
          ))}
        </div>
      </div>

      {/* Roll Button */}
      <Button
        onClick={roll}
        disabled={isRolling || guess === null}
        size="lg"
        className="w-48 text-lg"
      >
        {isRolling ? "Rolling..." : `Roll Dice (${BET_AMOUNT} ⚡)`}
      </Button>

      <div className="text-center space-y-1">
        <p className="text-sm text-muted-foreground">
          Balance: {coins.toLocaleString()} ⚡
        </p>
        <p className="text-xs text-muted-foreground">
          Correct guess = {WIN_MULTIPLIER}x amount
        </p>
      </div>
    </div>
  );
};

export default DiceGame;
