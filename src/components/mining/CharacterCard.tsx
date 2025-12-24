import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MiningCharacter, UserCharacter } from '@/types/mining';
import { useLanguage } from '@/contexts/LanguageContext';
import { Zap, Clock, Coins, Target, Check, Crown } from 'lucide-react';

interface CharacterCardProps {
  character: MiningCharacter;
  userCharacter?: UserCharacter;
  onPurchase: (characterId: string, method: 'ton' | 'tokens') => void;
  onActivate: (userCharacterId: string) => void;
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
  isLoading
}) => {
  const { language, t, isRTL } = useLanguage();
  
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

  return (
    <Card className={`p-4 bg-gradient-to-br ${tierGradients[character.tier]} border-2 ${isActive ? 'border-primary' : 'border-border/50'} relative overflow-hidden`}>
      {isActive && (
        <div className="absolute top-2 left-2 rtl:left-auto rtl:right-2">
          <Badge className="bg-primary text-primary-foreground">
            <Check className="w-3 h-3 mr-1 rtl:mr-0 rtl:ml-1" />
            {t('mining.active')}
          </Badge>
        </div>
      )}
      
      {character.tier === 'legendary' && (
        <Crown className="absolute top-2 right-2 rtl:right-auto rtl:left-2 w-5 h-5 text-yellow-500" />
      )}

      <div className="text-center mb-4">
        <div className="text-5xl mb-2">{character.image_url}</div>
        <h3 className="font-bold text-lg text-foreground">{getName()}</h3>
        <Badge className={`${tierColors[character.tier]} text-white mt-1`}>
          {character.tier.toUpperCase()}
        </Badge>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1 text-muted-foreground">
            <Zap className="w-4 h-4" />
            {t('mining.speed')}
          </span>
          <span className="font-bold text-foreground">{character.mining_speed_multiplier}x</span>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1 text-muted-foreground">
            <Clock className="w-4 h-4" />
            {t('mining.boost')}
          </span>
          <span className="font-bold text-foreground">+{character.boost_percentage}% / {character.boost_duration_minutes}min</span>
        </div>
        
        {character.extra_coins > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1 text-muted-foreground">
              <Coins className="w-4 h-4" />
              {t('mining.extraCoins')}
            </span>
            <span className="font-bold text-foreground">+{character.extra_coins}</span>
          </div>
        )}
        
        {character.jackpot_chance_bonus > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1 text-muted-foreground">
              <Target className="w-4 h-4" />
              {t('mining.jackpotBonus')}
            </span>
            <span className="font-bold text-foreground">+{character.jackpot_chance_bonus}%</span>
          </div>
        )}
      </div>

      {isOwned ? (
        <Button
          className="w-full"
          variant={isActive ? "secondary" : "default"}
          onClick={() => onActivate(userCharacter!.id)}
          disabled={isActive || isLoading}
        >
          {isActive ? t('mining.active') : t('mining.activate')}
        </Button>
      ) : (
        <div className="space-y-2">
          {isFree ? (
            <Button
              className="w-full"
              onClick={() => onPurchase(character.id, 'tokens')}
              disabled={isLoading}
            >
              {t('mining.buy')} - FREE
            </Button>
          ) : (
            <>
              {character.price_tokens > 0 && (
                <Button
                  className="w-full"
                  variant="secondary"
                  onClick={() => onPurchase(character.id, 'tokens')}
                  disabled={isLoading}
                >
                  {character.price_tokens.toLocaleString()} Tokens
                </Button>
              )}
              {character.price_ton > 0 && (
                <Button
                  className="w-full"
                  onClick={() => onPurchase(character.id, 'ton')}
                  disabled={isLoading}
                >
                  {character.price_ton} TON
                </Button>
              )}
            </>
          )}
        </div>
      )}
    </Card>
  );
};

export default CharacterCard;
