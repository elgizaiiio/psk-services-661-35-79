import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useChallenges } from '@/hooks/useChallenges';
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
    if (language === 'ru') return challenge.title_ru;
    return challenge.title;
  };

  const getDescription = (challenge: any) => {
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

  const ChallengeItem = ({ challenge, index }: { challenge: any; index: number }) => {
    const userChallenge = userChallenges.find(uc => uc.challenge_id === challenge.id);
    const isJoined = !!userChallenge;
    const isCompleted = userChallenge?.completed;
    const progress = userChallenge ? (userChallenge.current_value / challenge.target_value) * 100 : 0;

    return (
      <div 
        className={`relative overflow-hidden rounded-3xl border transition-all duration-500 animate-fade-in ${
          isCompleted 
            ? 'bg-gradient-to-br from-primary/15 to-primary/5 border-primary/40' 
            : 'bg-gradient-to-br from-card to-card/50 border-border/30 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5'
        }`}
        style={{ animationDelay: `${index * 100}ms` }}
      >
        {/* Decorative gradient orb */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative p-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-5">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className={`text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full ${
                  challenge.challenge_type === 'daily' 
                    ? 'bg-primary/15 text-primary border border-primary/20' 
                    : challenge.challenge_type === 'weekly'
                    ? 'bg-primary/10 text-primary/80 border border-primary/15'
                    : 'bg-primary/20 text-primary border border-primary/25'
                }`}>
                  {challenge.challenge_type === 'daily' 
                    ? (language === 'ru' ? 'Ежедневно' : 'Daily')
                    : challenge.challenge_type === 'weekly'
                    ? (language === 'ru' ? 'Еженедельно' : 'Weekly')
                    : (language === 'ru' ? 'Особый' : 'Special')}
                </span>
                {isCompleted && (
                  <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full bg-primary/15 text-primary border border-primary/20">
                    {language === 'ru' ? 'Завершено' : 'Done'}
                  </span>
                )}
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2 leading-tight">{getTitle(challenge)}</h3>
              {getDescription(challenge) && (
                <p className="text-sm text-muted-foreground/80 leading-relaxed">{getDescription(challenge)}</p>
              )}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="bg-background/50 rounded-2xl p-3 text-center border border-border/10">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-1">
                {language === 'ru' ? 'Время' : 'Time'}
              </div>
              <div className="text-sm font-bold text-foreground">{getTimeLeft(challenge.ends_at)}</div>
            </div>
            <div className="bg-background/50 rounded-2xl p-3 text-center border border-border/10">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-1">
                {language === 'ru' ? 'Цель' : 'Goal'}
              </div>
              <div className="text-sm font-bold text-foreground">{challenge.target_value}</div>
            </div>
            <div className="bg-background/50 rounded-2xl p-3 text-center border border-border/10">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-1">
                {language === 'ru' ? 'Приз' : 'Prize'}
              </div>
              <div className="text-sm font-bold text-primary">{challenge.reward_tokens.toLocaleString()}</div>
            </div>
          </div>

          {/* Progress Bar */}
          {isJoined && !isCompleted && (
            <div className="mb-5">
              <div className="flex justify-between text-xs mb-2">
              <span className="text-muted-foreground font-medium">
                  {language === 'ru' ? 'Прогресс' : 'Progress'}
                </span>
                <span className="font-bold text-foreground">
                  {userChallenge.current_value} / {challenge.target_value}
                </span>
              </div>
              <div className="h-3 bg-muted/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary via-primary to-primary/60 rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Action Button */}
          {!isJoined && (
            <Button
              className="w-full h-12 rounded-2xl font-bold text-sm tracking-wide transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              onClick={() => joinChallenge(challenge.id)}
              disabled={loading}
            >
              {language === 'ru' ? 'Присоединиться' : 'Join Now'}
            </Button>
          )}
        </div>
      </div>
    );
  };

  const EmptyState = ({ type }: { type: 'daily' | 'weekly' }) => (
    <div className="text-center py-16 px-8 animate-fade-in">
      <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-muted/30 to-muted/10 mx-auto mb-5 flex items-center justify-center border border-border/20">
        <span className="text-3xl font-bold text-muted-foreground/40">?</span>
      </div>
      <h3 className="text-lg font-bold text-foreground mb-2">
        {type === 'daily' 
          ? (language === 'ru' ? 'Нет ежедневных заданий' : 'No Daily Challenges')
          : (language === 'ru' ? 'Нет еженедельных заданий' : 'No Weekly Challenges')
        }
      </h3>
      <p className="text-sm text-muted-foreground/70">
        {language === 'ru' ? 'Проверьте позже для новых заданий' : 
         'Check back later for new challenges'}
      </p>
    </div>
  );

  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-card/50 rounded-3xl p-6 border border-border/20 animate-pulse">
          <div className="flex gap-2 mb-4">
            <div className="h-6 w-16 bg-muted/20 rounded-full" />
            <div className="h-6 w-12 bg-muted/20 rounded-full" />
          </div>
          <div className="h-6 w-3/4 bg-muted/20 rounded-lg mb-2" />
          <div className="h-4 w-1/2 bg-muted/20 rounded-lg mb-5" />
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map(j => (
              <div key={j} className="h-16 bg-muted/10 rounded-2xl" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <>
      <Helmet>
        <title>{t('challenges.title')} | SUSPENDED</title>
        <meta name="description" content="Complete daily and weekly challenges to earn rewards" />
      </Helmet>

      <div className={`min-h-screen bg-background pb-28 ${isRTL ? 'rtl' : 'ltr'}`}>
        {/* Header */}
        <div className="sticky top-0 z-40 bg-background/90 backdrop-blur-2xl border-b border-border/10">
          <div className="px-6 py-5">
            <div className="flex items-center justify-between mb-1">
              <h1 className="text-3xl font-black text-foreground tracking-tight">
                {language === 'ru' ? 'Задания' : 'Challenges'}
              </h1>
              <button 
                onClick={() => navigate(-1)}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {language === 'ru' ? 'Назад' : 'Back'}
              </button>
            </div>
            <p className="text-sm text-muted-foreground/70">
              {language === 'ru' ? 'Выполняйте задания и получайте награды' : 
               'Complete challenges and earn rewards'}
            </p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="px-6 py-5">
          <div className="flex gap-3">
            <div className="flex-1 bg-gradient-to-br from-card to-card/50 rounded-2xl p-4 text-center border border-border/20">
              <div className="text-4xl font-black text-foreground mb-0.5">{completedCount}</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium">
                {language === 'ru' ? 'Готово' : 'Done'}
              </div>
            </div>
            <div className="flex-1 bg-gradient-to-br from-card to-card/50 rounded-2xl p-4 text-center border border-border/20">
              <div className="text-4xl font-black text-foreground mb-0.5">{totalJoined}</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium">
                {language === 'ru' ? 'Активно' : 'Active'}
              </div>
            </div>
            <div className="flex-1 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-4 text-center border border-primary/20">
              <div className="text-4xl font-black text-primary mb-0.5">{challenges.length}</div>
              <div className="text-[10px] uppercase tracking-widest text-primary/60 font-medium">
                {language === 'ru' ? 'Всего' : 'Total'}
              </div>
            </div>
          </div>
        </div>

        {/* Featured Challenge */}
        {specialChallenges.length > 0 && (
          <div className="px-6 mb-6">
            <div className="relative overflow-hidden bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 rounded-3xl p-1 border border-primary/30">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/5 animate-pulse" />
              <div className="relative bg-background/80 backdrop-blur-sm rounded-[22px] p-5">
                <div className="text-[10px] uppercase tracking-widest text-primary font-bold mb-4">
                  {language === 'ru' ? 'Особый вызов' : 'Featured'}
                </div>
                <ChallengeItem challenge={specialChallenges[0]} index={0} />
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="px-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 h-14 p-1.5 bg-card/50 rounded-2xl border border-border/20">
              <TabsTrigger 
                value="daily" 
                className="rounded-xl h-11 font-bold text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-300"
              >
                {language === 'ru' ? 'Ежедневно' : 'Daily'}
                {dailyChallenges.length > 0 && (
                  <span className="ml-2 opacity-60">({dailyChallenges.length})</span>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="weekly" 
                className="rounded-xl h-11 font-bold text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-300"
              >
                {language === 'ru' ? 'Еженедельно' : 'Weekly'}
                {weeklyChallenges.length > 0 && (
                  <span className="ml-2 opacity-60">({weeklyChallenges.length})</span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="daily" className="space-y-4 mt-0">
              {loading ? (
                <LoadingSkeleton />
              ) : dailyChallenges.length > 0 ? (
                dailyChallenges.map((challenge, index) => (
                  <ChallengeItem key={challenge.id} challenge={challenge} index={index} />
                ))
              ) : (
                <EmptyState type="daily" />
              )}
            </TabsContent>

            <TabsContent value="weekly" className="space-y-4 mt-0">
              {loading ? (
                <LoadingSkeleton />
              ) : weeklyChallenges.length > 0 ? (
                weeklyChallenges.map((challenge, index) => (
                  <ChallengeItem key={challenge.id} challenge={challenge} index={index} />
                ))
              ) : (
                <EmptyState type="weekly" />
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Tips Section */}
        <div className="px-6 mt-8">
          <div className="bg-gradient-to-br from-card to-card/30 rounded-3xl p-6 border border-border/20">
            <h3 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wider">
              {language === 'ru' ? 'Советы' : 'Tips'}
            </h3>
            <div className="space-y-3">
              {[
                language === 'ru' ? 'Присоединяйтесь к заданиям за токены' : 
                'Join challenges to earn B tokens',
                language === 'ru' ? 'Ежедневные задания каждые 24 часа' : 
                'Daily challenges reset every 24 hours',
                language === 'ru' ? 'Особые задания дают больше наград' : 
                'Special challenges give bigger rewards'
              ].map((tip, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-muted-foreground/80">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary/60 shrink-0" />
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Challenges;