import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { MiningChallenge, UserChallenge } from '@/types/mining';
import { useLanguage } from '@/contexts/LanguageContext';
import { Target, Clock, Coins, Check } from 'lucide-react';

interface ChallengeCardProps {
  challenge: MiningChallenge;
  userChallenge?: UserChallenge;
  onJoin: (challengeId: string) => void;
  isLoading?: boolean;
}

const typeColors: Record<string, string> = {
  daily: 'bg-green-500',
  weekly: 'bg-blue-500',
  special: 'bg-purple-500',
};

export const ChallengeCard: React.FC<ChallengeCardProps> = ({
  challenge,
  userChallenge,
  onJoin,
  isLoading
}) => {
  const { language, t } = useLanguage();
  
  const getTitle = () => {
    if (language === 'ar') return challenge.title_ar;
    if (language === 'ru') return challenge.title_ru;
    return challenge.title;
  };

  const getDescription = () => {
    if (language === 'ar') return challenge.description_ar;
    if (language === 'ru') return challenge.description_ru;
    return challenge.description;
  };

  const isJoined = !!userChallenge;
  const isCompleted = userChallenge?.completed;
  const progress = userChallenge ? (userChallenge.current_value / challenge.target_value) * 100 : 0;
  
  const timeLeft = () => {
    const end = new Date(challenge.ends_at);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h`;
    return `${hours}h`;
  };

  return (
    <Card className={`p-4 bg-card/50 border ${isCompleted ? 'border-green-500/50' : 'border-border/50'}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <Badge className={`${typeColors[challenge.challenge_type]} text-white mb-2`}>
            {t(`challenges.${challenge.challenge_type}`)}
          </Badge>
          <h3 className="font-bold text-foreground">{getTitle()}</h3>
          {getDescription() && (
            <p className="text-sm text-muted-foreground mt-1">{getDescription()}</p>
          )}
        </div>
        
        {isCompleted && (
          <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
            <Check className="w-5 h-5 text-green-500" />
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
        <span className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          {timeLeft()}
        </span>
        <span className="flex items-center gap-1">
          <Target className="w-4 h-4" />
          {challenge.target_value}
        </span>
        <span className="flex items-center gap-1">
          <Coins className="w-4 h-4" />
          {challenge.reward_tokens.toLocaleString()}
        </span>
      </div>

      {isJoined && (
        <div className="mb-3">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">{t('challenges.progress')}</span>
            <span className="text-foreground font-medium">
              {userChallenge.current_value} / {challenge.target_value}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {!isJoined && (
        <Button
          className="w-full"
          onClick={() => onJoin(challenge.id)}
          disabled={isLoading}
        >
          {t('challenges.join')}
        </Button>
      )}

      {isCompleted && (
        <Badge className="w-full justify-center bg-green-500/20 text-green-500 border-green-500/30">
          {t('challenges.completed')}
        </Badge>
      )}
    </Card>
  );
};

export default ChallengeCard;
