import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useChallenges } from '@/hooks/useChallenges';
import { ChallengeCard } from '@/components/mining/ChallengeCard';
import { 
  Target, 
  Calendar, 
  Clock, 
  Star, 
  Trophy,
  Zap,
  Coins,
  ArrowLeft,
  Flame
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Challenges = () => {
  const { language, t, isRTL } = useLanguage();
  const { user } = useTelegramAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('daily');
  
  const { 
    challenges, 
    userChallenges, 
    loading, 
    joinChallenge 
  } = useChallenges(user?.id?.toString());

  const dailyChallenges = challenges.filter(c => c.challenge_type === 'daily');
  const weeklyChallenges = challenges.filter(c => c.challenge_type === 'weekly');
  const specialChallenges = challenges.filter(c => c.challenge_type === 'special');

  const completedCount = userChallenges.filter(uc => uc.completed).length;
  const totalJoined = userChallenges.length;

  const stats = [
    { icon: <Trophy className="w-5 h-5 text-yellow-500" />, label: language === 'ar' ? 'مكتملة' : language === 'ru' ? 'Завершено' : 'Completed', value: completedCount },
    { icon: <Target className="w-5 h-5 text-blue-500" />, label: language === 'ar' ? 'منضم' : language === 'ru' ? 'Присоединился' : 'Joined', value: totalJoined },
    { icon: <Flame className="w-5 h-5 text-orange-500" />, label: language === 'ar' ? 'سلسلة' : language === 'ru' ? 'Серия' : 'Streak', value: 0 },
  ];

  return (
    <>
      <Helmet>
        <title>{t('challenges.title')} | SUSPENDED</title>
        <meta name="description" content="Complete daily and weekly challenges to earn rewards" />
      </Helmet>

      <div className={`min-h-screen bg-background pb-24 ${isRTL ? 'rtl' : 'ltr'}`}>
        {/* Header */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border/50 px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="shrink-0"
            >
              <ArrowLeft className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Target className="w-6 h-6 text-primary" />
                {t('challenges.title')}
              </h1>
              <p className="text-sm text-muted-foreground">
                {language === 'ar' ? 'أكمل التحديات واربح المكافآت' : 
                 language === 'ru' ? 'Выполняйте задания и получайте награды' : 
                 'Complete challenges and earn rewards'}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="px-4 py-4">
          <div className="grid grid-cols-3 gap-3">
            {stats.map((stat, index) => (
              <Card key={index} className="p-3 bg-card/50 border-border/50 text-center">
                <div className="flex justify-center mb-2">{stat.icon}</div>
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </Card>
            ))}
          </div>
        </div>

        {/* Featured Challenge */}
        {specialChallenges.length > 0 && (
          <div className="px-4 mb-4">
            <Card className="p-4 bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/30">
              <div className="flex items-center gap-2 mb-3">
                <Star className="w-5 h-5 text-yellow-500" />
                <span className="font-bold text-foreground">
                  {language === 'ar' ? 'تحدي مميز' : 
                   language === 'ru' ? 'Особый вызов' : 
                   'Featured Challenge'}
                </span>
                <Badge className="bg-purple-500 text-white ml-auto">
                  {t('challenges.special')}
                </Badge>
              </div>
              {specialChallenges[0] && (
                <ChallengeCard
                  challenge={specialChallenges[0]}
                  userChallenge={userChallenges.find(uc => uc.challenge_id === specialChallenges[0].id)}
                  onJoin={joinChallenge}
                  isLoading={loading}
                />
              )}
            </Card>
          </div>
        )}

        {/* Tabs */}
        <div className="px-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="daily" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {t('challenges.daily')}
                {dailyChallenges.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {dailyChallenges.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="weekly" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {t('challenges.weekly')}
                {weeklyChallenges.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {weeklyChallenges.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="daily" className="space-y-3">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <Card key={i} className="p-4 bg-card/50 animate-pulse">
                      <div className="h-20 bg-muted/20 rounded" />
                    </Card>
                  ))}
                </div>
              ) : dailyChallenges.length > 0 ? (
                dailyChallenges.map(challenge => (
                  <ChallengeCard
                    key={challenge.id}
                    challenge={challenge}
                    userChallenge={userChallenges.find(uc => uc.challenge_id === challenge.id)}
                    onJoin={joinChallenge}
                    isLoading={loading}
                  />
                ))
              ) : (
                <Card className="p-8 bg-card/50 text-center">
                  <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-bold text-foreground mb-2">
                    {language === 'ar' ? 'لا توجد تحديات يومية' : 
                     language === 'ru' ? 'Нет ежедневных заданий' : 
                     'No Daily Challenges'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {language === 'ar' ? 'تحقق لاحقًا للحصول على تحديات جديدة' : 
                     language === 'ru' ? 'Проверьте позже для новых заданий' : 
                     'Check back later for new challenges'}
                  </p>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="weekly" className="space-y-3">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2].map(i => (
                    <Card key={i} className="p-4 bg-card/50 animate-pulse">
                      <div className="h-20 bg-muted/20 rounded" />
                    </Card>
                  ))}
                </div>
              ) : weeklyChallenges.length > 0 ? (
                weeklyChallenges.map(challenge => (
                  <ChallengeCard
                    key={challenge.id}
                    challenge={challenge}
                    userChallenge={userChallenges.find(uc => uc.challenge_id === challenge.id)}
                    onJoin={joinChallenge}
                    isLoading={loading}
                  />
                ))
              ) : (
                <Card className="p-8 bg-card/50 text-center">
                  <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-bold text-foreground mb-2">
                    {language === 'ar' ? 'لا توجد تحديات أسبوعية' : 
                     language === 'ru' ? 'Нет еженедельных заданий' : 
                     'No Weekly Challenges'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {language === 'ar' ? 'تحقق لاحقًا للحصول على تحديات جديدة' : 
                     language === 'ru' ? 'Проверьте позже для новых заданий' : 
                     'Check back later for new challenges'}
                  </p>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Rewards Info */}
        <div className="px-4 mt-6">
          <Card className="p-4 bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
            <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
              <Coins className="w-5 h-5 text-yellow-500" />
              {language === 'ar' ? 'المكافآت' : 
               language === 'ru' ? 'Награды' : 
               'Rewards'}
            </h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                <span>
                  {language === 'ar' ? 'اربح رموز مقابل كل تحدي مكتمل' : 
                   language === 'ru' ? 'Получайте токены за каждое выполненное задание' : 
                   'Earn tokens for every completed challenge'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-500" />
                <span>
                  {language === 'ar' ? 'مكافآت إضافية للتحديات الخاصة' : 
                   language === 'ru' ? 'Бонусные награды за особые задания' : 
                   'Bonus rewards for special challenges'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-500" />
                <span>
                  {language === 'ar' ? 'حافظ على سلسلتك للحصول على مضاعفات' : 
                   language === 'ru' ? 'Поддерживайте серию для множителей' : 
                   'Maintain your streak for multipliers'}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
};

export default Challenges;
