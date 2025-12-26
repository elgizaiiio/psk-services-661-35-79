import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Sparkles, Zap, Star } from 'lucide-react';
import { Character3DViewer } from './Character3DViewer';
import { Button } from '@/components/ui/button';

// Character data with 3D models
const characters = [
  {
    id: 1,
    name: 'Bolt Starter',
    tier: 'common',
    model: '/models/characters/fox.glb',
    stats: { speed: 1.0, boost: 5, coins: 10 },
    glowColor: 'rgba(156, 163, 175, 0.5)',
  },
  {
    id: 2,
    name: 'Shadow Runner',
    tier: 'rare',
    model: '/models/characters/cesium-man.glb',
    stats: { speed: 1.5, boost: 15, coins: 25 },
    glowColor: 'rgba(59, 130, 246, 0.5)',
  },
  {
    id: 3,
    name: 'Crystal Mage',
    tier: 'epic',
    model: '/models/characters/crystal.glb',
    stats: { speed: 2.0, boost: 25, coins: 50 },
    glowColor: 'rgba(168, 85, 247, 0.5)',
  },
  {
    id: 4,
    name: 'Cyber Ninja',
    tier: 'epic',
    model: '/models/characters/cyber.glb',
    stats: { speed: 2.5, boost: 30, coins: 75 },
    glowColor: 'rgba(236, 72, 153, 0.5)',
  },
  {
    id: 5,
    name: 'Thunder Dragon',
    tier: 'legendary',
    model: '/models/characters/brainstem.glb',
    stats: { speed: 3.0, boost: 40, coins: 100 },
    glowColor: 'rgba(245, 158, 11, 0.5)',
  },
];

const tierColors: Record<string, string> = {
  common: 'from-gray-400 to-gray-600',
  rare: 'from-blue-400 to-blue-600',
  epic: 'from-purple-400 to-pink-600',
  legendary: 'from-yellow-400 to-orange-600',
};

const tierBadgeColors: Record<string, string> = {
  common: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
  rare: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  epic: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  legendary: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
};

interface HeroCharacterDisplayProps {
  onCharacterChange?: (character: typeof characters[0]) => void;
  className?: string;
  compact?: boolean;
}

export const HeroCharacterDisplay: React.FC<HeroCharacterDisplayProps> = ({
  onCharacterChange,
  className = '',
  compact = false,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const currentCharacter = characters[currentIndex];

  const handleNext = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev + 1) % characters.length);
  };

  const handlePrev = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev - 1 + characters.length) % characters.length);
  };

  useEffect(() => {
    if (isTransitioning) {
      const timer = setTimeout(() => setIsTransitioning(false), 500);
      return () => clearTimeout(timer);
    }
  }, [isTransitioning]);

  useEffect(() => {
    onCharacterChange?.(currentCharacter);
  }, [currentCharacter, onCharacterChange]);

  return (
    <div className={`relative ${className}`}>
      {/* Background glow effect */}
      <div 
        className="absolute inset-0 blur-3xl opacity-30 transition-all duration-500"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${currentCharacter.glowColor}, transparent 70%)`
        }}
      />

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-primary/60 rounded-full"
            initial={{ 
              x: Math.random() * 100 + '%', 
              y: '100%',
              opacity: 0 
            }}
            animate={{ 
              y: '-20%',
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: i * 0.5,
              ease: 'linear'
            }}
          />
        ))}
      </div>

      {/* Character name and tier badge */}
      <motion.div 
        className="text-center mb-2 relative z-10"
        key={currentCharacter.name}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${tierBadgeColors[currentCharacter.tier]}`}>
          <Sparkles className="w-3 h-3" />
          {currentCharacter.tier.toUpperCase()}
        </span>
        <h2 className={`text-lg font-bold mt-1 bg-gradient-to-r ${tierColors[currentCharacter.tier]} bg-clip-text text-transparent`}>
          {currentCharacter.name}
        </h2>
      </motion.div>

      {/* 3D Character Display */}
      <div className="relative">
        {/* Navigation arrows */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-background/20 backdrop-blur-sm hover:bg-background/40 h-10 w-8"
          onClick={handlePrev}
          disabled={isTransitioning}
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-background/20 backdrop-blur-sm hover:bg-background/40 h-10 w-8"
          onClick={handleNext}
          disabled={isTransitioning}
        >
          <ChevronRight className="w-5 h-5" />
        </Button>

        {/* 3D Viewer */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentCharacter.id}
            initial={{ opacity: 0, scale: 0.9, rotateY: -30 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            exit={{ opacity: 0, scale: 0.9, rotateY: 30 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="mx-8"
          >
            <Character3DViewer
              modelPath={currentCharacter.model}
              autoRotate={true}
              height={compact ? 180 : 280}
              interactive={true}
              glowColor={currentCharacter.glowColor}
            />
          </motion.div>
        </AnimatePresence>

        {/* Character indicator dots */}
        <div className="flex justify-center gap-1.5 mt-2">
          {characters.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                if (!isTransitioning && index !== currentIndex) {
                  setIsTransitioning(true);
                  setCurrentIndex(index);
                }
              }}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentIndex 
                  ? 'bg-primary w-4' 
                  : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Stats bar */}
      {!compact && (
        <motion.div 
          className="flex justify-center gap-4 mt-3"
          key={`stats-${currentCharacter.id}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <div className="flex items-center gap-1 text-xs">
            <Zap className="w-3.5 h-3.5 text-yellow-400" />
            <span className="text-muted-foreground">Speed</span>
            <span className="font-bold text-foreground">{currentCharacter.stats.speed}x</span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-muted-foreground">Boost</span>
            <span className="font-bold text-foreground">+{currentCharacter.stats.boost}%</span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <Star className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-muted-foreground">Coins</span>
            <span className="font-bold text-foreground">+{currentCharacter.stats.coins}</span>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default HeroCharacterDisplay;
