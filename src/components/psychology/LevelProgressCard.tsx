import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Star, Trophy, Crown, Gem, Lock, Unlock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';

interface LevelProgressCardProps {
  userId: string;
  tokenBalance: number;
}

const RANKS = [
  { level: 1, title: 'Bronze Miner', xpRequired: 0, icon: Star, color: 'text-orange-400', benefits: ['Basic Mining'] },
  { level: 2, title: 'Silver Miner', xpRequired: 100, icon: Star, color: 'text-gray-300', benefits: ['+5% Mining Speed'] },
  { level: 3, title: 'Gold Miner', xpRequired: 300, icon: Trophy, color: 'text-yellow-400', benefits: ['+10% Mining Speed', 'Flash Sale Access'] },
  { level: 4, title: 'Platinum Miner', xpRequired: 600, icon: Trophy, color: 'text-cyan-300', benefits: ['+15% Mining Speed', 'Lucky Box Discount'] },
  { level: 5, title: 'Diamond Miner', xpRequired: 1000, icon: Crown, color: 'text-blue-400', benefits: ['+20% Mining Speed', 'VIP Support'] },
  { level: 6, title: 'Elite Miner', xpRequired: 1500, icon: Crown, color: 'text-purple-400', benefits: ['+25% Mining Speed', 'Exclusive Offers'] },
  { level: 7, title: 'Legend', xpRequired: 2500, icon: Gem, color: 'text-pink-400', benefits: ['+30% Mining Speed', 'All Features Unlocked'] },
];

export const LevelProgressCard = ({ userId, tokenBalance }: LevelProgressCardProps) => {
  const [userLevel, setUserLevel] = useState({ level: 1, xp: 0, rankTitle: 'Bronze Miner' });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUserLevel();
  }, [userId, tokenBalance]);

  const loadUserLevel = async () => {
    try {
      // Calculate XP based on token balance and activity
      const xp = Math.floor(tokenBalance * 0.1);
      
      // Find current level
      let currentLevel = 1;
      for (let i = RANKS.length - 1; i >= 0; i--) {
        if (xp >= RANKS[i].xpRequired) {
          currentLevel = RANKS[i].level;
          break;
        }
      }

      const currentRank = RANKS.find(r => r.level === currentLevel) || RANKS[0];

      // Update in database
      await supabase
        .from('bolt_user_levels' as any)
        .upsert({
          user_id: userId,
          level: currentLevel,
          xp: xp,
          rank_title: currentRank.title
        });

      setUserLevel({
        level: currentLevel,
        xp: xp,
        rankTitle: currentRank.title
      });
    } catch (error) {
      console.error('Error loading user level:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const currentRank = RANKS.find(r => r.level === userLevel.level) || RANKS[0];
  const nextRank = RANKS.find(r => r.level === userLevel.level + 1);
  
  const xpForNextLevel = nextRank ? nextRank.xpRequired - currentRank.xpRequired : 0;
  const currentProgress = nextRank ? userLevel.xp - currentRank.xpRequired : xpForNextLevel;
  const progressPercent = nextRank ? (currentProgress / xpForNextLevel) * 100 : 100;
  const xpNeeded = nextRank ? nextRank.xpRequired - userLevel.xp : 0;

  const CurrentIcon = currentRank.icon;

  if (isLoading) {
    return (
      <Card className="p-4 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border-indigo-500/30 animate-pulse">
        <div className="h-32" />
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="p-4 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border-indigo-500/30 relative overflow-hidden">
        {/* Shine effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-shine" />
        
        <div className="relative z-10">
          {/* Current rank display */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                className={`p-2 rounded-full bg-gradient-to-br from-indigo-500/30 to-purple-500/30 ${currentRank.color}`}
              >
                <CurrentIcon className="w-6 h-6" />
              </motion.div>
              <div>
                <h3 className={`font-bold text-lg ${currentRank.color}`}>{currentRank.title}</h3>
                <p className="text-sm text-muted-foreground">Level {userLevel.level}</p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-indigo-500/20 text-indigo-300">
              {userLevel.xp} XP
            </Badge>
          </div>

          {/* Progress to next level */}
          {nextRank && (
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Progress to {nextRank.title}</span>
                <span className={nextRank.color}>{xpNeeded} XP needed</span>
              </div>
              <Progress value={progressPercent} className="h-3 bg-indigo-900/30" />
              <p className="text-xs text-center mt-1 text-muted-foreground">
                Mine {Math.ceil(xpNeeded * 10)} more VIRAL to level up!
              </p>
            </div>
          )}

          {/* Benefits showcase */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground">Your Benefits:</h4>
            <div className="flex flex-wrap gap-2">
              {currentRank.benefits.map((benefit, index) => (
                <Badge key={index} variant="outline" className="text-xs border-green-500/30 text-green-400">
                  <Unlock className="w-3 h-3 mr-1" />
                  {benefit}
                </Badge>
              ))}
            </div>
          </div>

          {/* Next level preview */}
          {nextRank && (
            <div className="mt-3 p-2 bg-black/20 rounded-lg">
              <h4 className="text-xs font-semibold text-muted-foreground mb-1">Next Level Unlocks:</h4>
              <div className="flex flex-wrap gap-1">
                {nextRank.benefits.filter(b => !currentRank.benefits.includes(b)).map((benefit, index) => (
                  <Badge key={index} variant="outline" className="text-xs border-purple-500/30 text-purple-400">
                    <Lock className="w-3 h-3 mr-1" />
                    {benefit}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Level indicators */}
          <div className="flex justify-center gap-1 mt-4">
            {RANKS.map((rank, index) => {
              const RankIcon = rank.icon;
              const isUnlocked = userLevel.level >= rank.level;
              return (
                <motion.div
                  key={rank.level}
                  whileHover={{ scale: 1.2 }}
                  className={`p-1 rounded-full ${isUnlocked ? rank.color : 'text-gray-600'} ${
                    userLevel.level === rank.level ? 'ring-2 ring-white/50' : ''
                  }`}
                >
                  <RankIcon className="w-4 h-4" />
                </motion.div>
              );
            })}
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
