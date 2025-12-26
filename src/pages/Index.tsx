import React from "react";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useBoltMining } from '@/hooks/useBoltMining';
import { useTelegramTonConnect } from '@/hooks/useTelegramTonConnect';
import { useAchievementNotifications } from '@/hooks/useAchievementNotifications';
import { useDailyTasksNotification } from '@/hooks/useDailyTasksNotification';
import AchievementUnlockNotification from '@/components/achievements/AchievementUnlockNotification';
import DailyTasksNotification from '@/components/notifications/DailyTasksNotification';
import { HeroCharacterDisplay } from '@/components/mining/HeroCharacterDisplay';

const Index = () => {
  const navigate = useNavigate();
  const { user: telegramUser, isLoading: authLoading, hapticFeedback } = useTelegramAuth();
  const { 
    user,
    activeMiningSession,
    loading,
    error,
    startMining,
    miningProgress,
    clearError
  } = useBoltMining(telegramUser);
  const { 
    isConnected, 
    isConnecting, 
    connectWallet 
  } = useTelegramTonConnect();
  const { notification, closeNotification } = useAchievementNotifications(user?.id || null);
  const { 
    notification: dailyNotification, 
    showNotification: showDailyNotification, 
    dismissNotification: dismissDailyNotification,
    markAsViewed: markDailyAsViewed 
  } = useDailyTasksNotification(user?.id || null);

  const handleStartMining = async () => {
    hapticFeedback.impact('medium');
    await startMining();
  };

  const handleConnectWallet = async () => {
    hapticFeedback.impact('medium');
    await connectWallet();
  };

  if (authLoading || loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <Helmet><title>Bolt</title></Helmet>
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center px-6">
        <Helmet><title>Error</title></Helmet>
        <div className="text-center space-y-4">
          <p className="text-destructive text-sm">{error}</p>
          <Button onClick={clearError} size="sm">Try Again</Button>
        </div>
      </main>
    );
  }

  const balance = user?.token_balance || 0;
  const miningPower = user?.mining_power || 1;
  const isMining = activeMiningSession && new Date() < new Date(activeMiningSession.end_time);
  const progress = miningProgress ? Math.round(miningProgress.progress * 100) : 0;

  const menuItems = [
    { label: 'Daily Tasks', path: '/daily-tasks' },
    { label: 'Mini Games', path: '/mini-games' },
    { label: 'Leaderboard', path: '/leaderboard' },
    { label: 'Upgrades', path: '/upgrade-center' },
    { label: 'VIP', path: '/vip' },
    { label: 'Settings', path: '/settings' },
  ];

  return (
    <>
      <AchievementUnlockNotification 
        achievement={notification} 
        onClose={closeNotification} 
      />
      <DailyTasksNotification
        isVisible={showDailyNotification}
        availableTasks={dailyNotification?.availableTasks || 0}
        totalRewards={dailyNotification?.totalRewards || 0}
        onDismiss={dismissDailyNotification}
        onNavigate={markDailyAsViewed}
      />
      
      <main className="min-h-screen bg-background pb-24">
        <Helmet>
          <title>Bolt</title>
          <meta name="description" content="Mine BOLT tokens" />
        </Helmet>

        <div className="max-w-md mx-auto px-4 pt-4">
          
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-base font-semibold text-foreground">
                {telegramUser?.first_name || 'Miner'}
              </p>
              <p className="text-xs text-muted-foreground">Mining Power: {miningPower}x</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-lg font-bold text-foreground">{balance.toLocaleString()}</p>
                <p className="text-xs text-primary font-medium">BOLT</p>
              </div>
              {!isConnected ? (
                <button
                  onClick={handleConnectWallet}
                  disabled={isConnecting}
                  className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium"
                >
                  {isConnecting ? "..." : "Connect"}
                </button>
              ) : (
                <div className="px-2 py-1 rounded-lg bg-primary/10 text-primary text-[10px] font-medium">
                  Connected
                </div>
              )}
            </div>
          </div>

          {/* Hero 3D Character Display - Like Free Fire/PUBG */}
          <HeroCharacterDisplay className="mb-4" compact={false} />

          {/* Mining */}
          <div className="mb-4">
            {isMining && miningProgress ? (
              <Card className="p-4 bg-card border-primary/30">
                <div className="flex justify-between items-center mb-2">
                  <p className="font-medium text-sm text-foreground">Mining...</p>
                  <p className="text-lg font-bold text-primary">{progress}%</p>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-2">
                  <div 
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-center text-xs text-primary font-medium">
                  +{miningProgress.tokensMinedSoFar.toFixed(2)} BOLT
                </p>
              </Card>
            ) : (
              <Button 
                onClick={handleStartMining}
                className="w-full h-12 bg-primary text-primary-foreground text-sm font-semibold rounded-xl"
              >
                Start Mining
              </Button>
            )}
          </div>

          {/* Quick Menu */}
          <div className="grid grid-cols-3 gap-2">
            {menuItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="p-3 rounded-xl bg-card border border-border text-center hover:border-primary/30 transition-colors"
              >
                <p className="font-medium text-foreground text-xs">{item.label}</p>
              </button>
            ))}
          </div>

        </div>
      </main>
    </>
  );
};

export default Index;
