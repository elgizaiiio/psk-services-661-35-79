import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTelegramAuth } from "@/hooks/useTelegramAuth";
import { useAchievements } from "@/hooks/useAchievements";
import { useTelegramBackButton } from "@/hooks/useTelegramBackButton";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Lock, Unlock, Star, Sparkles, Loader2, Gift, Target, Users, Pickaxe } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const categoryIcons: Record<string, React.ReactNode> = {
  mining: <Pickaxe className="w-4 h-4" />,
  characters: <Users className="w-4 h-4" />,
  challenges: <Target className="w-4 h-4" />,
  social: <Star className="w-4 h-4" />,
};

const categoryColors: Record<string, string> = {
  mining: 'from-orange-500/20 to-amber-500/20 border-orange-500/30',
  characters: 'from-purple-500/20 to-pink-500/20 border-purple-500/30',
  challenges: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30',
  social: 'from-green-500/20 to-emerald-500/20 border-green-500/30',
};

const categoryLabels: Record<string, { en: string; ar: string }> = {
  mining: { en: 'Mining', ar: 'التعدين' },
  characters: { en: 'Characters', ar: 'الشخصيات' },
  challenges: { en: 'Challenges', ar: 'التحديات' },
  social: { en: 'Social', ar: 'اجتماعي' },
};

const Achievements = () => {
  const { user } = useTelegramAuth();
  const { language, isRTL } = useLanguage();
  const [boltUserId, setBoltUserId] = useState<string | undefined>();
  const [activeTab, setActiveTab] = useState("all");
  const [totalTokensEarned, setTotalTokensEarned] = useState(0);
  useTelegramBackButton();

  useEffect(() => {
    const fetchBoltUser = async () => {
      if (!user?.id) return;
      
      const { data } = await supabase
        .from('bolt_users')
        .select('id')
        .eq('telegram_id', user.id)
        .maybeSingle();
      
      if (data) {
        setBoltUserId(data.id);
      }
    };
    fetchBoltUser();
  }, [user?.id]);

  const { achievements, userAchievements, loading } = useAchievements(boltUserId);

  // Calculate total tokens earned from achievements
  useEffect(() => {
    const earned = userAchievements
      .filter(ua => ua.unlocked)
      .reduce((sum, ua) => {
        const achievement = achievements.find(a => a.id === ua.achievement_id);
        return sum + (achievement?.reward_tokens || 0);
      }, 0);
    setTotalTokensEarned(earned);
  }, [userAchievements, achievements]);

  const getUserAchievement = (achievementId: string) => {
    return userAchievements.find(ua => ua.achievement_id === achievementId);
  };

  const getProgress = (achievementId: string, targetValue: number) => {
    const userAchievement = getUserAchievement(achievementId);
    if (!userAchievement) return 0;
    return Math.min((userAchievement.current_value / targetValue) * 100, 100);
  };

  const getName = (achievement: any) => {
    if (language === 'ru') return achievement.name_ru;
    return achievement.name;
  };

  const getDescription = (achievement: any) => {
    if (language === 'ru') return achievement.description_ru;
    return achievement.description;
  };

  const filteredAchievements = achievements.filter(achievement => {
    if (activeTab === "all") return true;
    if (activeTab === "unlocked") return getUserAchievement(achievement.id)?.unlocked;
    if (activeTab === "locked") return !getUserAchievement(achievement.id)?.unlocked;
    return achievement.category === activeTab;
  });

  const unlockedCount = userAchievements.filter(ua => ua.unlocked).length;
  const totalPossibleTokens = achievements.reduce((sum, a) => sum + a.reward_tokens, 0);

  return (
    <div className="min-h-screen bg-background pb-24" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-2xl border-b border-border/20">
        <div className="px-4 py-4">
          <div className="flex items-center justify-center mb-4">
            <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-500" />
              Achievements
            </h1>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-2">
            <Card className="p-3 bg-gradient-to-br from-yellow-500/10 to-orange-500/5 border-yellow-500/20 text-center">
              <p className="text-xs text-muted-foreground">Completed</p>
              <p className="text-lg font-bold text-yellow-400">{unlockedCount}/{achievements.length}</p>
            </Card>
            <Card className="p-3 bg-gradient-to-br from-green-500/10 to-emerald-500/5 border-green-500/20 text-center">
              <p className="text-xs text-muted-foreground">Earned</p>
              <p className="text-lg font-bold text-green-400">{totalTokensEarned.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">BOLT</p>
            </Card>
            <Card className="p-3 bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border-blue-500/20 text-center">
              <p className="text-xs text-muted-foreground">Remaining</p>
              <p className="text-lg font-bold text-blue-400">{(totalPossibleTokens - totalTokensEarned).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">BOLT</p>
            </Card>
          </div>
        </div>
      </header>

      {/* Progress Overview */}
      <div className="px-4 py-3">
        <Card className="p-4 bg-gradient-to-r from-yellow-500/10 via-orange-500/10 to-red-500/10 border-yellow-500/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Total Progress</span>
            <span className="text-sm font-bold text-yellow-400">
              {Math.round((unlockedCount / achievements.length) * 100)}%
            </span>
          </div>
          <Progress 
            value={(unlockedCount / achievements.length) * 100} 
            className="h-3 bg-yellow-900/30"
          />
          <p className="text-xs text-muted-foreground mt-2 text-center">
            {achievements.length - unlockedCount} achievements left to unlock
          </p>
        </Card>
      </div>

      {/* Tabs Filter */}
      <div className="px-4 py-2">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-4 h-auto p-1 bg-muted/30">
            <TabsTrigger value="all" className="text-xs py-2">
              All ({achievements.length})
            </TabsTrigger>
            <TabsTrigger value="unlocked" className="text-xs py-2 text-green-400">
              Done ({unlockedCount})
            </TabsTrigger>
            <TabsTrigger value="locked" className="text-xs py-2 text-gray-400">
              In Progress ({achievements.length - unlockedCount})
            </TabsTrigger>
            <TabsTrigger value="mining" className="text-xs py-2 text-orange-400">
              Mining
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Category Quick Filters */}
      <div className="px-4 py-2">
        <div className="flex flex-wrap gap-2 justify-center">
          {Object.entries(categoryLabels).map(([category, labels]) => {
            const count = achievements.filter(a => a.category === category).length;
            const completed = achievements.filter(a => 
              a.category === category && getUserAchievement(a.id)?.unlocked
            ).length;
            
            return (
              <button
                key={category}
                onClick={() => setActiveTab(category)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs transition-all border ${
                  activeTab === category 
                    ? 'ring-2 ring-white/50 bg-white/10' 
                    : 'opacity-70 hover:opacity-100 bg-black/20'
                } ${categoryColors[category]}`}
              >
                {categoryIcons[category]}
                <span>{labels.en}</span>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  {completed}/{count}
                </Badge>
              </button>
            );
          })}
        </div>
      </div>

      {/* Achievements Grid */}
      <div className="px-4 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredAchievements.length === 0 ? (
          <Card className="p-8 text-center">
            <Trophy className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No achievements in this category</p>
          </Card>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filteredAchievements.map((achievement, index) => {
                const userAchievement = getUserAchievement(achievement.id);
                const isUnlocked = userAchievement?.unlocked;
                const progress = getProgress(achievement.id, achievement.target_value);
                const currentValue = userAchievement?.current_value || 0;

                return (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className={`p-4 relative overflow-hidden border-2 ${
                      isUnlocked 
                        ? 'bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/30' 
                        : `bg-gradient-to-br ${categoryColors[achievement.category]}`
                    }`}>
                      {/* Unlocked Shine Effect */}
                      {isUnlocked && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-500/10 to-transparent -translate-x-full animate-shine" />
                      )}

                      <div className="relative z-10">
                        <div className="flex items-start gap-4">
                          {/* Icon */}
                          <div className={`text-4xl ${isUnlocked ? '' : 'grayscale opacity-50'}`}>
                            {achievement.icon}
                          </div>

                          {/* Content */}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className={`font-bold ${isUnlocked ? 'text-yellow-400' : 'text-foreground'}`}>
                                {getName(achievement)}
                              </h3>
                              {isUnlocked ? (
                                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                                  <Unlock className="w-3 h-3 mr-1" />
                                  Done
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-gray-400 border-gray-500/30">
                                  <Lock className="w-3 h-3 mr-1" />
                                  In Progress
                                </Badge>
                              )}
                            </div>

                            <p className="text-sm text-muted-foreground mb-3">
                              {getDescription(achievement)}
                            </p>

                            {/* Progress Bar */}
                            {!isUnlocked && (
                              <div className="mb-2">
                                <div className="flex justify-between text-xs mb-1">
                                  <span className="text-muted-foreground">Progress</span>
                                  <span className="text-foreground font-medium">
                                    {currentValue}/{achievement.target_value}
                                  </span>
                                </div>
                                <Progress value={progress} className="h-2" />
                              </div>
                            )}

                            {/* Reward */}
                            <div className={`flex items-center gap-2 ${
                              isUnlocked ? 'text-green-400' : 'text-muted-foreground'
                            }`}>
                              <Gift className="w-4 h-4" />
                              <span className="text-sm font-medium">
                                {isUnlocked ? 'Earned:' : 'Reward:'} {achievement.reward_tokens.toLocaleString()} BOLT
                              </span>
                            </div>

                            {/* Unlocked Date */}
                            {isUnlocked && userAchievement?.unlocked_at && (
                              <p className="text-xs text-muted-foreground mt-2">
                                Unlocked: {new Date(userAchievement.unlocked_at).toLocaleDateString('en-US')}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="px-4 py-4">
        <Card className="p-4 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/20">
          <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            How to Earn Achievements?
          </h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-orange-400">⛏️</span>
              Complete mining sessions to unlock mining achievements
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400">🎭</span>
              Purchase new characters to unlock character achievements
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400">🎯</span>
              Complete daily and weekly challenges
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400">🦋</span>
              Invite friends to unlock social achievements
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
};

export default Achievements;
