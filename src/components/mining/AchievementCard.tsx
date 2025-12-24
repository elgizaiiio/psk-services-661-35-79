import React from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Achievement, UserAchievement } from '@/types/mining';
import { useLanguage } from '@/contexts/LanguageContext';
import { Lock, Unlock, Coins } from 'lucide-react';

interface AchievementCardProps {
  achievement: Achievement;
  userAchievement?: UserAchievement;
}

const categoryColors: Record<string, string> = {
  mining: 'from-orange-500/20 to-orange-600/20',
  characters: 'from-purple-500/20 to-purple-600/20',
  challenges: 'from-blue-500/20 to-blue-600/20',
  social: 'from-green-500/20 to-green-600/20',
};

export const AchievementCard: React.FC<AchievementCardProps> = ({
  achievement,
  userAchievement
}) => {
  const { language, t } = useLanguage();
  
  const getName = () => {
    if (language === 'ar') return achievement.name_ar;
    if (language === 'ru') return achievement.name_ru;
    return achievement.name;
  };

  const getDescription = () => {
    if (language === 'ar') return achievement.description_ar;
    if (language === 'ru') return achievement.description_ru;
    return achievement.description;
  };

  const isUnlocked = userAchievement?.unlocked;
  const progress = userAchievement 
    ? (userAchievement.current_value / achievement.target_value) * 100 
    : 0;

  return (
    <Card className={`p-4 bg-gradient-to-br ${categoryColors[achievement.category]} border ${isUnlocked ? 'border-primary/50' : 'border-border/30'} ${!isUnlocked && 'opacity-75'}`}>
      <div className="flex items-start gap-3">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${isUnlocked ? 'bg-primary/20' : 'bg-muted/20'}`}>
          {achievement.icon || '🏆'}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-foreground">{getName()}</h3>
            {isUnlocked ? (
              <Unlock className="w-4 h-4 text-primary" />
            ) : (
              <Lock className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
          
          {getDescription() && (
            <p className="text-sm text-muted-foreground mt-1">{getDescription()}</p>
          )}

          <div className="flex items-center gap-2 mt-2">
            <Coins className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-medium text-foreground">
              +{achievement.reward_tokens.toLocaleString()}
            </span>
          </div>

          {!isUnlocked && (
            <div className="mt-2">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">{t('achievements.progress')}</span>
                <span className="text-foreground">
                  {userAchievement?.current_value || 0} / {achievement.target_value}
                </span>
              </div>
              <Progress value={progress} className="h-1.5" />
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default AchievementCard;
