import React from "react";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Zap, Wallet, Settings, Target, Users, Trophy, Crown, Coins, 
  Calendar, Sparkles, ChevronRight, Gamepad2, Gift, Star, 
  TrendingUp, Shield, Clock
} from "lucide-react";
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
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="relative">
            <div className="w-16 h-16 border-3 border-primary/20 rounded-full" />
            <div className="absolute inset-0 w-16 h-16 border-3 border-primary border-t-transparent rounded-full animate-spin" />
            <Zap className="absolute inset-0 m-auto w-6 h-6 text-primary" />
          </div>
          <p className="text-muted-foreground text-sm font-medium">Loading your dashboard...</p>
        </motion.div>
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
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4 max-w-xs"
        >
          <div className="w-16 h-16 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
            <Shield className="w-8 h-8 text-destructive" />
          </div>
          <p className="text-destructive text-sm">{error}</p>
          <Button onClick={clearError} size="sm" className="bg-primary text-primary-foreground">
            Try Again
          </Button>
        </motion.div>
      </main>
    );
  }

  const balance = user?.token_balance || 0;
  const miningPower = user?.mining_power || 1;
  const isMining = activeMiningSession && new Date() < new Date(activeMiningSession.end_time);
  const progress = miningProgress ? Math.round(miningProgress.progress * 100) : 0;

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

        {/* Background Gradient Effects */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-primary/3 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-md mx-auto px-4 pt-4 pb-6">
          
          {/* Header with Profile & Wallet */}
          <motion.header 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-between items-center mb-6"
          >
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/settings')}
                className="flex items-center justify-center w-11 h-11 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all group"
              >
                <Settings className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </button>
              <div>
                <p className="text-xs text-muted-foreground">Welcome back</p>
                <p className="font-semibold text-foreground">{telegramUser?.first_name || 'Miner'}</p>
              </div>
            </div>
            
            {!isConnected ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleConnectWallet}
                disabled={isConnecting}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/25"
              >
                <Wallet className="w-4 h-4" />
                {isConnecting ? "..." : "Connect"}
              </motion.button>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-primary/10 border border-primary/30">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-sm text-primary font-semibold">Connected</span>
              </div>
            )}
          </motion.header>

          {/* Balance Card - Hero Section */}
          <motion.section 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.05 }}
            className="mb-6"
          >
            <Card className="relative overflow-hidden bg-gradient-to-br from-card via-card to-primary/10 border-border/50 p-6">
              {/* Decorative Elements */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-3xl translate-x-1/4 -translate-y-1/4" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl -translate-x-1/4 translate-y-1/4" />
              
              <div className="relative flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded-lg bg-primary/20 flex items-center justify-center">
                      <Zap className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Balance</span>
                  </div>
                  <p className="text-4xl font-bold text-foreground tracking-tight">
                    {balance.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </p>
                  <p className="text-primary text-sm font-semibold mt-0.5">BOLT Tokens</p>
                </div>
                
                <div className="text-right">
                  <div className="flex items-center gap-1.5 justify-end mb-1">
                    <TrendingUp className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs text-muted-foreground">Mining Power</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{miningPower}x</p>
                </div>
              </div>
            </Card>
          </motion.section>

          {/* Mining Section */}
          <motion.section 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
            {isMining && miningProgress ? (
              <Card className="bg-card border-primary/40 p-5 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent" />
                
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center">
                          <Zap className="w-6 h-6 text-primary" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-card flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        </div>
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">Mining Active</p>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>{Math.max(0, Math.ceil(miningProgress.timeRemaining / 60))}m left</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-3xl font-bold text-primary">{progress}%</span>
                    </div>
                  </div>
                  
                  <div className="h-3 bg-muted/50 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.5 }}
                      className="h-full bg-gradient-to-r from-primary via-primary to-primary/70 rounded-full relative"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
                    </motion.div>
                  </div>
                  
                  <div className="mt-3 flex items-center justify-center gap-2 py-2 rounded-xl bg-primary/10">
                    <Coins className="w-4 h-4 text-primary" />
                    <span className="text-primary font-bold">+{miningProgress.tokensMinedSoFar.toFixed(2)} BOLT earned</span>
                  </div>
                </div>
              </Card>
            ) : (
              <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                <Button 
                  onClick={handleStartMining}
                  className="w-full h-16 bg-gradient-to-r from-primary via-primary to-primary/80 text-primary-foreground hover:opacity-95 rounded-2xl text-lg font-bold shadow-xl shadow-primary/30 transition-all relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                  <Zap className="w-6 h-6 mr-2" />
                  Start Mining
                </Button>
              </motion.div>
            )}
          </motion.section>

          {/* Daily & Earn Section */}
          <motion.section 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-6"
          >
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="text-sm font-semibold text-foreground">Daily Rewards</h2>
              <button 
                onClick={() => navigate('/daily-tasks')}
                className="text-xs text-primary font-medium flex items-center gap-1 hover:opacity-80"
              >
                View All <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/daily-tasks')}
                className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500/10 to-green-500/5 border border-emerald-500/20 p-4 text-left group"
              >
                <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl -translate-y-1/2 translate-x-1/2" />
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center mb-3 shadow-lg shadow-emerald-500/25">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <p className="font-semibold text-foreground text-sm">Daily Tasks</p>
                <p className="text-xs text-muted-foreground mt-0.5">Earn bonus tokens</p>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/slots')}
                className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500/10 to-violet-500/5 border border-purple-500/20 p-4 text-left group"
              >
                <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/10 rounded-full blur-xl -translate-y-1/2 translate-x-1/2" />
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center mb-3 shadow-lg shadow-purple-500/25">
                  <Gift className="w-5 h-5 text-white" />
                </div>
                <p className="font-semibold text-foreground text-sm">Lucky Spin</p>
                <p className="text-xs text-muted-foreground mt-0.5">Win big rewards</p>
              </motion.button>
            </div>
          </motion.section>

          {/* Progress & Achievements */}
          <motion.section 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="text-sm font-semibold text-foreground">Your Progress</h2>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: Target, label: 'Challenges', path: '/challenges', color: 'from-blue-500 to-cyan-500' },
                { icon: Trophy, label: 'Achievements', path: '/achievements', color: 'from-amber-500 to-orange-500' },
                { icon: Users, label: 'Characters', path: '/characters', color: 'from-pink-500 to-rose-500' },
              ].map((item, index) => (
                <motion.button
                  key={item.path}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate(item.path)}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all"
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg`}>
                    <item.icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xs font-medium text-foreground">{item.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.section>

          {/* Games Section */}
          <motion.section 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mb-6"
          >
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="text-sm font-semibold text-foreground">Play & Earn</h2>
              <button 
                onClick={() => navigate('/games')}
                className="text-xs text-primary font-medium flex items-center gap-1 hover:opacity-80"
              >
                All Games <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => navigate('/mini-games')}
              className="w-full flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-500/20 group"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-xl shadow-purple-500/25">
                <Gamepad2 className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-foreground">Mini Games</p>
                <p className="text-xs text-muted-foreground mt-0.5">Play games and earn BOLT tokens</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </motion.button>
          </motion.section>

          {/* Premium Section */}
          <motion.section 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="text-sm font-semibold text-foreground">Premium</h2>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => navigate('/vip')}
              className="w-full flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-orange-500/15 border border-amber-500/30 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-orange-500/5" />
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-500 flex items-center justify-center shadow-xl shadow-amber-500/30 relative">
                <Crown className="w-6 h-6 text-black" />
              </div>
              <div className="flex-1 text-left relative">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-foreground">VIP Membership</p>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 text-[10px] font-bold uppercase">Pro</span>
                </div>
                <p className="text-xs text-amber-500/80 mt-0.5">Unlock exclusive benefits</p>
              </div>
              <ChevronRight className="w-5 h-5 text-amber-500/50 group-hover:text-amber-500 transition-colors relative" />
            </motion.button>

            <div className="grid grid-cols-2 gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/upgrade-center')}
                className="flex flex-col items-start gap-3 p-4 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center group-hover:from-primary/30 group-hover:to-primary/20 transition-all">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">Upgrades</p>
                  <p className="text-xs text-muted-foreground">Boost power</p>
                </div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/token-store')}
                className="flex flex-col items-start gap-3 p-4 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-blue-500/20 flex items-center justify-center group-hover:from-primary/30 group-hover:to-blue-500/30 transition-all">
                  <Coins className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">Buy Tokens</p>
                  <p className="text-xs text-muted-foreground">Get BOLT</p>
                </div>
              </motion.button>
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => navigate('/mining-servers')}
              className="w-full flex items-center gap-4 p-4 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all group"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
                <Star className="w-6 h-6 text-cyan-500" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-foreground">Mining Servers</p>
                <p className="text-xs text-muted-foreground">Rent powerful mining rigs</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </motion.button>
          </motion.section>

        </div>
      </main>
    </>
  );
};

export default Index;
