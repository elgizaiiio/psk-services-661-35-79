import React, { useState, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { MiningCharacter, UserCharacter } from '@/types/mining';
import { useLanguage } from '@/contexts/LanguageContext';
import { Zap, Clock, Coins, Target, Check, Crown, Sparkles, ArrowUp, Wallet, Box, Image } from 'lucide-react';
import { Character3DViewer } from './Character3DViewer';

// Anime 3D Character images mapping
import shadowRunnerImg from '@/assets/characters/shadow-runner-3d.png';
import boltStarterImg from '@/assets/characters/bolt-starter-3d.png';
import thunderDragonImg from '@/assets/characters/thunder-dragon-3d.png';
import infinityPhoenixImg from '@/assets/characters/infinity-phoenix-3d.png';
import diamondEmperorImg from '@/assets/characters/diamond-emperor-3d.png';
import cyberNinjaImg from '@/assets/characters/cyber-ninja-3d.png';
import crystalMageImg from '@/assets/characters/crystal-mage-3d.png';

const characterImages: Record<string, string> = {
  'Shadow Runner': shadowRunnerImg,
  'Bolt Starter': boltStarterImg,
  'Thunder Dragon': thunderDragonImg,
  'Infinity Phoenix': infinityPhoenixImg,
  'Diamond Emperor': diamondEmperorImg,
  'Cyber Ninja': cyberNinjaImg,
  'Crystal Mage': crystalMageImg,
};

// 3D model mapping for characters (kept for future use)
const character3DModels: Record<string, string> = {
  'Bolt Starter': '/models/characters/fox.glb',
  'Shadow Runner': '/models/characters/cesium-man.glb',
  'Crystal Mage': '/models/characters/crystal.glb',
  'Cyber Ninja': '/models/characters/cyber.glb',
  'Thunder Dragon': '/models/characters/brainstem.glb',
  'Infinity Phoenix': '/models/characters/fox.glb',
  'Diamond Emperor': '/models/characters/cesium-man.glb',
};

// Tier glow colors for animations
const tierGlowColors: Record<string, string> = {
  beginner: 'rgba(100, 116, 139, 0.4)',
  professional: 'rgba(59, 130, 246, 0.4)',
  expert: 'rgba(168, 85, 247, 0.4)',
  master: 'rgba(249, 115, 22, 0.4)',
  legendary: 'rgba(234, 179, 8, 0.5)',
};

interface CharacterCardProps {
  character: MiningCharacter;
  userCharacter?: UserCharacter;
  onPurchase: (characterId: string, method: 'ton' | 'tokens') => void;
  onActivate: (userCharacterId: string) => void;
  onEvolve?: (userCharacterId: string, method: 'ton' | 'tokens') => void;
  getEvolutionTonCost?: (character: MiningCharacter, currentStage: number) => number;
  isLoading?: boolean;
  isWalletConnected?: boolean;
}

const tierColors: Record<string, string> = {
  beginner: 'bg-slate-500',
  professional: 'bg-blue-500',
  expert: 'bg-purple-500',
  master: 'bg-orange-500',
  legendary: 'bg-yellow-500',
};

const tierGradients: Record<string, string> = {
  beginner: 'from-slate-500/20 to-slate-600/20',
  professional: 'from-blue-500/20 to-blue-600/20',
  expert: 'from-purple-500/20 to-purple-600/20',
  master: 'from-orange-500/20 to-orange-600/20',
  legendary: 'from-yellow-500/20 to-yellow-600/20',
};

export const CharacterCard: React.FC<CharacterCardProps> = ({
  character,
  userCharacter,
  onPurchase,
  onActivate,
  onEvolve,
  getEvolutionTonCost,
  isLoading,
  isWalletConnected
}) => {
  const { language } = useLanguage();
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [showEvolveOptions, setShowEvolveOptions] = useState(false);
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');
  
  const has3DModel = !!character3DModels[character.name];
  
  const getName = () => {
    if (language === 'ru') return character.name_ru;
    return character.name;
  };

  const getDescription = () => {
    if (language === 'ru') return character.description_ru;
    return character.description;
  };

  const isOwned = !!userCharacter;
  const isActive = userCharacter?.is_active;
  const isFree = character.price_ton === 0 && character.price_tokens === 0;
  
  const currentStage = userCharacter?.evolution_stage || 1;
  const maxStages = character.max_evolution_stages;
  const evolutionProgress = (currentStage / maxStages) * 100;
  const canEvolve = isOwned && currentStage < maxStages;
  const nextEvolutionTokenCost = canEvolve ? character.evolution_costs[currentStage - 1] : 0;
  const nextEvolutionTonCost = canEvolve && getEvolutionTonCost 
    ? getEvolutionTonCost(character, currentStage) 
    : 0;

  // Calculate boosted stats based on evolution
  const speedBoost = 1 + ((currentStage - 1) * 0.2);
  const effectiveSpeed = character.mining_speed_multiplier * speedBoost;

  const handlePurchase = (method: 'ton' | 'tokens') => {
    setShowPaymentOptions(false);
    onPurchase(character.id, method);
  };

  const handleEvolve = (method: 'ton' | 'tokens') => {
    setShowEvolveOptions(false);
    if (onEvolve && userCharacter) {
      onEvolve(userCharacter.id, method);
    }
  };

  const glowColor = tierGlowColors[character.tier];

  return (
    <motion.div
      whileHover={{ 
        scale: 1.02,
        y: -4,
      }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      <Card 
        className={`p-4 bg-gradient-to-br ${tierGradients[character.tier]} border-2 ${isActive ? 'border-primary' : 'border-border/50'} relative overflow-hidden transition-shadow duration-300`}
        style={{
          boxShadow: isActive ? `0 0 20px ${glowColor}, 0 0 40px ${glowColor}` : 'none',
        }}
      >
        {/* Animated background particles for legendary */}
        {character.tier === 'legendary' && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-yellow-400 rounded-full"
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
                  duration: 2 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                  ease: "easeOut"
                }}
              />
            ))}
          </div>
        )}

        {isActive && (
          <motion.div 
            className="absolute top-2 left-2"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 15 }}
          >
            <Badge className="bg-primary text-primary-foreground">
              <Check className="w-3 h-3 mr-1" />
              Active
            </Badge>
          </motion.div>
        )}
        
        {character.tier === 'legendary' && (
          <motion.div
            animate={{ 
              rotate: [0, 10, -10, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Crown className="absolute top-2 right-2 w-5 h-5 text-yellow-500" />
          </motion.div>
        )}

        {/* 3D/2D Toggle Button */}
        {has3DModel && (
          <div className="absolute top-2 right-8 z-20">
            <Button
              variant="ghost"
              size="icon"
              className="w-7 h-7 bg-background/50 backdrop-blur-sm hover:bg-background/70"
              onClick={() => setViewMode(viewMode === '2d' ? '3d' : '2d')}
            >
              {viewMode === '2d' ? <Box className="w-4 h-4" /> : <Image className="w-4 h-4" />}
            </Button>
          </div>
        )}

        <div className="text-center mb-4 mt-4">
          {viewMode === '3d' && has3DModel ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="mx-auto mb-2"
            >
              <Character3DViewer
                modelPath={character3DModels[character.name]}
                height={120}
                autoRotate={true}
                interactive={true}
                glowColor={tierGlowColors[character.tier]}
                className="border-2 border-primary/30"
              />
            </motion.div>
          ) : characterImages[character.name] ? (
            <motion.div
              whileHover={{ 
                scale: 1.1,
                rotateY: 10,
              }}
              transition={{ type: "spring", stiffness: 300 }}
              className="relative inline-block"
            >
              <motion.div
                className="absolute inset-0 rounded-2xl"
                animate={isActive ? {
                  boxShadow: [
                    `0 0 10px ${glowColor}`,
                    `0 0 20px ${glowColor}`,
                    `0 0 10px ${glowColor}`,
                  ]
                } : {}}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <img 
                src={characterImages[character.name]} 
                alt={getName()} 
                className="w-24 h-24 mx-auto rounded-2xl mb-2 object-cover shadow-lg border-2 border-primary/30 relative z-10"
              />
            </motion.div>
          ) : character.image_url?.startsWith('http') ? (
            <motion.img 
              src={character.image_url} 
              alt={getName()} 
              className="w-24 h-24 mx-auto rounded-2xl mb-2 object-cover shadow-lg border-2 border-primary/30"
              whileHover={{ scale: 1.1 }}
            />
          ) : (
            <motion.div 
              className="text-5xl mb-2"
              whileHover={{ scale: 1.2, rotate: [0, -10, 10, 0] }}
              transition={{ duration: 0.3 }}
            >
              {character.image_url}
            </motion.div>
          )}
          <motion.h3 
            className="font-bold text-lg text-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {getName()}
          </motion.h3>
          <Badge className={`${tierColors[character.tier]} text-white mt-1`}>
            {character.tier.toUpperCase()}
          </Badge>
          {isOwned && (
            <motion.div 
              className="mt-2"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.1 }}
            >
              <Badge variant="outline" className="text-xs">
                <Sparkles className="w-3 h-3 mr-1" />
                Stage {currentStage}/{maxStages}
              </Badge>
            </motion.div>
          )}
        </div>

        {/* Evolution Progress */}
        {isOwned && (
          <motion.div 
            className="mb-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Evolution</span>
              <span>{currentStage}/{maxStages}</span>
            </div>
            <Progress value={evolutionProgress} className="h-2" />
          </motion.div>
        )}

      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1 text-muted-foreground">
            <Zap className="w-4 h-4" />
            Speed
          </span>
          <span className="font-bold text-foreground">
            {effectiveSpeed.toFixed(1)}x
            {isOwned && currentStage > 1 && (
              <span className="text-green-400 text-xs ml-1">
                (+{((speedBoost - 1) * 100).toFixed(0)}%)
              </span>
            )}
          </span>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1 text-muted-foreground">
            <Clock className="w-4 h-4" />
            Boost
          </span>
          <span className="font-bold text-foreground">+{character.boost_percentage}% / {character.boost_duration_minutes}min</span>
        </div>
        
        {character.extra_coins > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1 text-muted-foreground">
              <Coins className="w-4 h-4" />
              Extra Coins
            </span>
            <span className="font-bold text-foreground">+{character.extra_coins}</span>
          </div>
        )}
        
        {character.jackpot_chance_bonus > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1 text-muted-foreground">
              <Target className="w-4 h-4" />
              Jackpot Bonus
            </span>
            <span className="font-bold text-foreground">+{character.jackpot_chance_bonus}%</span>
          </div>
        )}
      </div>

      {isOwned ? (
        <div className="space-y-2">
          <Button
            className="w-full"
            variant={isActive ? "secondary" : "default"}
            onClick={() => onActivate(userCharacter!.id)}
            disabled={isActive || isLoading}
          >
            {isActive ? 'Active' : 'Activate'}
          </Button>
          
          {canEvolve && onEvolve && (
            <>
              {showEvolveOptions ? (
                <div className="space-y-2">
                  <Button
                    className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                    onClick={() => handleEvolve('ton')}
                    disabled={isLoading || !isWalletConnected}
                  >
                    <Wallet className="w-4 h-4 mr-2" />
                    {nextEvolutionTonCost} TON
                  </Button>
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => handleEvolve('tokens')}
                    disabled={isLoading}
                  >
                    <Coins className="w-4 h-4 mr-2" />
                    {nextEvolutionTokenCost.toLocaleString()} BOLT
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => setShowEvolveOptions(false)}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  onClick={() => setShowEvolveOptions(true)}
                  disabled={isLoading}
                >
                  <ArrowUp className="w-4 h-4 mr-2" />
                  Evolve Character
                </Button>
              )}
            </>
          )}
          
          {currentStage >= maxStages && (
            <div className="text-center text-xs text-yellow-500 font-bold">
              ✨ MAX EVOLUTION ✨
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {isFree ? (
            <Button
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
              onClick={() => onPurchase(character.id, 'tokens')}
              disabled={isLoading}
            >
              🎁 Claim FREE
            </Button>
          ) : showPaymentOptions ? (
            <div className="space-y-2">
              <Button
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                onClick={() => handlePurchase('ton')}
                disabled={isLoading || !isWalletConnected}
              >
                <Wallet className="w-4 h-4 mr-2" />
                {character.price_ton} TON
              </Button>
              {character.price_tokens > 0 && (
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => handlePurchase('tokens')}
                  disabled={isLoading}
                >
                  <Coins className="w-4 h-4 mr-2" />
                  {character.price_tokens.toLocaleString()} BOLT
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => setShowPaymentOptions(false)}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
              onClick={() => setShowPaymentOptions(true)}
              disabled={isLoading}
            >
              <Wallet className="w-4 h-4 mr-2" />
              Buy - {character.price_ton} TON
            </Button>
          )}
        </div>
      )}

        {/* Evolution costs preview for unowned characters */}
        {!isOwned && character.evolution_costs.length > 0 && (
          <motion.div 
            className="mt-3 pt-3 border-t border-border/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <p className="text-xs text-muted-foreground text-center mb-1">Evolution Costs (TON):</p>
            <div className="flex flex-wrap gap-1 justify-center">
              {character.evolution_costs.map((cost, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {(cost / 10000).toFixed(2)} TON
                </Badge>
              ))}
            </div>
          </motion.div>
        )}
      </Card>
    </motion.div>
  );
};

export default CharacterCard;
