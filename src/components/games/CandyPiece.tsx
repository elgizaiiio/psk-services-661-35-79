import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { CandyCell } from '@/hooks/useCandyCrush';

interface CandyPieceProps {
  cell: CandyCell;
  isSelected: boolean;
  onClick: () => void;
  size: number;
}

const CandyPiece: React.FC<CandyPieceProps> = ({ cell, isSelected, onClick, size }) => {
  return (
    <motion.button
      onClick={onClick}
      className={cn(
        "flex items-center justify-center rounded-lg transition-all duration-150",
        "active:scale-90 touch-manipulation select-none",
        isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background scale-110 z-10",
        cell.isMatched && "opacity-0",
        cell.isSpecial === 'bomb' && "bg-gradient-to-br from-orange-500 to-red-600",
        cell.isSpecial === 'rocket-h' && "bg-gradient-to-r from-blue-500 to-cyan-400",
        cell.isSpecial === 'rocket-v' && "bg-gradient-to-b from-blue-500 to-cyan-400",
        !cell.isSpecial && "bg-card/50 hover:bg-card/80"
      )}
      style={{ 
        width: size, 
        height: size,
        fontSize: size * 0.6,
      }}
      initial={cell.isNew ? { y: -size * 2, opacity: 0 } : false}
      animate={{ 
        y: 0, 
        opacity: cell.isMatched ? 0 : 1,
        scale: cell.isMatched ? 1.2 : isSelected ? 1.1 : 1,
      }}
      transition={{ 
        type: 'spring',
        stiffness: 300,
        damping: 20,
      }}
      whileTap={{ scale: 0.9 }}
    >
      <span className="drop-shadow-lg">
        {cell.candy}
      </span>
      {cell.isSpecial === 'bomb' && (
        <motion.div 
          className="absolute inset-0 rounded-lg bg-orange-400/30"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 0.5, repeat: Infinity }}
        />
      )}
      {cell.isSpecial?.startsWith('rocket') && (
        <motion.div 
          className="absolute inset-0 rounded-lg bg-blue-400/30"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 0.4, repeat: Infinity }}
        />
      )}
    </motion.button>
  );
};

export default CandyPiece;
