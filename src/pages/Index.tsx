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

        <div className="max-w-md mx-auto px-5 pt-8">
          
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <p className="text-lg font-semibold text-foreground">
              {telegramUser?.first_name || 'Miner'}
            </p>
            {!isConnected ? (
              <button
                onClick={handleConnectWallet}
                disabled={isConnecting}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
              >
                {isConnecting ? "..." : "Connect"}
              </button>
            ) : (
              <div className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium">
                Connected
              </div>
            )}
          </div>

          {/* Balance */}
          <Card className="p-6 mb-6 text-center bg-card border-border">
            <p className="text-xs text-muted-foreground uppercase mb-2">Your Balance</p>
            <p className="text-5xl font-bold text-foreground mb-1">
              {balance.toLocaleString()}
            </p>
            <p className="text-primary font-medium">BOLT</p>
            <p className="text-xs text-muted-foreground mt-3">Mining Power: {miningPower}x</p>
          </Card>

          {/* Mining */}
          <div className="mb-8">
            {isMining && miningProgress ? (
              <Card className="p-5 bg-card border-primary/30">
                <div className="flex justify-between items-center mb-4">
                  <p className="font-medium text-foreground">Mining...</p>
                  <p className="text-xl font-bold text-primary">{progress}%</p>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden mb-3">
                  <div 
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-center text-sm text-primary font-medium">
                  +{miningProgress.tokensMinedSoFar.toFixed(2)} BOLT
                </p>
              </Card>
            ) : (
              <Button 
                onClick={handleStartMining}
                className="w-full h-14 bg-primary text-primary-foreground text-base font-semibold rounded-xl"
              >
                Start Mining
              </Button>
            )}
          </div>

          {/* Simple Menu */}
          <div className="grid grid-cols-2 gap-3">
            {menuItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="p-4 rounded-xl bg-card border border-border text-left hover:border-primary/30 transition-colors"
              >
                <p className="font-medium text-foreground text-sm">{item.label}</p>
              </button>
            ))}
          </div>

        </div>
      </main>
    </>
  );
};

export default Index;
