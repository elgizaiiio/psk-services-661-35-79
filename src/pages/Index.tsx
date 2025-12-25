import React from "react";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";
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

  // Loading state
  if (authLoading || loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <Helmet>
          <title>Bolt | Mining</title>
        </Helmet>
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 border-2 border-primary/30 rounded-full" />
            <div className="absolute inset-0 w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </main>
    );
  }

  // Error state
  if (error) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center px-6">
        <Helmet>
          <title>Error | Bolt</title>
        </Helmet>
        <div className="text-center space-y-4 max-w-xs">
          <p className="text-destructive text-sm">{error}</p>
          <Button onClick={clearError} size="sm" className="bg-primary text-primary-foreground">
            Try Again
          </Button>
        </div>
      </main>
    );
  }

  const balance = user?.token_balance || 0;
  const miningPower = user?.mining_power || 1;
  const isMining = activeMiningSession && new Date() < new Date(activeMiningSession.end_time);
  const progress = miningProgress ? Math.round(miningProgress.progress * 100) : 0;

  const quickLinks = [
    { label: 'Daily Tasks', desc: 'Earn bonus', path: '/daily-tasks' },
    { label: 'Lucky Spin', desc: 'Win rewards', path: '/slots' },
    { label: 'Challenges', desc: 'Complete goals', path: '/challenges' },
  ];

  const mainFeatures = [
    { label: 'Achievements', path: '/achievements' },
    { label: 'Characters', path: '/characters' },
    { label: 'Leaderboard', path: '/leaderboard' },
  ];

  const premiumFeatures = [
    { label: 'VIP Membership', desc: 'Exclusive benefits', path: '/vip', highlight: true },
    { label: 'Upgrades', desc: 'Boost mining power', path: '/upgrade-center' },
    { label: 'Token Store', desc: 'Buy BOLT tokens', path: '/token-store' },
    { label: 'Mining Servers', desc: 'Rent mining rigs', path: '/mining-servers' },
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
      <main className="min-h-screen bg-background pb-28">
        <Helmet>
          <title>Bolt | Mining</title>
          <meta name="description" content="Mine BOLT tokens" />
        </Helmet>

        <div className="max-w-md mx-auto px-5 pt-6 pb-6">
          
          {/* Header */}
          <header className="flex justify-between items-center mb-8">
            <div>
              <p className="text-xs text-muted-foreground">Welcome back</p>
              <p className="font-semibold text-foreground text-lg">{telegramUser?.first_name || 'Miner'}</p>
            </div>
            
            <div className="flex items-center gap-3">
              {!isConnected ? (
                <button
                  onClick={handleConnectWallet}
                  disabled={isConnecting}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium"
                >
                  {isConnecting ? "..." : "Connect Wallet"}
                </button>
              ) : (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/10 border border-primary/20">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-xs text-primary font-medium">Connected</span>
                </div>
              )}
              <button
                onClick={() => navigate('/settings')}
                className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground"
              >
                ⚙️
              </button>
            </div>
          </header>

          {/* Balance Card */}
          <Card className="bg-card border-border p-6 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Total Balance</p>
                <p className="text-4xl font-bold text-foreground">
                  {balance.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </p>
                <p className="text-primary text-sm font-medium mt-1">BOLT</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground mb-1">Mining Power</p>
                <p className="text-2xl font-bold text-foreground">{miningPower}x</p>
              </div>
            </div>
          </Card>

          {/* Mining Button/Status */}
          <div className="mb-8">
            {isMining && miningProgress ? (
              <Card className="bg-card border-primary/30 p-5">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <p className="font-semibold text-foreground">Mining Active</p>
                    <p className="text-xs text-muted-foreground">
                      {Math.max(0, Math.ceil(miningProgress.timeRemaining / 60))}m remaining
                    </p>
                  </div>
                  <span className="text-2xl font-bold text-primary">{progress}%</span>
                </div>
                
                <div className="h-2 bg-muted rounded-full overflow-hidden mb-3">
                  <div 
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                
                <p className="text-center text-primary font-medium text-sm">
                  +{miningProgress.tokensMinedSoFar.toFixed(2)} BOLT earned
                </p>
              </Card>
            ) : (
              <Button 
                onClick={handleStartMining}
                className="w-full h-14 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl text-base font-semibold"
              >
                Start Mining
              </Button>
            )}
          </div>

          {/* Quick Links */}
          <section className="mb-8">
            <h2 className="text-sm font-semibold text-foreground mb-4">Daily Rewards</h2>
            <div className="space-y-3">
              {quickLinks.map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className="w-full flex items-center justify-between p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors"
                >
                  <div className="text-left">
                    <p className="font-medium text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          </section>

          {/* Main Features */}
          <section className="mb-8">
            <h2 className="text-sm font-semibold text-foreground mb-4">Your Progress</h2>
            <div className="grid grid-cols-3 gap-3">
              {mainFeatures.map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className="p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors text-center"
                >
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                </button>
              ))}
            </div>
          </section>

          {/* Mini Games */}
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-foreground">Play & Earn</h2>
              <button 
                onClick={() => navigate('/mini-games')}
                className="text-xs text-primary font-medium flex items-center gap-1"
              >
                All Games <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <button
              onClick={() => navigate('/mini-games')}
              className="w-full flex items-center justify-between p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors"
            >
              <div className="text-left">
                <p className="font-medium text-foreground">Mini Games</p>
                <p className="text-xs text-muted-foreground">Play games and earn BOLT</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          </section>

          {/* Premium Features */}
          <section>
            <h2 className="text-sm font-semibold text-foreground mb-4">Premium</h2>
            <div className="space-y-3">
              {premiumFeatures.map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border transition-colors ${
                    item.highlight 
                      ? 'bg-primary/5 border-primary/30 hover:border-primary/50' 
                      : 'bg-card border-border hover:border-primary/30'
                  }`}
                >
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground">{item.label}</p>
                      {item.highlight && (
                        <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-bold uppercase">
                          Pro
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          </section>

        </div>
      </main>
    </>
  );
};

export default Index;
