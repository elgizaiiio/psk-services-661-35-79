import React from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Trophy, Gift, Loader2 } from 'lucide-react';
import { PageWrapper, FadeUp } from '@/components/ui/motion-wrapper';
import { BackButton } from '@/components/ui/back-button';
import { useBoltTown } from '@/hooks/useBoltTown';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useBoltMining } from '@/hooks/useBoltMining';
import { BoltTownLeaderboard } from '@/components/bolt-town/BoltTownLeaderboard';
import { PointsDisplay } from '@/components/bolt-town/PointsDisplay';
import { SpecialTonTask } from '@/components/bolt-town/SpecialTonTask';
import { CountdownTimer } from '@/components/bolt-town/CountdownTimer';
import { PointsGuide } from '@/components/bolt-town/PointsGuide';
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

  return (
    <PageWrapper className="min-h-screen bg-background pb-24">
      <Helmet>
        <title>Bolt Town - Daily Competition</title>
      </Helmet>

      <div className="max-w-md mx-auto px-4 pt-2 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <BackButton />
          <h1 className="text-xl font-bold">Bolt Town</h1>
        </div>

        {/* Banner Image */}
        <FadeUp>
          <motion.div
            className="relative rounded-2xl overflow-hidden"
            whileHover={{ scale: 1.01 }}
          >
            <img
              src={boltTownBanner}
              alt="Bolt Town Competition"
              className="w-full h-auto aspect-[2/1] object-cover"
            />
            {/* Prize Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-white/70">Daily Prize</p>
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-400" />
                    <span className="text-2xl font-bold text-white">2.5</span>
                    <UsdtIcon size={20} />
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-white/70">For #1 Player</p>
                  <p className="text-sm text-white font-medium">Every Day</p>
                </div>
              </div>
            </div>
          </motion.div>
        </FadeUp>

        {/* Countdown Timer */}
        <FadeUp delay={0.1}>
          <CountdownTimer getTimeUntilReset={getTimeUntilReset} />
        </FadeUp>

        {/* My Points */}
        <FadeUp delay={0.15}>
          <PointsDisplay points={myPoints} rank={myRank} />
        </FadeUp>

        {/* Special Task */}
        <FadeUp delay={0.2}>
          <SpecialTonTask
            isCompleted={myPoints?.special_task_done || false}
            onComplete={refreshMyPoints}
          />
        </FadeUp>

        {/* Leaderboard */}
        <FadeUp delay={0.25}>
          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-5 h-5 text-yellow-400" />
              <h2 className="font-bold">Today's Leaderboard</h2>
            </div>
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
          <FadeUp delay={0.3}>
            <div className="p-4 rounded-xl bg-card border border-border">
              <div className="flex items-center gap-2 mb-3">
                <Gift className="w-5 h-5 text-primary" />
                <h2 className="font-bold">Recent Winners</h2>
              </div>
              <div className="space-y-2">
                {previousWinners.slice(0, 5).map((winner) => (
                  <div
                    key={winner.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {winner.telegram_username ? `@${winner.telegram_username}` : 'Anonymous'}
                      </p>
                      <p className="text-xs text-muted-foreground">{winner.date}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-emerald-400">{winner.prize_usdt}</span>
                      <UsdtIcon size={14} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </FadeUp>
        )}

        {/* Points Guide */}
        <FadeUp delay={0.35}>
          <PointsGuide />
        </FadeUp>
      </div>
    </PageWrapper>
  );
};

export default BoltTown;
