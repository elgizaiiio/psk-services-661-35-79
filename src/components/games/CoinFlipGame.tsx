import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface CoinFlipGameProps {
  coins: number;
  onWin: (amount: number) => void;
  onSpend: (amount: number) => boolean;
}

type Choice = "heads" | "tails";

const BET_OPTIONS = [10, 25, 50, 100];

export const CoinFlipGame: React.FC<CoinFlipGameProps> = ({
  coins,
  onWin,
  onSpend,
}) => {
  const [choice, setChoice] = useState<Choice | null>(null);
  const [betAmount, setBetAmount] = useState(BET_OPTIONS[0]);
  const [isFlipping, setIsFlipping] = useState(false);
  const [result, setResult] = useState<Choice | null>(null);
  const [showResult, setShowResult] = useState(false);

  const flip = () => {
    if (!choice) {
      toast.error("Choose heads or tails first!");
      return;
    }

    if (coins < betAmount) {
      toast.error("Not enough coins!");
      return;
    }

    if (!onSpend(betAmount)) return;

    setIsFlipping(true);
    setShowResult(false);
    setResult(null);

    // Random result
    const flipResult: Choice = Math.random() > 0.5 ? "heads" : "tails";

    setTimeout(() => {
      setResult(flipResult);
      setIsFlipping(false);
      setShowResult(true);

      if (flipResult === choice) {
        const winAmount = betAmount * 2;
        onWin(winAmount);
        toast.success(`🎉 You won ${winAmount} coins!`);
      } else {
        toast.error("You lost! Better luck next time");
      }
    }, 2000);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Coin */}
      <div className="relative w-40 h-40">
        <motion.div
          className="w-full h-full rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-6xl shadow-xl border-4 border-yellow-300"
          animate={isFlipping ? {
            rotateY: [0, 1800],
            scale: [1, 1.2, 1],
          } : {}}
          transition={{ duration: 2, ease: "easeInOut" }}
        >
          {showResult ? (
            result === "heads" ? "👑" : "⭐"
          ) : (
            "🪙"
          )}
        </motion.div>
      </div>

      {/* Result */}
      {showResult && result && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`text-xl font-bold ${result === choice ? "text-green-500" : "text-destructive"}`}
        >
          {result === "heads" ? "Heads 👑" : "Tails ⭐"}
          {result === choice ? " - You Win!" : " - You Lose!"}
        </motion.div>
      )}

      {/* Choice Buttons */}
      <div className="flex gap-4">
        <Button
          variant={choice === "heads" ? "default" : "outline"}
          onClick={() => setChoice("heads")}
          disabled={isFlipping}
          className="w-28"
        >
          👑 Heads
        </Button>
        <Button
          variant={choice === "tails" ? "default" : "outline"}
          onClick={() => setChoice("tails")}
          disabled={isFlipping}
          className="w-28"
        >
          ⭐ Tails
        </Button>
      </div>

      {/* Bet Amount */}
      <div className="flex flex-col items-center gap-2">
        <p className="text-sm text-muted-foreground">Bet Amount:</p>
        <div className="flex gap-2">
          {BET_OPTIONS.map((amount) => (
            <Button
              key={amount}
              variant={betAmount === amount ? "default" : "outline"}
              size="sm"
              onClick={() => setBetAmount(amount)}
              disabled={isFlipping || coins < amount}
            >
              {amount}
            </Button>
          ))}
        </div>
      </div>

      {/* Flip Button */}
      <Button
        onClick={flip}
        disabled={isFlipping || !choice}
        size="lg"
        className="w-48 text-lg"
      >
        {isFlipping ? "Flipping..." : `Flip (${betAmount} ⚡)`}
      </Button>

      <p className="text-sm text-muted-foreground">
        Balance: {coins.toLocaleString()} ⚡
      </p>
    </div>
  );
};

export default CoinFlipGame;
