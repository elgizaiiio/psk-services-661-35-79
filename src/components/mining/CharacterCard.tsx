import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { MiningCharacter, UserCharacter } from '@/types/mining';
import { useLanguage } from '@/contexts/LanguageContext';
import { Zap, Clock, Coins, Target, Check, Crown, Sparkles, ArrowUp } from 'lucide-react';

interface CharacterCardProps {
  character: MiningCharacter;
  userCharacter?: UserCharacter;
  onPurchase: (characterId: string, method: 'ton' | 'tokens') => void;
  onActivate: (userCharacterId: string) => void;
  onEvolve?: (userCharacterId: string) => void;
  isLoading?: boolean;
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
  isLoading
}) => {
  const { language } = useLanguage();
  
  const getName = () => {
    if (language === 'ar') return character.name_ar;
    if (language === 'ru') return character.name_ru;
    return character.name;
  };

  const getDescription = () => {
    if (language === 'ar') return character.description_ar;
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
  const nextEvolutionCost = canEvolve ? character.evolution_costs[currentStage - 1] : 0;

  // Calculate boosted stats based on evolution
  const speedBoost = 1 + ((currentStage - 1) * 0.2); // +20% per evolution
  const effectiveSpeed = character.mining_speed_multiplier * speedBoost;

  return (
    <Card className={`p-4 bg-gradient-to-br ${tierGradients[character.tier]} border-2 ${isActive ? 'border-primary' : 'border-border/50'} relative overflow-hidden`}>
      {isActive && (
        <div className="absolute top-2 left-2">
          <Badge className="bg-primary text-primary-foreground">
            <Check className="w-3 h-3 mr-1" />
            Active
          </Badge>
        </div>
      )}
      
      {character.tier === 'legendary' && (
        <Crown className="absolute top-2 right-2 w-5 h-5 text-yellow-500" />
      )}

      <div className="text-center mb-4 mt-4">
        <div className="text-5xl mb-2">{character.image_url}</div>
        <h3 className="font-bold text-lg text-foreground">{getName()}</h3>
        <Badge className={`${tierColors[character.tier]} text-white mt-1`}>
          {character.tier.toUpperCase()}
        </Badge>
        {isOwned && (
          <div className="mt-2">
            <Badge variant="outline" className="text-xs">
              <Sparkles className="w-3 h-3 mr-1" />
              Stage {currentStage}/{maxStages}
            </Badge>
          </div>
        )}
      </div>

      {/* Evolution Progress */}
      {isOwned && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Evolution</span>
            <span>{currentStage}/{maxStages}</span>
          </div>
          <Progress value={evolutionProgress} className="h-2" />
        </div>
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
            <Button
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              onClick={() => onEvolve(userCharacter!.id)}
              disabled={isLoading}
            >
              <ArrowUp className="w-4 h-4 mr-2" />
              Evolve - {nextEvolutionCost.toLocaleString()} BOLT
            </Button>
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
          ) : (
            <Button
              className="w-full"
              onClick={() => onPurchase(character.id, 'tokens')}
              disabled={isLoading}
            >
              Buy - {character.price_tokens.toLocaleString()} BOLT
            </Button>
          )}
        </div>
      )}

      {/* Evolution costs preview for unowned characters */}
      {!isOwned && character.evolution_costs.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border/30">
          <p className="text-xs text-muted-foreground text-center mb-1">Evolution Costs:</p>
          <div className="flex flex-wrap gap-1 justify-center">
            {character.evolution_costs.map((cost, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {cost.toLocaleString()}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

export default CharacterCard;
