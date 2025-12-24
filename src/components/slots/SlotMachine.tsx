import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { SlotReel } from "./SlotReel";
import { Symbol, SYMBOLS, getRandomSymbol } from "./SlotSymbol";
import { Coins, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface SlotMachineProps {
  coins: number;
  onCoinsChange: (newCoins: number) => void;
  spinCost?: number;
}

export const SlotMachine = ({ coins, onCoinsChange, spinCost = 10 }: SlotMachineProps) => {
  const [spinning, setSpinning] = useState(false);
  const [results, setResults] = useState<Symbol[]>([SYMBOLS[0], SYMBOLS[1], SYMBOLS[2]]);
  const [winningIndexes, setWinningIndexes] = useState<number[]>([]);
  const [lastWin, setLastWin] = useState<number>(0);
  const [completedReels, setCompletedReels] = useState(0);

  const calculateWin = useCallback((symbols: Symbol[]): number => {
    const [s1, s2, s3] = symbols;
    
    // 3 matching symbols - big win!
    if (s1.id === s2.id && s2.id === s3.id) {
      return s1.value * 10;
    }
    
    // 2 matching symbols - small win
    if (s1.id === s2.id || s2.id === s3.id || s1.id === s3.id) {
      const matchingSymbol = s1.id === s2.id ? s1 : (s2.id === s3.id ? s2 : s1);
      return matchingSymbol.value * 2;
    }
    
    return 0;
  }, []);

  const getWinningIndexes = useCallback((symbols: Symbol[]): number[] => {
    const [s1, s2, s3] = symbols;
    
    if (s1.id === s2.id && s2.id === s3.id) {
      return [0, 1, 2];
    }
    if (s1.id === s2.id) return [0, 1];
    if (s2.id === s3.id) return [1, 2];
    if (s1.id === s3.id) return [0, 2];
    
    return [];
  }, []);

  const handleSpin = useCallback(() => {
    if (spinning) return;
    
    if (coins < spinCost) {
      toast.error(`تحتاج ${spinCost} عملة للدوران!`);
      return;
    }

    // Deduct spin cost
    onCoinsChange(coins - spinCost);
    
    setSpinning(true);
    setWinningIndexes([]);
    setLastWin(0);
    setCompletedReels(0);

    // Generate random results
    const newResults = [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()];
    setResults(newResults);

  }, [spinning, coins, spinCost, onCoinsChange]);

  const handleReelComplete = useCallback(() => {
    setCompletedReels(prev => {
      const newCount = prev + 1;
      
      if (newCount === 3) {
        // All reels stopped - calculate win
        setSpinning(false);
        const winAmount = calculateWin(results);
        const indexes = getWinningIndexes(results);
        
        setWinningIndexes(indexes);
        setLastWin(winAmount);
        
        if (winAmount > 0) {
          onCoinsChange(coins - spinCost + winAmount);
          
          if (indexes.length === 3) {
            toast.success(`🎰 جاكبوت! ربحت ${winAmount} عملة!`, {
              duration: 3000,
            });
          } else {
            toast.success(`🎉 فوز! ربحت ${winAmount} عملة!`);
          }
        }
      }
      
      return newCount;
    });
  }, [results, calculateWin, getWinningIndexes, onCoinsChange, coins, spinCost]);

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Coins display */}
      <motion.div 
        className="flex items-center gap-2 bg-gradient-to-r from-yellow-600/20 to-yellow-500/20 px-6 py-3 rounded-full border border-yellow-500/30"
        animate={lastWin > 0 ? { scale: [1, 1.1, 1] } : {}}
        transition={{ duration: 0.3 }}
      >
        <Coins className="w-6 h-6 text-yellow-400" />
        <span className="text-2xl font-bold text-yellow-400">{coins.toLocaleString()}</span>
      </motion.div>

      {/* Last win display */}
      {lastWin > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-xl font-bold text-primary"
        >
          <Sparkles className="w-5 h-5" />
          <span>+{lastWin}</span>
          <Sparkles className="w-5 h-5" />
        </motion.div>
      )}

      {/* Slot machine frame */}
      <div className="relative p-6 bg-gradient-to-b from-muted/50 to-card rounded-3xl border-2 border-primary/30 shadow-[0_0_40px_hsl(var(--primary)/0.2)]">
        {/* Decorative lights */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex gap-2">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="w-3 h-3 rounded-full bg-primary"
              animate={{ 
                opacity: spinning ? [0.3, 1, 0.3] : 1,
                scale: spinning ? [1, 1.2, 1] : 1
              }}
              transition={{ 
                duration: 0.5, 
                delay: i * 0.1,
                repeat: spinning ? Infinity : 0
              }}
            />
          ))}
        </div>

        {/* Reels container */}
        <div className="flex gap-3 p-4 bg-black/50 rounded-2xl">
          <SlotReel 
            spinning={spinning} 
            finalSymbol={results[0]} 
            delay={0}
            isWinning={winningIndexes.includes(0)}
            onSpinComplete={handleReelComplete}
          />
          <SlotReel 
            spinning={spinning} 
            finalSymbol={results[1]} 
            delay={300}
            isWinning={winningIndexes.includes(1)}
            onSpinComplete={handleReelComplete}
          />
          <SlotReel 
            spinning={spinning} 
            finalSymbol={results[2]} 
            delay={600}
            isWinning={winningIndexes.includes(2)}
            onSpinComplete={handleReelComplete}
          />
        </div>

        {/* Win line indicator */}
        <div className="absolute left-2 right-2 top-1/2 -translate-y-1/2 pointer-events-none">
          <div className={`h-0.5 ${winningIndexes.length > 0 ? 'bg-yellow-400 shadow-[0_0_10px_#FFD700]' : 'bg-primary/30'}`} />
        </div>
      </div>

      {/* Spin cost indicator */}
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Coins className="w-4 h-4" />
        <span>تكلفة الدوران: {spinCost} عملة</span>
      </div>

      {/* Spin button */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          size="lg"
          onClick={handleSpin}
          disabled={spinning || coins < spinCost}
          className="px-12 py-6 text-xl font-bold bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 rounded-full shadow-[0_0_30px_hsl(var(--primary)/0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {spinning ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Zap className="w-8 h-8" />
            </motion.div>
          ) : (
            <span className="flex items-center gap-2">
              <Zap className="w-6 h-6" />
              SPIN
            </span>
          )}
        </Button>
      </motion.div>

      {/* Prize table */}
      <div className="w-full max-w-sm bg-card/50 rounded-xl p-4 border border-border">
        <h3 className="text-center font-bold text-primary mb-3">جدول الجوائز</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center">
            <span>7️⃣ 7️⃣ 7️⃣</span>
            <span className="text-yellow-400 font-bold">×1000</span>
          </div>
          <div className="flex justify-between items-center">
            <span>💎 💎 💎</span>
            <span className="text-yellow-400 font-bold">×500</span>
          </div>
          <div className="flex justify-between items-center">
            <span>⭐ ⭐ ⭐</span>
            <span className="text-yellow-400 font-bold">×750</span>
          </div>
          <div className="flex justify-between items-center text-muted-foreground">
            <span>أي 3 متطابقة</span>
            <span>×10</span>
          </div>
          <div className="flex justify-between items-center text-muted-foreground">
            <span>أي 2 متطابقة</span>
            <span>×2</span>
          </div>
        </div>
      </div>
    </div>
  );
};
