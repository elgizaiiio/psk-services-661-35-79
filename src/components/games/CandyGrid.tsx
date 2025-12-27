import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import CandyPiece from './CandyPiece';
import { CandyCell } from '@/hooks/useCandyCrush';

interface CandyGridProps {
  grid: CandyCell[][];
  selectedCell: { row: number; col: number } | null;
  onCellClick: (row: number, col: number) => void;
  isAnimating: boolean;
}

const CandyGrid: React.FC<CandyGridProps> = ({ 
  grid, 
  selectedCell, 
  onCellClick,
  isAnimating 
}) => {
  const cellSize = useMemo(() => {
    // Calculate cell size based on screen width
    const maxWidth = Math.min(window.innerWidth - 32, 400);
    const cols = grid[0]?.length || 8;
    return Math.floor((maxWidth - (cols - 1) * 4) / cols);
  }, [grid]);

  const rows = grid.length;
  const cols = grid[0]?.length || 0;

  return (
    <motion.div 
      className="relative bg-gradient-to-br from-purple-900/50 to-pink-900/50 p-3 rounded-2xl backdrop-blur-sm border border-white/10"
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div 
        className="grid gap-1"
        style={{ 
          gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
          gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
        }}
      >
        {grid.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <CandyPiece
              key={cell.id}
              cell={cell}
              isSelected={
                selectedCell?.row === rowIndex && selectedCell?.col === colIndex
              }
              onClick={() => !isAnimating && onCellClick(rowIndex, colIndex)}
              size={cellSize}
            />
          ))
        )}
      </div>
      
      {isAnimating && (
        <div className="absolute inset-0 bg-black/10 rounded-2xl pointer-events-none" />
      )}
    </motion.div>
  );
};

export default CandyGrid;
