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
import { ArrowLeft } from 'lucide-react';
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

  const getTitle = (challenge: any) => {
    if (language === 'ar') return challenge.title_ar;
    if (language === 'ru') return challenge.title_ru;
    return challenge.title;
  };

  const getDescription = (challenge: any) => {
    if (language === 'ar') return challenge.description_ar;
    if (language === 'ru') return challenge.description_ru;
    return challenge.description;
  };

  const getTimeLeft = (endsAt: string) => {
    const end = new Date(endsAt);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h`;
    return `${hours}h`;
  };

  const ChallengeItem = ({ challenge }: { challenge: any }) => {
    const userChallenge = userChallenges.find(uc => uc.challenge_id === challenge.id);
    const isJoined = !!userChallenge;
    const isCompleted = userChallenge?.completed;
    const progress = userChallenge ? (userChallenge.current_value / challenge.target_value) * 100 : 0;

    return (
      <div className={`p-5 rounded-2xl border transition-all duration-300 ${
        isCompleted 
          ? 'bg-primary/10 border-primary/30' 
          : 'bg-card/60 border-border/30 hover:border-primary/20'
      }`}>
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                challenge.challenge_type === 'daily' 
                  ? 'bg-emerald-500/20 text-emerald-400' 
                  : challenge.challenge_type === 'weekly'
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'bg-purple-500/20 text-purple-400'
              }`}>
                {challenge.challenge_type === 'daily' 
                  ? (language === 'ar' ? 'يومي' : language === 'ru' ? 'Ежедневно' : 'Daily')
                  : challenge.challenge_type === 'weekly'
                  ? (language === 'ar' ? 'أسبوعي' : language === 'ru' ? 'Еженедельно' : 'Weekly')
                  : (language === 'ar' ? 'خاص' : language === 'ru' ? 'Особый' : 'Special')}
              </span>
              {isCompleted && (
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-primary/20 text-primary">
                  {language === 'ar' ? 'مكتمل' : language === 'ru' ? 'Завершено' : 'Completed'}
                </span>
              )}
            </div>
            <h3 className="text-lg font-bold text-foreground mb-1">{getTitle(challenge)}</h3>
            {getDescription(challenge) && (
              <p className="text-sm text-muted-foreground leading-relaxed">{getDescription(challenge)}</p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-4 text-sm mb-4">
          <div className="flex flex-col">
            <span className="text-muted-foreground text-xs mb-0.5">
              {language === 'ar' ? 'الوقت المتبقي' : language === 'ru' ? 'Осталось' : 'Time Left'}
            </span>
            <span className="font-semibold text-foreground">{getTimeLeft(challenge.ends_at)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-muted-foreground text-xs mb-0.5">
              {language === 'ar' ? 'الهدف' : language === 'ru' ? 'Цель' : 'Target'}
            </span>
            <span className="font-semibold text-foreground">{challenge.target_value}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-muted-foreground text-xs mb-0.5">
              {language === 'ar' ? 'المكافأة' : language === 'ru' ? 'Награда' : 'Reward'}
            </span>
            <span className="font-semibold text-primary">{challenge.reward_tokens.toLocaleString()} B</span>
          </div>
        </div>

        {isJoined && !isCompleted && (
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">
                {language === 'ar' ? 'التقدم' : language === 'ru' ? 'Прогресс' : 'Progress'}
              </span>
              <span className="font-medium text-foreground">
                {userChallenge.current_value} / {challenge.target_value}
              </span>
            </div>
            <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>
        )}

        {!isJoined && (
          <Button
            className="w-full h-11 rounded-xl font-semibold"
            onClick={() => joinChallenge(challenge.id)}
            disabled={loading}
          >
            {language === 'ar' ? 'انضم الآن' : language === 'ru' ? 'Присоединиться' : 'Join Challenge'}
          </Button>
        )}
      </div>
    );
  };

  const EmptyState = ({ type }: { type: 'daily' | 'weekly' }) => (
    <div className="text-center py-12 px-6">
      <div className="w-16 h-16 rounded-full bg-muted/20 mx-auto mb-4 flex items-center justify-center">
        <span className="text-2xl">🎯</span>
      </div>
      <h3 className="font-bold text-foreground mb-2">
        {type === 'daily' 
          ? (language === 'ar' ? 'لا توجد تحديات يومية' : language === 'ru' ? 'Нет ежедневных заданий' : 'No Daily Challenges')
          : (language === 'ar' ? 'لا توجد تحديات أسبوعية' : language === 'ru' ? 'Нет еженедельных заданий' : 'No Weekly Challenges')
        }
      </h3>
      <p className="text-sm text-muted-foreground">
        {language === 'ar' ? 'تحقق لاحقًا للحصول على تحديات جديدة' : 
         language === 'ru' ? 'Проверьте позже для новых заданий' : 
         'Check back later for new challenges'}
      </p>
    </div>
  );

  return (
    <>
      <Helmet>
        <title>{t('challenges.title')} | SUSPENDED</title>
        <meta name="description" content="Complete daily and weekly challenges to earn rewards" />
      </Helmet>

      <div className={`min-h-screen bg-background pb-24 ${isRTL ? 'rtl' : 'ltr'}`}>
        {/* Header */}
        <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/20 px-5 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="shrink-0 rounded-xl hover:bg-muted/50"
            >
              <ArrowLeft className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground">
                {language === 'ar' ? 'التحديات' : language === 'ru' ? 'Задания' : 'Challenges'}
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {language === 'ar' ? 'أكمل التحديات واربح المكافآت' : 
                 language === 'ru' ? 'Выполняйте задания и получайте награды' : 
                 'Complete challenges and earn rewards'}
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="px-5 py-5">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-card/60 rounded-2xl p-4 text-center border border-border/20">
              <div className="text-3xl font-bold text-foreground mb-1">{completedCount}</div>
              <div className="text-xs text-muted-foreground">
                {language === 'ar' ? 'مكتملة' : language === 'ru' ? 'Завершено' : 'Completed'}
              </div>
            </div>
            <div className="bg-card/60 rounded-2xl p-4 text-center border border-border/20">
              <div className="text-3xl font-bold text-foreground mb-1">{totalJoined}</div>
              <div className="text-xs text-muted-foreground">
                {language === 'ar' ? 'منضم' : language === 'ru' ? 'Активно' : 'Joined'}
              </div>
            </div>
            <div className="bg-card/60 rounded-2xl p-4 text-center border border-border/20">
              <div className="text-3xl font-bold text-primary mb-1">{challenges.length}</div>
              <div className="text-xs text-muted-foreground">
                {language === 'ar' ? 'متاح' : language === 'ru' ? 'Доступно' : 'Available'}
              </div>
            </div>
          </div>
        </div>

        {/* Featured Challenge */}
        {specialChallenges.length > 0 && (
          <div className="px-5 mb-5">
            <div className="bg-gradient-to-br from-purple-500/20 via-pink-500/10 to-primary/10 rounded-2xl p-5 border border-purple-500/20">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">✨</span>
                <span className="font-bold text-foreground">
                  {language === 'ar' ? 'تحدي مميز' : language === 'ru' ? 'Особый вызов' : 'Featured Challenge'}
                </span>
              </div>
              <ChallengeItem challenge={specialChallenges[0]} />
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="px-5">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-5 h-12 p-1 bg-muted/30 rounded-xl">
              <TabsTrigger 
                value="daily" 
                className="rounded-lg h-10 font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {language === 'ar' ? 'يومي' : language === 'ru' ? 'Ежедневно' : 'Daily'}
                {dailyChallenges.length > 0 && (
                  <span className="ml-2 text-xs opacity-70">({dailyChallenges.length})</span>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="weekly" 
                className="rounded-lg h-10 font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {language === 'ar' ? 'أسبوعي' : language === 'ru' ? 'Еженедельно' : 'Weekly'}
                {weeklyChallenges.length > 0 && (
                  <span className="ml-2 text-xs opacity-70">({weeklyChallenges.length})</span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="daily" className="space-y-4 mt-0">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="bg-card/60 rounded-2xl p-5 border border-border/20 animate-pulse">
                      <div className="h-6 w-20 bg-muted/30 rounded-full mb-3" />
                      <div className="h-5 w-3/4 bg-muted/30 rounded mb-2" />
                      <div className="h-4 w-1/2 bg-muted/30 rounded" />
                    </div>
                  ))}
                </div>
              ) : dailyChallenges.length > 0 ? (
                dailyChallenges.map(challenge => (
                  <ChallengeItem key={challenge.id} challenge={challenge} />
                ))
              ) : (
                <EmptyState type="daily" />
              )}
            </TabsContent>

            <TabsContent value="weekly" className="space-y-4 mt-0">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2].map(i => (
                    <div key={i} className="bg-card/60 rounded-2xl p-5 border border-border/20 animate-pulse">
                      <div className="h-6 w-20 bg-muted/30 rounded-full mb-3" />
                      <div className="h-5 w-3/4 bg-muted/30 rounded mb-2" />
                      <div className="h-4 w-1/2 bg-muted/30 rounded" />
                    </div>
                  ))}
                </div>
              ) : weeklyChallenges.length > 0 ? (
                weeklyChallenges.map(challenge => (
                  <ChallengeItem key={challenge.id} challenge={challenge} />
                ))
              ) : (
                <EmptyState type="weekly" />
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Info Banner */}
        <div className="px-5 mt-6">
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl p-5 border border-primary/10">
            <h3 className="font-bold text-foreground mb-3">
              {language === 'ar' ? 'كيف تعمل التحديات؟' : language === 'ru' ? 'Как работают задания?' : 'How Challenges Work'}
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>
                  {language === 'ar' ? 'انضم إلى التحديات واربح رموز B' : 
                   language === 'ru' ? 'Присоединяйтесь к заданиям и зарабатывайте токены B' : 
                   'Join challenges and earn B tokens'}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>
                  {language === 'ar' ? 'التحديات اليومية تنتهي كل 24 ساعة' : 
                   language === 'ru' ? 'Ежедневные задания обновляются каждые 24 часа' : 
                   'Daily challenges reset every 24 hours'}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>
                  {language === 'ar' ? 'أكمل التحديات الخاصة للحصول على مكافآت أكبر' : 
                   language === 'ru' ? 'Выполняйте особые задания для больших наград' : 
                   'Complete special challenges for bigger rewards'}
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
};

export default Challenges;