import React, { useCallback, useEffect, useState, useRef } from "react";
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
  Sparkles, TrendingUp, Users, ChevronRight, Zap
} from 'lucide-react';
import { PageWrapper, StaggerContainer, FadeUp, AnimatedNumber, AnimatedProgress, LiveNumber } from '@/components/ui/motion-wrapper';
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

  if (authLoading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
          <Loader2 className="w-8 h-8 text-primary" />
        </motion.div>
      </main>
    );
  }

  if (!telegramUser?.id) {
    return (
      <main className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Loader2 className="w-12 h-12 text-muted-foreground mb-4" />
        <p className="text-lg text-muted-foreground text-center mb-4">
          Please open the app from Telegram
        </p>
        <a 
          href="https://t.me/Boltminingbot" 
          target="_blank" 
          rel="noopener noreferrer"
          className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium"
        >
          Open in Telegram
        </a>
      </main>
    );
  }

  if (loading) {
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
  const viralBalance = (user as any)?.viral_balance || 0;
  const isMining = activeMiningSession && new Date() < new Date(activeMiningSession.end_time);
  const progress = miningProgress ? Math.round(miningProgress.progress * 100) : 0;

  const quickLinks = [
    { id: 'contest', icon: Gift, label: '$100', sublabel: 'Daily', path: '/daily-contest', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { id: 'spin', icon: Sparkles, label: 'Spin', sublabel: 'Free', path: '/spin', color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { id: 'servers', icon: Server, label: 'Servers', sublabel: stats.totalServers > 0 ? `${stats.totalServers}` : 'Buy', path: '/mining-servers', color: 'text-sky-500', bg: 'bg-sky-500/10' },
    { id: 'wallet', icon: Wallet, label: 'Wallet', sublabel: 'Assets', path: '/wallet', color: 'text-amber-500', bg: 'bg-amber-500/10' },
  ];

  return (
    <PageWrapper className="min-h-screen bg-background pb-28">
      <Helmet><title>Bolt Mining</title></Helmet>

      <DailyStreakModal />
      <LimitedOfferModal isOpen={showLimitedOffer} onClose={closeLimitedOffer} />

      <div className="max-w-md mx-auto px-4 pt-14">
        <StaggerContainer className="space-y-4">
          
          {/* Compact Header */}
          <FadeUp>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <motion.button onClick={() => navigate('/profile')} whileTap={{ scale: 0.95 }}>
                  <UserAvatar user={telegramUser} size="sm" />
                </motion.button>
                <div>
                  <h1 className="text-base font-semibold text-foreground">{telegramUser?.first_name || 'Miner'}</h1>
                  <p className="text-xs text-muted-foreground">Welcome back</p>
                </div>
              </div>
              {!isConnected ? (
                <Button onClick={() => connectWallet()} disabled={isConnecting} size="sm" variant="outline" className="text-xs h-8 px-3">
                  Connect
                </Button>
              ) : (
                <Button onClick={() => navigate('/profile')} size="sm" variant="ghost" className="text-xs h-8 px-3 gap-1">
                  <Crown className="w-3.5 h-3.5 text-amber-500" />
                </Button>
              )}
            </div>
          </FadeUp>

          {/* Promo Banner */}
          <FadeUp>
            <PromoBanner />
          </FadeUp>

          {/* Main Balance Card - Glassmorphism Style */}
          <FadeUp>
            <motion.div 
              className="relative p-5 rounded-2xl bg-gradient-to-br from-card via-card to-card/80 border border-border overflow-hidden"
              whileHover={{ y: -2 }}
            >
              {/* Decorative gradient */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-muted-foreground font-medium">Total Balance</span>
                  {stats.totalBoltPerDay > 0 && (
                    <span className="text-xs text-primary flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      +${((stats.totalBoltPerDay * 0.001) + stats.totalUsdtPerDay).toFixed(4)}/day
                    </span>
                  )}
                </div>
                <p className="text-3xl font-bold text-foreground tracking-tight">
                  $<AnimatedNumber value={usdtBalance + (boltBalance * 0.001)} decimals={2} duration={1} />
                </p>

                {/* Mining Progress */}
                {isMining && miningProgress && (
                  <div className="mt-4 pt-3 border-t border-border/50 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                        <Zap className="w-3 h-3 text-primary" />
                        Mining Active
                      </span>
                      <span className="text-xs font-bold text-primary">{progress}%</span>
                    </div>
                    <AnimatedProgress value={progress} />
                    <p className="text-xs text-muted-foreground">
                      +{miningProgress.tokensMinedSoFar.toFixed(2)} BOLT mined
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </FadeUp>

          {/* Three Currency Cards */}
          <div className="grid grid-cols-3 gap-2">
            <FadeUp>
              <motion.div 
                onClick={() => navigate('/wallet')}
                className="p-3 rounded-xl bg-card border border-border cursor-pointer" 
                whileTap={{ scale: 0.97 }}
              >
                <div className="flex items-center gap-1.5 mb-1.5">
                  <BoltIcon size={20} />
                </div>
                <p className="text-sm font-semibold text-foreground truncate">
                  <LiveNumber 
                    value={boltBalance + (miningProgress?.tokensMinedSoFar || 0)} 
                    incrementPerSecond={isMining ? (activeMiningSession?.tokens_per_hour || 0) / 3600 : 0}
                    isActive={!!isMining}
                    decimals={0} 
                  />
                </p>
                <p className="text-[10px] text-muted-foreground">BOLT</p>
              </motion.div>
            </FadeUp>
            
            <FadeUp>
              <motion.div 
                onClick={() => navigate('/wallet')}
                className="p-3 rounded-xl bg-card border border-border cursor-pointer" 
                whileTap={{ scale: 0.97 }}
              >
                <div className="flex items-center gap-1.5 mb-1.5">
                  <UsdtIcon size={20} />
                </div>
                <p className="text-sm font-semibold text-foreground truncate">
                  <LiveNumber 
                    value={usdtBalance} 
                    incrementPerSecond={0}
                    isActive={false}
                    decimals={2} 
                  />
                </p>
                <p className="text-[10px] text-muted-foreground">USDT</p>
              </motion.div>
            </FadeUp>

            <FadeUp>
              <motion.div 
                onClick={() => navigate('/wallet')}
                className="p-3 rounded-xl bg-card border border-border cursor-pointer" 
                whileTap={{ scale: 0.97 }}
              >
                <div className="flex items-center gap-1.5 mb-1.5">
                  <ViralIcon size={20} />
                </div>
                <p className="text-sm font-semibold text-foreground truncate">
                  {viralBalance.toLocaleString()}
                </p>
                <p className="text-[10px] text-muted-foreground">VIRAL</p>
              </motion.div>
            </FadeUp>
          </div>

          {/* Quick Links Grid */}
          <FadeUp>
            <div className="grid grid-cols-4 gap-2">
              {quickLinks.map((link) => (
                <motion.button
                  key={link.id}
                  onClick={() => {
                    hapticFeedback.impact('light');
                    navigate(link.path);
                  }}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl ${link.bg} border border-transparent hover:border-border transition-colors`}
                  whileTap={{ scale: 0.95 }}
                >
                  <link.icon className={`w-5 h-5 ${link.color} mb-1`} />
                  <span className="text-xs font-semibold text-foreground">{link.label}</span>
                  <span className="text-[9px] text-muted-foreground">{link.sublabel}</span>
                </motion.button>
              ))}
            </div>
          </FadeUp>

          {/* Feature Cards Row */}
          <FadeUp>
            <div className="grid grid-cols-2 gap-2">
              {/* Leaderboard Card */}
              <motion.button
                onClick={() => navigate('/leaderboard')}
                className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/20 text-left"
                whileTap={{ scale: 0.97 }}
              >
                <Trophy className="w-5 h-5 text-amber-500 mb-2" />
                <p className="text-sm font-semibold text-foreground">Leaderboard</p>
                <p className="text-xs text-muted-foreground">Top 5 win prizes</p>
              </motion.button>

              {/* Invite Card */}
              <motion.button
                onClick={() => navigate('/invite')}
                className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 text-left"
                whileTap={{ scale: 0.97 }}
              >
                <Users className="w-5 h-5 text-purple-500 mb-2" />
                <p className="text-sm font-semibold text-foreground">Invite Friends</p>
                <p className="text-xs text-muted-foreground">Earn 15% bonus</p>
              </motion.button>
            </div>
          </FadeUp>

          {/* VIP Banner */}
          <FadeUp>
            <motion.button
              onClick={() => navigate('/vip')}
              className="w-full p-4 rounded-xl bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border border-primary/20 flex items-center justify-between"
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Crown className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-foreground">Upgrade to VIP</p>
                  <p className="text-xs text-muted-foreground">2x mining power + exclusive perks</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </motion.button>
          </FadeUp>

          {/* Mining Button */}
          {stats.totalServers > 0 && !isMining && (
            <FadeUp>
              <motion.div whileTap={{ scale: 0.98 }}>
                <Button onClick={handleStartMining} className="w-full h-12 font-semibold rounded-xl gap-2 bg-primary hover:bg-primary/90">
                  <Play className="w-5 h-5" />
                  Start Mining
                </Button>
              </motion.div>
            </FadeUp>
          )}

          {/* No Servers CTA */}
          {stats.totalServers === 0 && (
            <FadeUp>
              <motion.button
                onClick={() => navigate('/mining-servers')}
                className="w-full p-4 rounded-xl border-2 border-dashed border-border flex items-center justify-center gap-2 text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors"
                whileTap={{ scale: 0.98 }}
              >
                <Server className="w-4 h-4" />
                <span className="text-sm font-medium">Get your first server to start mining</span>
              </motion.button>
            </FadeUp>
          )}

        </StaggerContainer>
      </div>
    </PageWrapper>
  );
};

export default Index;
