import { motion } from "framer-motion";

export interface Symbol {
  id: string;
  emoji: string;
  value: number;
  color: string;
}

export const SYMBOLS: Symbol[] = [
  { id: 'cherry', emoji: '🍒', value: 10, color: '#FF6B6B' },
  { id: 'lemon', emoji: '🍋', value: 15, color: '#FFE66D' },
  { id: 'orange', emoji: '🍊', value: 20, color: '#FFA94D' },
  { id: 'grape', emoji: '🍇', value: 25, color: '#9775FA' },
  { id: 'watermelon', emoji: '🍉', value: 30, color: '#FF8787' },
  { id: 'diamond', emoji: '💎', value: 50, color: '#74C0FC' },
  { id: 'seven', emoji: '7️⃣', value: 100, color: '#FFD43B' },
  { id: 'star', emoji: '⭐', value: 75, color: '#FFE066' },
];

interface SlotSymbolProps {
  symbol: Symbol;
  isWinning?: boolean;
}

export const SlotSymbol = ({ symbol, isWinning }: SlotSymbolProps) => {
  return (
    <motion.div
      className="w-20 h-20 flex items-center justify-center text-5xl"
      animate={isWinning ? {
        scale: [1, 1.2, 1],
        filter: ['brightness(1)', 'brightness(1.5)', 'brightness(1)'],
      } : {}}
      transition={{ duration: 0.5, repeat: isWinning ? Infinity : 0 }}
    >
      {symbol.emoji}
    </motion.div>
  );
};

export const getRandomSymbol = (): Symbol => {
  return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
};
