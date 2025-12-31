import React from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useBoltMining } from '@/hooks/useBoltMining';
import { useTelegramTonConnect } from '@/hooks/useTelegramTonConnect';
import { useUserServers } from '@/hooks/useUserServers';
import { useTelegramBackButton } from '@/hooks/useTelegramBackButton';
import { Server, ChevronRight, Loader2, Play, Gift, ShoppingCart, Trophy, Crown } from 'lucide-react';
import { PageWrapper, StaggerContainer, FadeUp, AnimatedNumber, AnimatedProgress } from '@/components/ui/motion-wrapper';
import { BoltIcon, UsdtIcon } from '@/components/ui/currency-icons';
import DailyStreakModal from '@/components/DailyStreakModal';

const Index = () => {
  const navigate = useNavigate();
  const { user: telegramUser, isLoading: authLoading, hapticFeedback } = useTelegramAuth();
  const { user, activeMiningSession, loading, error, startMining, miningProgress, clearError } = useBoltMining(telegramUser);
  const { isConnected, isConnecting, connectWallet } = useTelegramTonConnect();
  const { getTotalStats } = useUserServers(user?.id || null);
  const stats = getTotalStats();
  useTelegramBackButton();

  const handleStartMining = async () => {
    hapticFeedback.impact('medium');
    await startMining();
  };

  if (authLoading || loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
          <Loader2 className="w-8 h-8 text-primary" />
        </motion.div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="text-center space-y-4">
          <p className="text-destructive text-sm">{error}</p>
          <Button onClick={clearError} size="sm" variant="outline">Try Again</Button>
        </div>
      </main>
    );
  }

  const boltBalance = user?.token_balance || 0;
  const usdtBalance = (user as any)?.usdt_balance || 0;
  const isMining = activeMiningSession && new Date() < new Date(activeMiningSession.end_time);
  const progress = miningProgress ? Math.round(miningProgress.progress * 100) : 0;

  return (
    <PageWrapper className="min-h-screen bg-background pb-28">
      <Helmet><title>Bolt Mining</title></Helmet>

      {/* Daily Streak Modal - shows on entry when reward available */}
      <DailyStreakModal />

      <div className="max-w-md mx-auto px-5 pt-16">
        <StaggerContainer className="space-y-6">
          {/* Header */}
          <FadeUp>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-foreground">Hey, {telegramUser?.first_name || 'Miner'}</h1>
                <p className="text-sm text-muted-foreground">Welcome back</p>
              </div>
              {!isConnected ? (
                <motion.div whileTap={{ scale: 0.95 }}>
                  <Button onClick={() => connectWallet()} disabled={isConnecting} size="sm" variant="outline" className="text-xs h-9">
                    {isConnecting ? "..." : "Connect"}
                  </Button>
                </motion.div>
              ) : (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="h-9 px-3 flex items-center rounded-lg bg-primary/10 text-primary text-xs font-medium">
                  Connected
                </motion.div>
              )}
            </div>
          </FadeUp>

          {/* Total Balance Card with Mining Progress */}
          <FadeUp>
            <motion.div className="p-6 rounded-2xl bg-card border border-border" whileHover={{ y: -2 }}>
              <p className="text-sm text-muted-foreground mb-1">Total Balance</p>
              <p className="text-4xl font-bold text-foreground tracking-tight">
                $<AnimatedNumber value={usdtBalance + (boltBalance * 0.001)} decimals={2} duration={1} />
              </p>
              {stats.totalBoltPerDay > 0 && (
                <p className="text-sm text-primary mt-2">+${((stats.totalBoltPerDay * 0.001) + stats.totalUsdtPerDay).toFixed(4)}/day</p>
              )}
              
              {/* Mining Progress inside balance card */}
              {isMining && miningProgress && (
                <div className="mt-4 pt-4 border-t border-border space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-muted-foreground">Mining</span>
                    <span className="text-sm font-bold text-primary">{progress}%</span>
                  </div>
                  <AnimatedProgress value={progress} />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>+{miningProgress.tokensMinedSoFar.toFixed(2)} BOLT</span>
                    <span>+${(miningProgress.tokensMinedSoFar * 0.001).toFixed(4)} USDT</span>
                  </div>
                </div>
              )}
            </motion.div>
          </FadeUp>

          {/* Balances Row */}
          <div className="grid grid-cols-2 gap-4">
            <FadeUp>
              <motion.div className="p-4 rounded-xl bg-card border border-border" whileTap={{ scale: 0.98 }}>
                <div className="flex items-center gap-2 mb-2">
                  <BoltIcon size={32} />
                  <span className="text-xs text-muted-foreground">BOLT</span>
                </div>
                <p className="text-xl font-semibold text-foreground"><AnimatedNumber value={boltBalance} decimals={0} duration={0.8} /></p>
                {stats.totalBoltPerDay > 0 && <p className="text-xs text-primary mt-1">+{stats.totalBoltPerDay}/day</p>}
              </motion.div>
            </FadeUp>
            
            <FadeUp>
              <motion.div className="p-4 rounded-xl bg-card border border-border" whileTap={{ scale: 0.98 }}>
                <div className="flex items-center gap-2 mb-2">
                  <UsdtIcon size={32} />
                  <span className="text-xs text-muted-foreground">USDT</span>
                </div>
                <p className="text-xl font-semibold text-foreground"><AnimatedNumber value={usdtBalance} decimals={2} duration={0.8} /></p>
                {stats.totalUsdtPerDay > 0 && <p className="text-xs text-primary mt-1">+${stats.totalUsdtPerDay.toFixed(4)}/day</p>}
              </motion.div>
            </FadeUp>
          </div>

          {/* Lucky Spin Card - First */}
          <FadeUp>
            <motion.button onClick={() => navigate('/spin')} className="w-full p-4 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 flex items-center justify-between" whileTap={{ scale: 0.98 }} whileHover={{ y: -2 }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Gift className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-foreground">Lucky Spin</p>
                  <p className="text-xs text-muted-foreground">Win TON, USDT and more</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">Free Daily</span>
                <ChevronRight className="w-5 h-5 text-primary" />
              </div>
            </motion.button>
          </FadeUp>

          {/* Premium VIP Card */}
          <FadeUp>
            <motion.button 
              onClick={() => navigate('/vip')} 
              className="w-full p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-yellow-500/5 border border-amber-500/20 flex items-center justify-between" 
              whileTap={{ scale: 0.98 }} 
              whileHover={{ y: -2 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <Crown className="w-5 h-5 text-amber-500" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-foreground">Premium VIP</p>
                  <p className="text-xs text-muted-foreground">Unlock all benefits</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-amber-500" />
            </motion.button>
          </FadeUp>

          {/* Servers Card - Second */}
          <FadeUp>
            <motion.button onClick={() => navigate('/mining-servers')} className="w-full p-4 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 flex items-center justify-between" whileTap={{ scale: 0.98 }} whileHover={{ y: -2 }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Server className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-foreground">My Servers</p>
                  <p className="text-xs text-muted-foreground">{stats.totalServers > 0 ? `${stats.totalServers} servers • ${stats.totalHashRate} TH/s` : 'No servers yet'}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-primary" />
            </motion.button>
          </FadeUp>

          {/* Mining Button (only when not mining) */}
          {stats.totalServers > 0 && !isMining && (
            <FadeUp>
              <motion.div whileTap={{ scale: 0.98 }}>
                <Button onClick={handleStartMining} className="w-full h-14 font-semibold rounded-xl gap-2">
                  <Play className="w-5 h-5" />
                  Start Mining
                </Button>
              </motion.div>
            </FadeUp>
          )}

          {/* Buy Bolt Card */}
          <FadeUp>
            <motion.button onClick={() => navigate('/buy-bolt')} className="w-full p-4 rounded-xl bg-card border border-border flex items-center justify-between" whileTap={{ scale: 0.98 }} whileHover={{ y: -2 }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-foreground">Buy BOLT</p>
                  <p className="text-xs text-muted-foreground">Get more tokens instantly</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </motion.button>
          </FadeUp>

          {/* Contest Card - Same color as other buttons */}
          <FadeUp>
            <motion.button onClick={() => navigate('/contest')} className="w-full p-4 rounded-xl bg-card border border-border flex items-center justify-between" whileTap={{ scale: 0.98 }} whileHover={{ y: -2 }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-foreground">Contest</p>
                  <p className="text-xs text-muted-foreground">Compete & win prizes</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">Live</span>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </motion.button>
          </FadeUp>

        </StaggerContainer>
      </div>
    </PageWrapper>
  );
};

export default Index;