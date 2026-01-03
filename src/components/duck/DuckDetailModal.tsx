import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Gauge, Sparkles, Star } from 'lucide-react';
import { DuckCharacter } from '@/types/duck-characters';
import { getRarityColor, getRarityBorder } from '@/data/duckCharacters';
import { Button } from '@/components/ui/button';

interface DuckDetailModalProps {
  duck: DuckCharacter | null;
  isOpen: boolean;
  onClose: () => void;
}

const DuckDetailModal: React.FC<DuckDetailModalProps> = ({ duck, isOpen, onClose }) => {
  if (!duck) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 max-w-md mx-auto"
          >
            <div className={`relative bg-card rounded-3xl p-6 border-2 ${getRarityBorder(duck.rarity)} shadow-2xl overflow-hidden`}>
              {/* Close button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="absolute top-3 right-3 z-10"
              >
                <X className="w-5 h-5" />
              </Button>

              {/* Background gradient */}
              <div 
                className="absolute inset-0 opacity-10"
                style={{ 
                  background: `radial-gradient(circle at top, ${duck.color} 0%, transparent 60%)` 
                }}
              />

              {/* Content */}
              <div className="relative">
                {/* Duck avatar */}
                <motion.div
                  className="flex justify-center mb-4"
                  animate={{ 
                    y: [0, -10, 0],
                    rotate: [0, -3, 3, 0]
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <div 
                    className="w-28 h-28 rounded-full flex items-center justify-center text-7xl shadow-xl"
                    style={{ 
                      backgroundColor: `${duck.color}20`, 
                      border: `4px solid ${duck.color}`,
                      boxShadow: `0 0 30px ${duck.color}40`
                    }}
                  >
                    {duck.emoji}
                  </div>
                </motion.div>

                {/* Rarity badge */}
                <div className="flex justify-center mb-3">
                  <div className={`px-4 py-1.5 rounded-full text-sm font-bold uppercase text-white bg-gradient-to-r ${getRarityColor(duck.rarity)} flex items-center gap-1`}>
                    <Star className="w-4 h-4" />
                    {duck.rarity}
                  </div>
                </div>

                {/* Name */}
                <h2 className="text-center text-2xl font-bold text-foreground mb-1">
                  {duck.name}
                </h2>
                <p className="text-center text-lg text-muted-foreground mb-2">
                  {duck.nameAr}
                </p>

                {/* Personality */}
                <div 
                  className="text-center font-medium py-2 px-4 rounded-full mb-4 mx-auto w-fit"
                  style={{ backgroundColor: `${duck.color}30`, color: duck.color }}
                >
                  {duck.personality} • {duck.personalityAr}
                </div>

                {/* Description */}
                <div className="bg-muted/50 rounded-xl p-4 mb-4">
                  <p className="text-sm text-foreground text-center mb-2">{duck.description}</p>
                  <p className="text-sm text-muted-foreground text-center" dir="rtl">{duck.descriptionAr}</p>
                </div>

                {/* Stats */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">Stats</h3>
                  <DetailedStatBar icon={<Zap className="w-4 h-4" />} label="Power" value={duck.stats.power} color="#EF4444" />
                  <DetailedStatBar icon={<Gauge className="w-4 h-4" />} label="Speed" value={duck.stats.speed} color="#3B82F6" />
                  <DetailedStatBar icon={<Sparkles className="w-4 h-4" />} label="Luck" value={duck.stats.luck} color="#F59E0B" />
                </div>

                {/* Total power */}
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Power</span>
                    <span className="text-2xl font-bold" style={{ color: duck.color }}>
                      {duck.stats.power + duck.stats.speed + duck.stats.luck}
                    </span>
                  </div>
                </div>
              </div>

              {/* Legendary particles */}
              {duck.rarity === 'legendary' && (
                <motion.div
                  className="absolute inset-0 pointer-events-none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-2 h-2 rounded-full"
                      style={{ 
                        backgroundColor: duck.color,
                        left: `${15 + i * 15}%`,
                        top: '10%'
                      }}
                      animate={{
                        y: [0, 100, 0],
                        opacity: [0, 1, 0],
                        scale: [0, 1, 0]
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        delay: i * 0.5
                      }}
                    />
                  ))}
                </motion.div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

interface DetailedStatBarProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}

const DetailedStatBar: React.FC<DetailedStatBarProps> = ({ icon, label, value, color }) => (
  <div className="flex items-center gap-3">
    <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}20`, color }}>
      {icon}
    </div>
    <span className="text-sm text-muted-foreground w-14">{label}</span>
    <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
      <motion.div
        className="h-full rounded-full"
        style={{ backgroundColor: color }}
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 1, delay: 0.3 }}
      />
    </div>
    <span className="text-sm font-bold text-foreground w-8 text-right">{value}</span>
  </div>
);

export default DuckDetailModal;
