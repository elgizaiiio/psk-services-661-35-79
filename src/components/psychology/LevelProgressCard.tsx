import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, Trophy, Crown, Gem, Lock, Unlock, Gift, Sparkles, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface LevelProgressCardProps {
  userId: string;
  tokenBalance: number;
  onLevelReward?: (spins: number, tokens: number) => void;
}

interface LevelReward {
  spins: number;
  tokens: number;
}

const RANKS = [
  { level: 1, title: 'Bronze Miner', titleAr: 'عامل برونزي', xpRequired: 0, icon: Star, color: 'text-orange-400', bgColor: 'from-orange-500/20 to-orange-600/20', benefits: ['Basic Mining'], reward: { spins: 0, tokens: 0 } },
  { level: 2, title: 'Silver Miner', titleAr: 'عامل فضي', xpRequired: 100, icon: Star, color: 'text-gray-300', bgColor: 'from-gray-400/20 to-gray-500/20', benefits: ['+5% Mining Speed'], reward: { spins: 3, tokens: 50 } },
  { level: 3, title: 'Gold Miner', titleAr: 'عامل ذهبي', xpRequired: 300, icon: Trophy, color: 'text-yellow-400', bgColor: 'from-yellow-500/20 to-yellow-600/20', benefits: ['+10% Mining Speed', 'Flash Sale Access'], reward: { spins: 5, tokens: 100 } },
  { level: 4, title: 'Platinum Miner', titleAr: 'عامل بلاتيني', xpRequired: 600, icon: Trophy, color: 'text-cyan-300', bgColor: 'from-cyan-400/20 to-cyan-500/20', benefits: ['+15% Mining Speed', 'Lucky Box Discount'], reward: { spins: 7, tokens: 200 } },
  { level: 5, title: 'Diamond Miner', titleAr: 'عامل ماسي', xpRequired: 1000, icon: Crown, color: 'text-blue-400', bgColor: 'from-blue-500/20 to-blue-600/20', benefits: ['+20% Mining Speed', 'VIP Support'], reward: { spins: 10, tokens: 350 } },
  { level: 6, title: 'Elite Miner', titleAr: 'عامل نخبة', xpRequired: 1500, icon: Crown, color: 'text-purple-400', bgColor: 'from-purple-500/20 to-purple-600/20', benefits: ['+25% Mining Speed', 'Exclusive Offers'], reward: { spins: 15, tokens: 500 } },
  { level: 7, title: 'Legend', titleAr: 'أسطورة', xpRequired: 2500, icon: Gem, color: 'text-pink-400', bgColor: 'from-pink-500/20 to-pink-600/20', benefits: ['+30% Mining Speed', 'All Features Unlocked'], reward: { spins: 25, tokens: 1000 } },
];

export const LevelProgressCard = ({ userId, tokenBalance, onLevelReward }: LevelProgressCardProps) => {
  const [userLevel, setUserLevel] = useState({ level: 1, xp: 0, rankTitle: 'Bronze Miner' });
  const [lastClaimedLevel, setLastClaimedLevel] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [showAllLevels, setShowAllLevels] = useState(false);
  const [pendingReward, setPendingReward] = useState<{ level: number; reward: LevelReward } | null>(null);

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

      // Get existing user level data
      const { data: existingLevel } = await supabase
        .from('bolt_user_levels')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      const previousLevel = existingLevel?.level || 1;
      const claimedLevel = (existingLevel?.unlocked_features as any)?.last_claimed_level || 0;
      setLastClaimedLevel(claimedLevel);

      // Update in database
      await supabase
        .from('bolt_user_levels')
        .upsert({
          user_id: userId,
          level: currentLevel,
          xp: xp,
          rank_title: currentRank.title,
          unlocked_features: existingLevel?.unlocked_features || { last_claimed_level: 0 }
        });

      setUserLevel({
        level: currentLevel,
        xp: xp,
        rankTitle: currentRank.title
      });

      // Check if user leveled up and has unclaimed rewards
      if (currentLevel > claimedLevel && currentLevel > 1) {
        const newRank = RANKS.find(r => r.level === currentLevel);
        if (newRank && newRank.reward.spins > 0) {
          setPendingReward({ level: currentLevel, reward: newRank.reward });
          setShowLevelUpModal(true);
        }
      }
    } catch (error) {
      console.error('Error loading user level:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const claimLevelReward = async () => {
    if (!pendingReward) return;

    try {
      // Update last claimed level
      await supabase
        .from('bolt_user_levels')
        .update({
          unlocked_features: { last_claimed_level: pendingReward.level }
        })
        .eq('user_id', userId);

      // Add free spins
      const { data: existingSpins } = await supabase
        .from('user_free_spins')
        .select('total_spins')
        .eq('user_id', userId)
        .single();

      if (existingSpins) {
        await supabase
          .from('user_free_spins')
          .update({
            total_spins: existingSpins.total_spins + pendingReward.reward.spins
          })
          .eq('user_id', userId);
      } else {
        await supabase
          .from('user_free_spins')
          .insert({
            user_id: userId,
            total_spins: pendingReward.reward.spins
          });
      }

      // Add tokens to user balance
      if (pendingReward.reward.tokens > 0) {
        const { data: userData } = await supabase
          .from('bolt_users')
          .select('token_balance')
          .eq('id', userId)
          .single();

        if (userData) {
          await supabase
            .from('bolt_users')
            .update({
              token_balance: userData.token_balance + pendingReward.reward.tokens
            })
            .eq('id', userId);
        }
      }

      setLastClaimedLevel(pendingReward.level);
      setShowLevelUpModal(false);
      
      toast.success(`🎉 Got ${pendingReward.reward.spins} free spins + ${pendingReward.reward.tokens} BOLT!`);
      
      if (onLevelReward) {
        onLevelReward(pendingReward.reward.spins, pendingReward.reward.tokens);
      }
      
      setPendingReward(null);
    } catch (error) {
      console.error('Error claiming level reward:', error);
      toast.error('حدث خطأ أثناء المطالبة بالمكافأة');
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
    <>
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
                  Mine {Math.ceil(xpNeeded * 10)} more BOLT to level up!
                </p>
              </div>
            )}

            {/* Next level rewards preview */}
            {nextRank && (
              <div className="mb-3 p-2 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-lg border border-yellow-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <Gift className="w-4 h-4 text-yellow-400" />
                  <span className="text-xs font-semibold text-yellow-400">Next Level Rewards:</span>
                </div>
                <div className="flex gap-3 text-xs">
                  <span className="text-green-400">🎰 {nextRank.reward.spins} spins</span>
                  <span className="text-blue-400">💎 {nextRank.reward.tokens} BOLT</span>
                </div>
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

            {/* View All Levels Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAllLevels(!showAllLevels)}
              className="w-full mt-3 text-muted-foreground hover:text-white"
            >
              {showAllLevels ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-1" />
                  إخفاء قائمة المستويات
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-1" />
                  عرض جميع المستويات والمكافآت
                </>
              )}
            </Button>

            {/* All Levels List */}
            <AnimatePresence>
              {showAllLevels && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="mt-4 space-y-2">
                    {RANKS.map((rank) => {
                      const RankIcon = rank.icon;
                      const isUnlocked = userLevel.level >= rank.level;
                      const isCurrent = userLevel.level === rank.level;
                      
                      return (
                        <motion.div
                          key={rank.level}
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: rank.level * 0.05 }}
                          className={`p-3 rounded-lg border ${
                            isCurrent 
                              ? 'border-yellow-500/50 bg-gradient-to-r ' + rank.bgColor 
                              : isUnlocked 
                                ? 'border-green-500/30 bg-green-500/5' 
                                : 'border-gray-700/30 bg-gray-800/20'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-full bg-gradient-to-br ${rank.bgColor} ${rank.color}`}>
                                <RankIcon className="w-5 h-5" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className={`font-bold ${rank.color}`}>{rank.titleAr}</span>
                                  <Badge variant="outline" className="text-xs">
                                    Lv.{rank.level}
                                  </Badge>
                                  {isCurrent && (
                                    <Badge className="text-xs bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                                      الحالي
                                    </Badge>
                                  )}
                                  {isUnlocked && !isCurrent && (
                                    <Check className="w-4 h-4 text-green-400" />
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {rank.xpRequired} XP مطلوب
                                </p>
                              </div>
                            </div>
                            
                            {/* Rewards */}
                            {rank.level > 1 && (
                              <div className="text-right">
                                <p className="text-xs text-muted-foreground mb-1">المكافآت:</p>
                                <div className="flex gap-2 text-xs">
                                  <span className={isUnlocked ? 'text-green-400' : 'text-gray-500'}>
                                    🎰 {rank.reward.spins}
                                  </span>
                                  <span className={isUnlocked ? 'text-blue-400' : 'text-gray-500'}>
                                    💎 {rank.reward.tokens}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {/* Benefits */}
                          <div className="mt-2 flex flex-wrap gap-1">
                            {rank.benefits.map((benefit, idx) => (
                              <Badge 
                                key={idx} 
                                variant="outline" 
                                className={`text-xs ${
                                  isUnlocked 
                                    ? 'border-green-500/30 text-green-400' 
                                    : 'border-gray-600/30 text-gray-500'
                                }`}
                              >
                                {isUnlocked ? <Unlock className="w-3 h-3 mr-1" /> : <Lock className="w-3 h-3 mr-1" />}
                                {benefit}
                              </Badge>
                            ))}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                  
                  {/* Total Rewards Summary */}
                  <div className="mt-4 p-3 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-lg border border-yellow-500/20">
                    <h4 className="text-sm font-bold text-yellow-400 mb-2 text-center">إجمالي المكافآت المتاحة</h4>
                    <div className="flex justify-center gap-6">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-400">
                          {RANKS.reduce((sum, r) => sum + r.reward.spins, 0)}
                        </p>
                        <p className="text-xs text-muted-foreground">🎰 سبينات</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-400">
                          {RANKS.reduce((sum, r) => sum + r.reward.tokens, 0).toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">💎 BOLT</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Card>
      </motion.div>

      {/* Level Up Reward Modal */}
      <Dialog open={showLevelUpModal} onOpenChange={setShowLevelUpModal}>
        <DialogContent className="bg-gradient-to-br from-indigo-900 to-purple-900 border-yellow-500/50 text-center">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-yellow-400 flex items-center justify-center gap-2">
              <Sparkles className="w-6 h-6" />
              مبروك! وصلت لمستوى جديد!
              <Sparkles className="w-6 h-6" />
            </DialogTitle>
          </DialogHeader>
          
          {pendingReward && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="space-y-4 py-4"
            >
              <div className="text-6xl">🎉</div>
              <p className="text-xl text-white">
                أنت الآن <span className={currentRank.color}>{currentRank.titleAr}</span>!
              </p>
              
              <div className="bg-black/30 p-4 rounded-xl space-y-3">
                <p className="text-sm text-muted-foreground">مكافآتك:</p>
                <div className="flex justify-center gap-6">
                  <div className="text-center">
                    <div className="text-3xl mb-1">🎰</div>
                    <p className="text-lg font-bold text-green-400">+{pendingReward.reward.spins}</p>
                    <p className="text-xs text-muted-foreground">سبينات مجانية</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl mb-1">💎</div>
                    <p className="text-lg font-bold text-blue-400">+{pendingReward.reward.tokens}</p>
                    <p className="text-xs text-muted-foreground">BOLT</p>
                  </div>
                </div>
              </div>
              
              <Button
                onClick={claimLevelReward}
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-bold text-lg py-6"
              >
                <Gift className="w-5 h-5 mr-2" />
                احصل على المكافآت!
              </Button>
            </motion.div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
