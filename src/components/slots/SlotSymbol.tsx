import { motion } from "framer-motion";

import starHappy from "@/assets/slots/star-happy.png";
import starAngry from "@/assets/slots/star-angry.png";
import bolt from "@/assets/slots/bolt.png";
import bLogo from "@/assets/slots/b-logo.png";
import battery from "@/assets/slots/battery.png";

export interface Symbol {
  id: string;
  image: string;
  value: number;
  color: string;
}

export const SYMBOLS: Symbol[] = [
  { id: 'star-happy', image: starHappy, value: 10, color: '#FFE066' },
  { id: 'star-angry', image: starAngry, value: 15, color: '#FFD43B' },
  { id: 'bolt', image: bolt, value: 25, color: '#74C0FC' },
  { id: 'b-logo', image: bLogo, value: 50, color: '#00D9FF' },
  { id: 'battery', image: battery, value: 100, color: '#FFD700' },
];

interface SlotSymbolProps {
  symbol: Symbol;
  isWinning?: boolean;
}

export const SlotSymbol = ({ symbol, isWinning }: SlotSymbolProps) => {
  return (
    <motion.div
      className="w-20 h-20 flex items-center justify-center"
      animate={isWinning ? {
        scale: [1, 1.2, 1],
        filter: ['brightness(1)', 'brightness(1.5)', 'brightness(1)'],
      } : {}}
      transition={{ duration: 0.5, repeat: isWinning ? Infinity : 0 }}
    >
      <img 
        src={symbol.image} 
        alt={symbol.id} 
        className="w-16 h-16 object-contain drop-shadow-lg"
      />
    </motion.div>
  );
};

export const getRandomSymbol = (): Symbol => {
  return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
};
