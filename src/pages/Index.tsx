import React from "react";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Zap, Wallet, Settings, Target, Users, Trophy, Crown, Coins, Calendar, Sparkles, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useBoltMining } from '@/hooks/useBoltMining';
import { useTelegramTonConnect } from '@/hooks/useTelegramTonConnect';
import { useAchievementNotifications } from '@/hooks/useAchievementNotifications';
import { useDailyTasksNotification } from '@/hooks/useDailyTasksNotification';
import AchievementUnlockNotification from '@/components/achievements/AchievementUnlockNotification';
import DailyTasksNotification from '@/components/notifications/DailyTasksNotification';
import { motion } from "framer-motion";

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
          <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin" />
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
            Retry
          </Button>
        </div>
      </main>
    );
  }

  const balance = user?.token_balance || 0;
  const isMining = activeMiningSession && new Date() < new Date(activeMiningSession.end_time);
  const progress = miningProgress ? Math.round(miningProgress.progress * 100) : 0;

  const quickActions = [
    { icon: Calendar, label: 'Daily Tasks', path: '/daily-tasks', color: 'from-emerald-500 to-green-600' },
    { icon: Target, label: 'Challenges', path: '/challenges', color: 'from-blue-500 to-cyan-600' },
    { icon: Trophy, label: 'Achievements', path: '/achievements', color: 'from-purple-500 to-violet-600' },
    { icon: Users, label: 'Characters', path: '/characters', color: 'from-orange-500 to-amber-600' },
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
          <title>Bolt | Mining</title>
          <meta name="description" content="Mine BOLT tokens" />
        </Helmet>

        <div className="max-w-md mx-auto px-4 pt-6 pb-6">
          
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-between items-center mb-8"
          >
            <button
              onClick={() => navigate('/settings')}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-card border border-border/50 hover:bg-muted transition-all"
            >
              <Settings className="w-5 h-5 text-muted-foreground" />
            </button>
            
            {!isConnected ? (
              <button
                onClick={handleConnectWallet}
                disabled={isConnecting}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
              >
                <Wallet className="w-4 h-4" />
                {isConnecting ? "Connecting..." : "Connect Wallet"}
              </button>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-sm text-primary font-medium">Connected</span>
              </div>
            )}
          </motion.div>

          {/* Balance Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="relative mb-8"
          >
            <Card className="bg-gradient-to-br from-card via-card to-primary/5 border-border/50 p-6 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Your Balance</span>
                </div>
                <p className="text-5xl font-bold text-foreground tracking-tight mb-1">
                  {balance.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </p>
                <p className="text-primary text-sm font-semibold">BOLT Tokens</p>
              </div>
            </Card>
          </motion.div>

          {/* Mining Section */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            {isMining && miningProgress ? (
              <Card className="bg-card border-primary/30 p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <Zap className="w-4 h-4 text-primary animate-pulse" />
                    </div>
                    <span className="font-medium text-foreground">Mining Active</span>
                  </div>
                  <span className="text-2xl font-bold text-primary">{progress}%</span>
                </div>
                
                <div className="h-2 bg-muted rounded-full mb-4 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full"
                  />
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-primary font-medium">+{miningProgress.tokensMinedSoFar.toFixed(2)} BOLT</span>
                  <span className="text-muted-foreground">
                    {Math.max(0, Math.ceil(miningProgress.timeRemaining / 60))}m remaining
                  </span>
                </div>
              </Card>
            ) : (
              <Button 
                onClick={handleStartMining}
                className="w-full h-14 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:opacity-90 rounded-2xl text-base font-semibold shadow-lg shadow-primary/30 transition-all"
              >
                <Zap className="w-5 h-5 mr-2" />
                Start Mining
              </Button>
            )}
          </motion.div>

          {/* Quick Actions Grid */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-6"
          >
            <h3 className="text-sm font-medium text-muted-foreground mb-3 px-1">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action, index) => (
                <motion.button
                  key={action.path}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                  onClick={() => navigate(action.path)}
                  className="group relative overflow-hidden rounded-2xl bg-card border border-border/50 p-4 text-left hover:border-primary/30 transition-all"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-10 transition-opacity`} />
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-3`}>
                    <action.icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-medium text-foreground text-sm">{action.label}</span>
                  <ChevronRight className="absolute bottom-4 right-3 w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Premium Section */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-3"
          >
            <h3 className="text-sm font-medium text-muted-foreground mb-3 px-1">Premium</h3>
            
            <button
              onClick={() => navigate('/upgrade-center')}
              className="w-full flex items-center gap-4 p-4 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-foreground">Upgrade Center</p>
                <p className="text-xs text-muted-foreground">Boost your mining power</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </button>

            <button
              onClick={() => navigate('/vip')}
              className="w-full flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/30 hover:border-amber-500/50 transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center">
                <Crown className="w-6 h-6 text-black" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-foreground">VIP Subscription</p>
                <p className="text-xs text-amber-500/80">Exclusive benefits & rewards</p>
              </div>
              <ChevronRight className="w-5 h-5 text-amber-500/50 group-hover:text-amber-500 transition-colors" />
            </button>

            <button
              onClick={() => navigate('/token-store')}
              className="w-full flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-primary/10 to-blue-500/10 border border-primary/30 hover:border-primary/50 transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center">
                <Coins className="w-6 h-6 text-black" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-foreground">Buy Tokens</p>
                <p className="text-xs text-primary/80">Get more BOLT instantly</p>
              </div>
              <ChevronRight className="w-5 h-5 text-primary/50 group-hover:text-primary transition-colors" />
            </button>
          </motion.div>

        </div>
      </main>
    </>
  );
};

export default Index;
