import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Sparkles, Zap, Star, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Import new character images
import cyberWarrior from '@/assets/characters/cyber-warrior-3d.png';
import fireDragon from '@/assets/characters/fire-dragon-3d.png';
import iceSorceress from '@/assets/characters/ice-sorceress-3d.png';
import goldenKnight from '@/assets/characters/golden-knight-3d.png';
import shadowAssassin from '@/assets/characters/shadow-assassin-3d.png';
import thunderSamurai from '@/assets/characters/thunder-samurai-3d.png';
import cosmicPhoenix from '@/assets/characters/cosmic-phoenix-3d.png';

// Character data with new images
const characters = [
  {
    id: 1,
    name: 'Cyber Warrior',
    nameAr: 'المحارب السايبر',
    tier: 'common',
    image: cyberWarrior,
    stats: { speed: 1.0, boost: 10, coins: 15 },
    glowColor: 'rgba(59, 130, 246, 0.6)',
    borderColor: 'border-blue-500/50',
  },
  {
    id: 2,
    name: 'Fire Dragon',
    nameAr: 'تنين النار',
    tier: 'rare',
    image: fireDragon,
    stats: { speed: 1.5, boost: 20, coins: 30 },
    glowColor: 'rgba(239, 68, 68, 0.6)',
    borderColor: 'border-red-500/50',
  },
  {
    id: 3,
    name: 'Ice Sorceress',
    nameAr: 'ساحرة الجليد',
    tier: 'rare',
    image: iceSorceress,
    stats: { speed: 1.8, boost: 25, coins: 40 },
    glowColor: 'rgba(147, 197, 253, 0.6)',
    borderColor: 'border-cyan-400/50',
  },
  {
    id: 4,
    name: 'Shadow Assassin',
    nameAr: 'قاتل الظلال',
    tier: 'epic',
    image: shadowAssassin,
    stats: { speed: 2.2, boost: 35, coins: 60 },
    glowColor: 'rgba(168, 85, 247, 0.6)',
    borderColor: 'border-purple-500/50',
  },
  {
    id: 5,
    name: 'Thunder Samurai',
    nameAr: 'ساموراي الرعد',
    tier: 'epic',
    image: thunderSamurai,
    stats: { speed: 2.5, boost: 40, coins: 80 },
    glowColor: 'rgba(59, 130, 246, 0.6)',
    borderColor: 'border-blue-400/50',
  },
  {
    id: 6,
    name: 'Golden Knight',
    nameAr: 'الفارس الذهبي',
    tier: 'legendary',
    image: goldenKnight,
    stats: { speed: 3.0, boost: 50, coins: 100 },
    glowColor: 'rgba(245, 158, 11, 0.6)',
    borderColor: 'border-yellow-500/50',
  },
  {
    id: 7,
    name: 'Cosmic Phoenix',
    nameAr: 'طائر الفينيق الكوني',
    tier: 'mythic',
    image: cosmicPhoenix,
    stats: { speed: 4.0, boost: 75, coins: 150 },
    glowColor: 'rgba(236, 72, 153, 0.6)',
    borderColor: 'border-pink-500/50',
  },
];

const tierColors: Record<string, string> = {
  common: 'from-blue-400 to-blue-600',
  rare: 'from-red-400 to-orange-600',
  epic: 'from-purple-400 to-pink-600',
  legendary: 'from-yellow-400 to-amber-600',
  mythic: 'from-pink-400 via-purple-500 to-indigo-600',
};

const tierBadgeColors: Record<string, string> = {
  common: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  rare: 'bg-red-500/20 text-red-300 border-red-500/30',
  epic: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  legendary: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  mythic: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
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

      {/* Character Display */}
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

        {/* Character Image with Animations */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentCharacter.id}
            initial={{ opacity: 0, scale: 0.8, x: 50 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: -50 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="mx-8 flex justify-center"
          >
            <div className="relative">
              {/* Glow ring behind character */}
              <motion.div 
                className="absolute inset-0 rounded-full blur-2xl opacity-60"
                style={{ background: currentCharacter.glowColor }}
                animate={{ 
                  scale: [1, 1.1, 1],
                  opacity: [0.4, 0.7, 0.4]
                }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
              
              {/* Character Image */}
              <motion.img
                src={currentCharacter.image}
                alt={currentCharacter.name}
                className={`relative z-10 object-contain drop-shadow-2xl ${compact ? 'h-48' : 'h-72'}`}
                style={{ 
                  filter: `drop-shadow(0 0 30px ${currentCharacter.glowColor})`,
                }}
                animate={{ 
                  y: [0, -8, 0],
                }}
                transition={{ 
                  duration: 3, 
                  repeat: Infinity, 
                  ease: 'easeInOut' 
                }}
              />

              {/* Mythic crown indicator */}
              {currentCharacter.tier === 'mythic' && (
                <motion.div
                  className="absolute -top-4 left-1/2 -translate-x-1/2"
                  animate={{ y: [0, -3, 0], rotate: [0, 5, 0, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Crown className="w-8 h-8 text-pink-400 drop-shadow-lg" />
                </motion.div>
              )}
            </div>
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
