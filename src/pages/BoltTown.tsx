import React from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { PageWrapper, FadeUp } from '@/components/ui/motion-wrapper';
import { BackButton } from '@/components/ui/back-button';
import { useBoltTown } from '@/hooks/useBoltTown';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useBoltMining } from '@/hooks/useBoltMining';
import { BoltTownLeaderboard } from '@/components/bolt-town/BoltTownLeaderboard';
import { SpecialTonTask } from '@/components/bolt-town/SpecialTonTask';
import { CountdownTimer } from '@/components/bolt-town/CountdownTimer';
import { UsdtIcon } from '@/components/ui/currency-icons';
import boltTownBanner from '@/assets/bolt-town-banner.png';

const BoltTown = () => {
  const { user: telegramUser } = useTelegramAuth();
  const { user: boltUser } = useBoltMining(telegramUser);
  const {
    myPoints,
    leaderboard,
    myRank,
    previousWinners,
    loading,
    getTimeUntilReset,
    refreshMyPoints,
  } = useBoltTown();

  if (loading) {
    return (
      <PageWrapper className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </PageWrapper>
    );
  }

  const totalPoints = myPoints?.total_points || 0;

  return (
    <PageWrapper className="min-h-screen bg-background pb-24">
      <Helmet>
        <title>Bolt Town - Daily Competition</title>
      </Helmet>

      <div className="max-w-md mx-auto px-4 pt-2 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <BackButton />
          <h1 className="text-xl font-bold">Bolt Town</h1>
        </div>

        {/* Banner Image */}
        <FadeUp>
          <div className="relative rounded-2xl overflow-hidden">
            <img
              src={boltTownBanner}
              alt="Bolt Town Competition"
              className="w-full h-auto aspect-square object-cover"
            />
          </div>
        </FadeUp>

        {/* Prize & Timer Section */}
        <FadeUp delay={0.1}>
          <div className="p-5 rounded-2xl bg-card border border-border space-y-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Daily Prize</p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-4xl font-bold text-foreground">2.5</span>
                <UsdtIcon size={28} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">For #1 Player Every Day</p>
            </div>
            <div className="border-t border-border pt-4">
              <CountdownTimer getTimeUntilReset={getTimeUntilReset} />
            </div>
          </div>
        </FadeUp>

        {/* My Points Card */}
        <FadeUp delay={0.15}>
          <div className="p-5 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Your Points Today</p>
                <p className="text-4xl font-bold text-primary">{totalPoints}</p>
              </div>
              {myRank && (
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Rank</p>
                  <p className="text-3xl font-bold">#{myRank}</p>
                </div>
              )}
            </div>
          </div>
        </FadeUp>

        {/* Special TON Task */}
        <FadeUp delay={0.2}>
          <SpecialTonTask
            isCompleted={myPoints?.special_task_done || false}
            onComplete={refreshMyPoints}
          />
        </FadeUp>

        {/* How to Earn Points */}
        <FadeUp delay={0.25}>
          <div className="p-5 rounded-2xl bg-card border border-border">
            <h2 className="font-bold text-lg mb-4">How to Earn Points</h2>
            <div className="space-y-3">
              {[
                { action: 'Buy a Mining Server', points: '+100' },
                { action: 'Invite a Friend', points: '+10' },
                { action: 'Friend Completes a Task', points: '+5' },
                { action: 'Complete Any Task', points: '+5' },
                { action: 'Special Task (0.5 TON)', points: '+10' },
                { action: 'Watch an Ad', points: '+2', note: 'No limit' },
                { action: 'Daily Mining Check-in', points: '+1' },
                { action: '3-Day Activity Streak', points: '+5' },
              ].map((item, index) => (
                <motion.div
                  key={item.action}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.03 }}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-foreground">{item.action}</span>
                    {item.note && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        {item.note}
                      </span>
                    )}
                  </div>
                  <span className="font-semibold text-primary">{item.points}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </FadeUp>

        {/* Leaderboard */}
        <FadeUp delay={0.3}>
          <div className="p-5 rounded-2xl bg-card border border-border">
            <h2 className="font-bold text-lg mb-4">Today's Leaderboard</h2>
            <BoltTownLeaderboard
              leaderboard={leaderboard}
              myUserId={boltUser?.id}
              myRank={myRank}
              myPoints={myPoints?.total_points}
            />
          </div>
        </FadeUp>

        {/* Previous Winners */}
        {previousWinners.length > 0 && (
          <FadeUp delay={0.35}>
            <div className="p-5 rounded-2xl bg-card border border-border">
              <h2 className="font-bold text-lg mb-4">Recent Winners</h2>
              <div className="space-y-2">
                {previousWinners.slice(0, 5).map((winner) => (
                  <div
                    key={winner.id}
                    className="flex items-center justify-between py-2 border-b border-border last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {winner.telegram_username ? `@${winner.telegram_username}` : 'Anonymous'}
                      </p>
                      <p className="text-xs text-muted-foreground">{winner.date}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-primary">{winner.prize_usdt}</span>
                      <UsdtIcon size={14} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </FadeUp>
        )}

        {/* Competition Rules */}
        <FadeUp delay={0.4}>
          <div className="p-5 rounded-2xl bg-muted/30 border border-border">
            <h2 className="font-bold text-lg mb-3">Competition Rules</h2>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Competition resets daily at 00:00 UTC</li>
              <li>Player with highest points wins 2.5 USDT</li>
              <li>Prize automatically added to your balance</li>
              <li>All referrals must be real users</li>
              <li>Winner announced via Telegram notification</li>
            </ul>
          </div>
        </FadeUp>
      </div>
    </PageWrapper>
  );
};

export default BoltTown;
