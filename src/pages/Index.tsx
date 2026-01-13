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
  Sparkles, Users, ChevronRight, Zap, Rocket
} from 'lucide-react';
import { PageWrapper, StaggerContainer, FadeUp, ScaleIn } from '@/components/ui/motion-wrapper';
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

  const handleNavigate = (path: string) => {
    hapticFeedback.impact('light');
    navigate(path);
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

  const isMining = activeMiningSession && new Date() < new Date(activeMiningSession.end_time);

  return (
    <PageWrapper className="min-h-screen bg-background pb-28">
      <Helmet><title>Bolt Mining</title></Helmet>
      <DailyStreakModal />
      <LimitedOfferModal isOpen={showLimitedOffer} onClose={closeLimitedOffer} />

      <div className="max-w-md mx-auto px-4 pt-6 space-y-4">
        
        {/* Header */}
        <StaggerContainer>
          <FadeUp>
            <div className="flex items-center justify-between py-2">
              <motion.button 
                onClick={() => handleNavigate('/profile')} 
                whileTap={{ scale: 0.95 }} 
                className="flex items-center gap-3"
              >
                <UserAvatar user={telegramUser} size="sm" />
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">{telegramUser?.first_name}</p>
                  <p className="text-[10px] text-muted-foreground">Welcome back</p>
                </div>
              </motion.button>
              {!isConnected ? (
                <Button 
                  onClick={() => connectWallet()} 
                  disabled={isConnecting} 
                  size="sm" 
                  variant="outline" 
                  className="h-9 px-4 text-xs rounded-full gap-1.5"
                >
                  <Wallet className="w-3.5 h-3.5" />
                  Connect
                </Button>
              ) : (
                <motion.button 
                  onClick={() => handleNavigate('/wallet')} 
                  whileTap={{ scale: 0.95 }}
                  className="h-9 px-4 rounded-full bg-primary/10 text-primary text-xs font-medium flex items-center gap-1.5"
                >
                  <Wallet className="w-3.5 h-3.5" /> Wallet
                </motion.button>
              )}
            </div>
          </FadeUp>
        </StaggerContainer>

        {/* Banner */}
        <FadeUp delay={0.1}>
          <PromoBanner />
        </FadeUp>

        {/* Quick Actions Grid */}
        <FadeUp delay={0.15}>
          <div className="grid grid-cols-4 gap-2">
            {[
              { icon: Gift, label: '$100', path: '/daily-contest', gradient: 'from-emerald-500/20 to-teal-500/20', iconColor: 'text-emerald-500' },
              { icon: Sparkles, label: 'Spin', path: '/spin', gradient: 'from-purple-500/20 to-pink-500/20', iconColor: 'text-purple-500' },
              { icon: Server, label: 'Servers', path: '/mining-servers', gradient: 'from-sky-500/20 to-blue-500/20', iconColor: 'text-sky-500' },
              { icon: Trophy, label: 'Top', path: '/leaderboard', gradient: 'from-amber-500/20 to-orange-500/20', iconColor: 'text-amber-500' },
            ].map((item, index) => (
              <ScaleIn key={item.label} delay={0.2 + index * 0.05}>
                <motion.button 
                  onClick={() => handleNavigate(item.path)}
                  className={`flex flex-col items-center gap-2 py-4 rounded-2xl bg-gradient-to-br ${item.gradient} border border-border/50 w-full`}
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ y: -2 }}
                >
                  <item.icon className={`w-5 h-5 ${item.iconColor}`} />
                  <span className="text-[11px] font-medium text-foreground">{item.label}</span>
                </motion.button>
              </ScaleIn>
            ))}
          </div>
        </FadeUp>

        {/* Beginner Box - Get Started */}
        {stats.totalServers === 0 && (
          <FadeUp delay={0.25}>
            <motion.div 
              className="p-5 rounded-2xl bg-gradient-to-br from-primary/5 via-card to-accent/5 border border-primary/20 relative overflow-hidden"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => handleNavigate('/mining-servers')}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Rocket className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Start Mining Now</p>
                    <p className="text-xs text-muted-foreground">Get your first server</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">Free Starter</span>
                    <span className="text-xs text-muted-foreground">Available</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            </motion.div>
          </FadeUp>
        )}

        {/* Mining Active Card */}
        {isMining && miningProgress && (
          <FadeUp delay={0.25}>
            <motion.div 
              className="p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-xs font-medium text-foreground">Mining Active</span>
                </div>
                <span className="text-xs font-semibold text-primary">
                  {Math.round(miningProgress.progress * 100)}%
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-background overflow-hidden">
                <motion.div 
                  className="h-full bg-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${miningProgress.progress * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-center mt-2">
                +{miningProgress.tokensMinedSoFar.toFixed(1)} BOLT this session
              </p>
            </motion.div>
          </FadeUp>
        )}

        {/* CTA Cards */}
        <StaggerContainer className="space-y-3">
          <FadeUp delay={0.3}>
            <motion.button 
              onClick={() => handleNavigate('/invite')} 
              whileTap={{ scale: 0.98 }}
              whileHover={{ y: -2 }}
              className="w-full p-4 rounded-2xl bg-card border border-border flex items-center gap-3"
            >
              <div className="w-11 h-11 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-purple-500" />
              </div>
              <div className="text-left flex-1">
                <p className="text-sm font-semibold text-foreground">Invite & Earn</p>
                <p className="text-xs text-muted-foreground">15% of friends' earnings</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </motion.button>
          </FadeUp>

          <FadeUp delay={0.35}>
            <motion.button 
              onClick={() => handleNavigate('/vip')} 
              whileTap={{ scale: 0.98 }}
              whileHover={{ y: -2 }}
              className="w-full p-4 rounded-2xl bg-card border border-border flex items-center gap-3"
            >
              <div className="w-11 h-11 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                <Crown className="w-5 h-5 text-amber-500" />
              </div>
              <div className="text-left flex-1">
                <p className="text-sm font-semibold text-foreground">VIP Status</p>
                <p className="text-xs text-muted-foreground">2x mining power</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </motion.button>
          </FadeUp>

          <FadeUp delay={0.4}>
            <motion.button 
              onClick={() => handleNavigate('/tasks')} 
              whileTap={{ scale: 0.98 }}
              whileHover={{ y: -2 }}
              className="w-full p-4 rounded-2xl bg-card border border-border flex items-center gap-3"
            >
              <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                <Gift className="w-5 h-5 text-emerald-500" />
              </div>
              <div className="text-left flex-1">
                <p className="text-sm font-semibold text-foreground">Daily Tasks</p>
                <p className="text-xs text-muted-foreground">Earn free BOLT</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </motion.button>
          </FadeUp>
        </StaggerContainer>

        {/* Start Mining Button - Only show if has servers and not mining */}
        {stats.totalServers > 0 && !isMining && (
          <FadeUp delay={0.45}>
            <motion.div whileTap={{ scale: 0.98 }}>
              <Button 
                onClick={handleStartMining} 
                className="w-full h-14 rounded-2xl font-semibold gap-2 text-base"
              >
                <Play className="w-5 h-5" /> Start Mining
              </Button>
            </motion.div>
          </FadeUp>
        )}

      </div>
    </PageWrapper>
  );
};

export default Index;