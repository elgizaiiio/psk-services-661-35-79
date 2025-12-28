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
import { useUserServers } from '@/hooks/useUserServers';
import AchievementUnlockNotification from '@/components/achievements/AchievementUnlockNotification';
import DailyTasksNotification from '@/components/notifications/DailyTasksNotification';
import { Server, Zap, DollarSign, TrendingUp, Wallet, Settings, Gift, Target } from 'lucide-react';

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
  
  const { servers, getTotalStats } = useUserServers(user?.id || null);
  const stats = getTotalStats();

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

  const boltBalance = user?.token_balance || 0;
  const usdtBalance = (user as any)?.usdt_balance || 0;
  const isMining = activeMiningSession && new Date() < new Date(activeMiningSession.end_time);
  const progress = miningProgress ? Math.round(miningProgress.progress * 100) : 0;

  const menuItems = [
    { label: 'Daily Tasks', path: '/daily-tasks', icon: Target },
    { label: 'Upgrades', path: '/upgrade-center', icon: TrendingUp },
    { label: 'VIP', path: '/vip', icon: Gift },
    { label: 'Settings', path: '/settings', icon: Settings },
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
          <title>Bolt Mining</title>
          <meta name="description" content="Mine BOLT & USDT tokens with servers" />
        </Helmet>

        <div className="max-w-md mx-auto px-4 pt-4 space-y-4">
          
          {/* Header with balances */}
          <div className="flex justify-between items-start">
            <div>
              <p className="text-lg font-bold text-foreground">
                {telegramUser?.first_name || 'Miner'}
              </p>
              <p className="text-xs text-muted-foreground">Welcome back!</p>
            </div>
            {!isConnected ? (
              <Button
                onClick={handleConnectWallet}
                disabled={isConnecting}
                size="sm"
                className="bg-primary text-primary-foreground"
              >
                {isConnecting ? "..." : "Connect Wallet"}
              </Button>
            ) : (
              <div className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium">
                ✓ Connected
              </div>
            )}
          </div>

          {/* Balances Cards */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-primary" />
                <span className="text-xs text-muted-foreground">BOLT</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{boltBalance.toLocaleString()}</p>
              {stats.totalBoltPerDay > 0 && (
                <p className="text-xs text-primary mt-1">+{stats.totalBoltPerDay}/day</p>
              )}
            </Card>
            
            <Card className="p-4 bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-green-500" />
                <span className="text-xs text-muted-foreground">USDT</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{usdtBalance.toFixed(4)}</p>
              {stats.totalUsdtPerDay > 0 && (
                <p className="text-xs text-green-500 mt-1">+${stats.totalUsdtPerDay.toFixed(4)}/day</p>
              )}
            </Card>
          </div>

          {/* My Servers Summary */}
          <Card className="p-4 border-border">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Server className="w-5 h-5 text-primary" />
                <span className="font-semibold text-foreground">My Servers</span>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/mining-servers')}
                className="text-xs"
              >
                Buy More
              </Button>
            </div>
            
            {stats.totalServers > 0 ? (
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-2 rounded-lg bg-muted/50">
                  <p className="text-xl font-bold text-foreground">{stats.totalServers}</p>
                  <p className="text-[10px] text-muted-foreground">Servers</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-muted/50">
                  <p className="text-xl font-bold text-foreground">{stats.totalHashRate}</p>
                  <p className="text-[10px] text-muted-foreground">TH/s</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-muted/50">
                  <p className="text-xl font-bold text-primary">{stats.totalBoltPerDay}</p>
                  <p className="text-[10px] text-muted-foreground">BOLT/day</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground mb-2">No servers yet</p>
                <Button 
                  onClick={() => navigate('/mining-servers')}
                  className="bg-primary text-primary-foreground"
                >
                  Buy Your First Server
                </Button>
              </div>
            )}
          </Card>

          {/* Mining Button / Progress */}
          {stats.totalServers > 0 && (
            <div>
              {isMining && miningProgress ? (
                <Card className="p-4 bg-card border-primary/30">
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-medium text-sm text-foreground">Mining Active</p>
                    <p className="text-lg font-bold text-primary">{progress}%</p>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden mb-3">
                    <div 
                      className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-primary font-medium">+{miningProgress.tokensMinedSoFar.toFixed(2)} BOLT</span>
                    <span className="text-green-500 font-medium">+${(miningProgress.tokensMinedSoFar * 0.002).toFixed(4)} USDT</span>
                  </div>
                </Card>
              ) : (
                <Button 
                  onClick={handleStartMining}
                  className="w-full h-14 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-base font-bold rounded-xl shadow-lg shadow-primary/25"
                >
                  <Zap className="w-5 h-5 mr-2" />
                  Start Mining
                </Button>
              )}
            </div>
          )}

          {/* Quick Menu */}
          <div className="grid grid-cols-4 gap-2">
            {menuItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="p-3 rounded-xl bg-card border border-border text-center hover:border-primary/30 transition-colors flex flex-col items-center gap-1"
              >
                <item.icon className="w-5 h-5 text-primary" />
                <p className="font-medium text-foreground text-[10px]">{item.label}</p>
              </button>
            ))}
          </div>

          {/* Wallet Quick Access */}
          <Card 
            className="p-4 border-border cursor-pointer hover:border-primary/30 transition-colors"
            onClick={() => navigate('/wallet')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">My Wallet</p>
                  <p className="text-xs text-muted-foreground">Manage your assets</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-foreground">${usdtBalance.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Total Value</p>
              </div>
            </div>
          </Card>

        </div>
      </main>
    </>
  );
};

export default Index;
