import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { Symbol, SYMBOLS, SlotSymbol } from "./SlotSymbol";

interface SlotReelProps {
  spinning: boolean;
  finalSymbol: Symbol | null;
  delay: number;
  isWinning?: boolean;
  onSpinComplete?: () => void;
}

export const SlotReel = ({ spinning, finalSymbol, delay, isWinning, onSpinComplete }: SlotReelProps) => {
  const [currentSymbol, setCurrentSymbol] = useState<Symbol>(SYMBOLS[0]);
  const [isAnimating, setIsAnimating] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (spinning) {
      setIsAnimating(true);
      
      // Fast symbol cycling
      intervalRef.current = setInterval(() => {
        setCurrentSymbol(SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]);
      }, 60);

      // Stop after delay
      timeoutRef.current = setTimeout(() => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        if (finalSymbol) {
          setCurrentSymbol(finalSymbol);
        }
        setIsAnimating(false);
        onSpinComplete?.();
      }, 800 + delay);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [spinning, finalSymbol, delay, onSpinComplete]);

  return (
    <div className="relative">
      {/* Reel container */}
      <motion.div 
        className={`
          w-24 h-24 
          flex items-center justify-center 
          rounded-2xl
          bg-gradient-to-b from-muted/80 to-muted/40
          border border-border/50
          backdrop-blur-sm
          overflow-hidden
          ${isWinning && !isAnimating ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}
        `}
        animate={isAnimating ? { 
          y: [0, -4, 4, -2, 2, 0]
        } : isWinning ? {
          scale: [1, 1.02, 1]
        } : {}}
        transition={isAnimating ? { 
          duration: 0.15, 
          repeat: Infinity,
          ease: "linear"
        } : { 
          duration: 0.4,
          repeat: isWinning ? Infinity : 0
        }}
      >
        {/* Symbol */}
        <SlotSymbol 
          symbol={currentSymbol} 
          size="lg"
          isWinning={isWinning && !isAnimating} 
        />

        {/* Spinning overlay effect */}
        {isAnimating && (
          <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-primary/10 pointer-events-none" />
        )}
      </motion.div>

      {/* Win glow */}
      {isWinning && !isAnimating && (
        <motion.div
          className="absolute -inset-1 rounded-2xl bg-primary/20 -z-10"
          animate={{ 
            opacity: [0.3, 0.6, 0.3],
            scale: [1, 1.05, 1]
          }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      )}
    </div>
  );
};
