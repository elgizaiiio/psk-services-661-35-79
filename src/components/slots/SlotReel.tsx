import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Symbol, SYMBOLS, SlotSymbol } from "./SlotSymbol";

interface SlotReelProps {
  spinning: boolean;
  finalSymbol: Symbol | null;
  delay: number;
  isWinning?: boolean;
  onSpinComplete?: () => void;
}

export const SlotReel = ({ spinning, finalSymbol, delay, isWinning, onSpinComplete }: SlotReelProps) => {
  const [displayedSymbols, setDisplayedSymbols] = useState<Symbol[]>([
    SYMBOLS[0], SYMBOLS[1], SYMBOLS[2]
  ]);
  const [isSpinning, setIsSpinning] = useState(false);

  useEffect(() => {
    if (spinning) {
      setIsSpinning(true);
      
      // Rapid symbol changes during spin
      const spinInterval = setInterval(() => {
        setDisplayedSymbols([
          SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
          SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
          SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        ]);
      }, 80);

      // Stop after delay
      const stopTimeout = setTimeout(() => {
        clearInterval(spinInterval);
        if (finalSymbol) {
          setDisplayedSymbols([
            SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
            finalSymbol,
            SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
          ]);
        }
        setIsSpinning(false);
        onSpinComplete?.();
      }, 1000 + delay);

      return () => {
        clearInterval(spinInterval);
        clearTimeout(stopTimeout);
      };
    }
  }, [spinning, finalSymbol, delay, onSpinComplete]);

  return (
    <div className="relative w-24 h-28 overflow-hidden rounded-xl bg-gradient-to-b from-muted/80 to-muted border-2 border-primary/30 shadow-[0_0_20px_hsl(var(--primary)/0.3)]">
      {/* Top shadow overlay */}
      <div className="absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-black/60 to-transparent z-10 pointer-events-none" />
      
      {/* Bottom shadow overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-black/60 to-transparent z-10 pointer-events-none" />

      {/* Symbols container */}
      <motion.div 
        className="flex flex-col items-center justify-center h-full"
        animate={isSpinning ? { y: [-10, 10] } : { y: 0 }}
        transition={isSpinning ? { 
          duration: 0.1, 
          repeat: Infinity, 
          repeatType: "reverse" 
        } : { 
          type: "spring", 
          stiffness: 300, 
          damping: 20 
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={displayedSymbols[1].id + Math.random()}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.1 }}
          >
            <SlotSymbol symbol={displayedSymbols[1]} isWinning={isWinning && !isSpinning} />
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Spinning blur effect */}
      {isSpinning && (
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/10 to-transparent animate-pulse" />
      )}

      {/* Win glow effect */}
      {isWinning && !isSpinning && (
        <motion.div
          className="absolute inset-0 border-2 border-yellow-400 rounded-xl"
          animate={{ 
            boxShadow: ['0 0 10px #FFD700', '0 0 30px #FFD700', '0 0 10px #FFD700']
          }}
          transition={{ duration: 0.5, repeat: Infinity }}
        />
      )}
    </div>
  );
};
