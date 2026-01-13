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
import { useLimitedOfferModal } from '@/hooks/useLimitedOfferModal';
import { 
  Server, Loader2, Play, Gift, Trophy, Crown, Wallet, 
  Sparkles, Users, ChevronRight, Zap, ArrowUpRight
} from 'lucide-react';
import { PageWrapper, FadeUp, AnimatedProgress, LiveNumber } from '@/components/ui/motion-wrapper';
import { BoltIcon, UsdtIcon, ViralIcon } from '@/components/ui/currency-icons';
import DailyStreakModal from '@/components/DailyStreakModal';
import LimitedOfferModal from '@/components/offers/LimitedOfferModal';
import UserAvatar from '@/components/UserAvatar';
import PromoBanner from '@/components/home/PromoBanner';

const Index = () => {
  const navigate = useNavigate();
  const { user: telegramUser, isLoading: authLoading, hapticFeedback } = useTelegramAuth();
  const { user, activeMiningSession, loading, error, startMining, miningProgress, clearError } = useBoltMining(telegramUser);
  const { isConnected, isConnecting, connectWallet } = useTelegramTonConnect();
  const { getTotalStats } = useUserServers(user?.id || null);
  const stats = getTotalStats();
  const { shouldShowModal: showLimitedOffer, markAsShown: closeLimitedOffer } = useLimitedOfferModal();
  useTelegramBackButton();

  const handleStartMining = async () => {
    hapticFeedback.impact('medium');
    await startMining();
  };

  if (authLoading || loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </main>
    );
  }

  if (!telegramUser?.id) {
    return (
      <main className="min-h-screen bg-background flex flex-col items-center justify-center p-6 gap-4">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Zap className="w-8 h-8 text-primary" />
        </div>
        <p className="text-muted-foreground text-center">Open from Telegram</p>
        <a href="https://t.me/Boltminingbot" target="_blank" rel="noopener noreferrer"
          className="px-6 py-2.5 bg-primary text-primary-foreground rounded-full font-medium text-sm">
          Open App
        </a>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="text-center space-y-3">
          <p className="text-destructive text-sm">{error}</p>
          <Button onClick={clearError} size="sm" variant="outline">Retry</Button>
        </div>
      </main>
    );
  }

  const boltBalance = user?.token_balance || 0;
  const usdtBalance = (user as any)?.usdt_balance || 0;
  const viralBalance = (user as any)?.viral_balance || 0;
  const isMining = activeMiningSession && new Date() < new Date(activeMiningSession.end_time);
  const progress = miningProgress ? Math.round(miningProgress.progress * 100) : 0;
  const currentMined = miningProgress?.tokensMinedSoFar || 0;

  return (
    <PageWrapper className="min-h-screen bg-background pb-28">
      <Helmet><title>Bolt Mining</title></Helmet>
      <DailyStreakModal />
      <LimitedOfferModal isOpen={showLimitedOffer} onClose={closeLimitedOffer} />

      <div className="max-w-md mx-auto px-4 pt-12 space-y-5">
        
        {/* Header */}
        <FadeUp>
          <div className="flex items-center justify-between">
            <motion.button onClick={() => navigate('/profile')} whileTap={{ scale: 0.95 }} className="flex items-center gap-2.5">
              <UserAvatar user={telegramUser} size="sm" />
              <span className="text-sm font-medium text-foreground">{telegramUser?.first_name}</span>
            </motion.button>
            {!isConnected ? (
              <Button onClick={() => connectWallet()} disabled={isConnecting} size="sm" variant="outline" className="h-8 px-3 text-xs rounded-full">
                Connect
              </Button>
            ) : (
              <motion.button onClick={() => navigate('/wallet')} whileTap={{ scale: 0.95 }}
                className="h-8 px-3 rounded-full bg-primary/10 text-primary text-xs font-medium flex items-center gap-1">
                <Wallet className="w-3.5 h-3.5" /> Wallet
              </motion.button>
            )}
          </div>
        </FadeUp>

        {/* Banner */}
        <FadeUp>
          <PromoBanner />
        </FadeUp>

        {/* Main BOLT Balance */}
        <FadeUp>
          <motion.div className="text-center py-6" whileHover={{ scale: 1.01 }}>
            <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Your Balance</p>
            <div className="flex items-center justify-center gap-3">
              <BoltIcon size={40} />
              <p className="text-4xl font-bold text-foreground tabular-nums">
                <LiveNumber 
                  value={boltBalance + currentMined} 
                  incrementPerSecond={isMining ? (activeMiningSession?.tokens_per_hour || 0) / 3600 : 0}
                  isActive={!!isMining}
                  decimals={0} 
                />
              </p>
            </div>
            <p className="text-sm text-muted-foreground mt-1">BOLT Tokens</p>
            {stats.totalBoltPerDay > 0 && (
              <p className="text-xs text-primary mt-2 flex items-center justify-center gap-1">
                <ArrowUpRight className="w-3 h-3" />
                +{stats.totalBoltPerDay.toLocaleString()} BOLT/day
              </p>
            )}
          </motion.div>
        </FadeUp>

        {/* Mining Progress */}
        {isMining && miningProgress && (
          <FadeUp>
            <div className="p-4 rounded-2xl bg-card border border-border space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  Mining Active
                </span>
                <span className="text-xs font-semibold text-primary">{progress}%</span>
              </div>
              <AnimatedProgress value={progress} />
              <p className="text-xs text-muted-foreground text-center">
                +{currentMined.toFixed(2)} BOLT mined this session
              </p>
            </div>
          </FadeUp>
        )}

        {/* Other Balances */}
        <FadeUp>
          <div className="grid grid-cols-2 gap-3">
            <motion.button onClick={() => navigate('/wallet')} whileTap={{ scale: 0.97 }}
              className="p-4 rounded-2xl bg-card border border-border text-left">
              <UsdtIcon size={24} />
              <p className="text-lg font-semibold text-foreground mt-2">{usdtBalance.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">USDT</p>
            </motion.button>
            <motion.button onClick={() => navigate('/wallet')} whileTap={{ scale: 0.97 }}
              className="p-4 rounded-2xl bg-card border border-border text-left">
              <ViralIcon size={24} />
              <p className="text-lg font-semibold text-foreground mt-2">{viralBalance.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">VIRAL</p>
            </motion.button>
          </div>
        </FadeUp>

        {/* Quick Actions */}
        <FadeUp>
          <div className="grid grid-cols-4 gap-2">
            {[
              { icon: Gift, label: '$100', path: '/daily-contest', color: 'text-emerald-500' },
              { icon: Sparkles, label: 'Spin', path: '/spin', color: 'text-purple-500' },
              { icon: Server, label: 'Servers', path: '/mining-servers', color: 'text-sky-500' },
              { icon: Trophy, label: 'Top', path: '/leaderboard', color: 'text-amber-500' },
            ].map((item) => (
              <motion.button key={item.label} onClick={() => { hapticFeedback.impact('light'); navigate(item.path); }}
                className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-card border border-border"
                whileTap={{ scale: 0.95 }}>
                <item.icon className={`w-5 h-5 ${item.color}`} />
                <span className="text-[11px] font-medium text-foreground">{item.label}</span>
              </motion.button>
            ))}
          </div>
        </FadeUp>

        {/* CTA Cards */}
        <FadeUp>
          <div className="space-y-2">
            <motion.button onClick={() => navigate('/invite')} whileTap={{ scale: 0.98 }}
              className="w-full p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-purple-500" />
              </div>
              <div className="text-left flex-1">
                <p className="text-sm font-semibold text-foreground">Invite & Earn</p>
                <p className="text-xs text-muted-foreground">15% of friends' earnings</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </motion.button>

            <motion.button onClick={() => navigate('/vip')} whileTap={{ scale: 0.98 }}
              className="w-full p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                <Crown className="w-5 h-5 text-amber-500" />
              </div>
              <div className="text-left flex-1">
                <p className="text-sm font-semibold text-foreground">VIP Status</p>
                <p className="text-xs text-muted-foreground">2x mining power</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </motion.button>
          </div>
        </FadeUp>

        {/* Mining Button */}
        {stats.totalServers > 0 && !isMining && (
          <FadeUp>
            <Button onClick={handleStartMining} className="w-full h-12 rounded-2xl font-semibold gap-2">
              <Play className="w-5 h-5" /> Start Mining
            </Button>
          </FadeUp>
        )}

        {/* No Servers */}
        {stats.totalServers === 0 && (
          <FadeUp>
            <motion.button onClick={() => navigate('/mining-servers')} whileTap={{ scale: 0.98 }}
              className="w-full p-4 rounded-2xl border-2 border-dashed border-border text-center">
              <Server className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-medium text-foreground">Get a Server</p>
              <p className="text-xs text-muted-foreground">Start earning BOLT</p>
            </motion.button>
          </FadeUp>
        )}

      </div>
    </PageWrapper>
  );
};

export default Index;
