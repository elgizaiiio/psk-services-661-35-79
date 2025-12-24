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
}

export const SYMBOLS: Symbol[] = [
  { id: 'star-happy', image: starHappy, value: 10 },
  { id: 'star-angry', image: starAngry, value: 15 },
  { id: 'bolt', image: bolt, value: 25 },
  { id: 'b-logo', image: bLogo, value: 50 },
  { id: 'battery', image: battery, value: 100 },
];

interface SlotSymbolProps {
  symbol: Symbol;
  size?: 'sm' | 'md' | 'lg';
  isWinning?: boolean;
}

export const SlotSymbol = ({ symbol, size = 'md', isWinning }: SlotSymbolProps) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-14 h-14',
    lg: 'w-20 h-20'
  };

  return (
    <motion.div
      className={`flex items-center justify-center ${sizeClasses[size]}`}
      animate={isWinning ? {
        scale: [1, 1.15, 1],
        filter: ['drop-shadow(0 0 8px rgba(0,255,150,0.5))', 'drop-shadow(0 0 20px rgba(0,255,150,1))', 'drop-shadow(0 0 8px rgba(0,255,150,0.5))'],
      } : {}}
      transition={{ duration: 0.6, repeat: isWinning ? Infinity : 0 }}
    >
      <img 
        src={symbol.image} 
        alt={symbol.id} 
        className="w-full h-full object-contain"
        draggable={false}
      />
    </motion.div>
  );
};

export const getRandomSymbol = (): Symbol => {
  return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
};
