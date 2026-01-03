import React from 'react';
import { motion } from 'framer-motion';
import { DuckCharacter } from '@/types/duck-characters';
import { getRarityColor, getRarityBorder, getRarityGlow } from '@/data/duckCharacters';
import { Zap, Gauge, Sparkles } from 'lucide-react';

interface DuckCardProps {
  duck: DuckCharacter;
  onClick?: () => void;
  isSelected?: boolean;
}

const DuckCard: React.FC<DuckCardProps> = ({ duck, onClick, isSelected }) => {
  return (
    <motion.div
      onClick={onClick}
      className={`
        relative cursor-pointer rounded-2xl p-4 
        bg-card border-2 ${getRarityBorder(duck.rarity)}
        ${getRarityGlow(duck.rarity)} shadow-lg
        ${isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}
        transition-all duration-300 overflow-hidden
      `}
      whileHover={{ scale: 1.03, y: -5 }}
      whileTap={{ scale: 0.97 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      {/* Rarity badge */}
      <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-[10px] font-bold uppercase text-white bg-gradient-to-r ${getRarityColor(duck.rarity)}`}>
        {duck.rarity}
      </div>

      {/* Duck emoji/avatar */}
      <motion.div
        className="flex justify-center mb-3"
        animate={{ rotate: [0, -5, 5, -5, 0] }}
        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
      >
        <div 
          className="w-20 h-20 rounded-full flex items-center justify-center text-5xl shadow-inner"
          style={{ backgroundColor: `${duck.color}20`, border: `3px solid ${duck.color}` }}
        >
          {duck.emoji}
        </div>
      </motion.div>

      {/* Name */}
      <h3 className="text-center font-bold text-foreground text-lg mb-1">
        {duck.name}
      </h3>
      <p className="text-center text-muted-foreground text-xs mb-2">
        {duck.nameAr}
      </p>

      {/* Personality */}
      <div 
        className="text-center text-xs font-medium py-1 px-2 rounded-full mb-3"
        style={{ backgroundColor: `${duck.color}30`, color: duck.color }}
      >
        {duck.personality}
      </div>

      {/* Stats */}
      <div className="space-y-2">
        <StatBar icon={<Zap className="w-3 h-3" />} label="Power" value={duck.stats.power} color="#EF4444" />
        <StatBar icon={<Gauge className="w-3 h-3" />} label="Speed" value={duck.stats.speed} color="#3B82F6" />
        <StatBar icon={<Sparkles className="w-3 h-3" />} label="Luck" value={duck.stats.luck} color="#F59E0B" />
      </div>

      {/* Legendary glow effect */}
      {duck.rarity === 'legendary' && (
        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            background: `radial-gradient(circle at center, ${duck.color}20 0%, transparent 70%)`,
          }}
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
    </motion.div>
  );
};

interface StatBarProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}

const StatBar: React.FC<StatBarProps> = ({ icon, label, value, color }) => (
  <div className="flex items-center gap-2">
    <span className="text-muted-foreground">{icon}</span>
    <span className="text-[10px] text-muted-foreground w-10">{label}</span>
    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
      <motion.div
        className="h-full rounded-full"
        style={{ backgroundColor: color }}
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 1, delay: 0.2 }}
      />
    </div>
    <span className="text-[10px] font-bold text-foreground w-6">{value}</span>
  </div>
);

export default DuckCard;
