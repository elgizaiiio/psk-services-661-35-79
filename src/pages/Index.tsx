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
import { Server, Loader2, Play, Gift, ShoppingCart, Trophy, Crown, User, type LucideIcon } from 'lucide-react';
import { PageWrapper, StaggerContainer, FadeUp, AnimatedNumber, AnimatedProgress, LiveNumber } from '@/components/ui/motion-wrapper';
import { BoltIcon, UsdtIcon } from '@/components/ui/currency-icons';
import DailyStreakModal from '@/components/DailyStreakModal';
import UserAvatar from '@/components/UserAvatar';
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  path: string;
  badge?: string;
  gradient: string;
  iconBg: string;
  iconColor: string;
}

const Index = () => {
  const navigate = useNavigate();
  const { user: telegramUser, isLoading: authLoading, hapticFeedback } = useTelegramAuth();
  const { user, activeMiningSession, loading, error, startMining, miningProgress, clearError } = useBoltMining(telegramUser);
  const { isConnected, isConnecting, connectWallet } = useTelegramTonConnect();
  const { getTotalStats } = useUserServers(user?.id || null);
  const stats = getTotalStats();
  useTelegramBackButton();

  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const autoplayPlugin = useRef(
    Autoplay({ delay: 3000, stopOnInteraction: false, stopOnMouseEnter: true })
  );

  const quickActions: QuickAction[] = [
    {
      id: 'spin',
      title: 'Lucky Spin',
      description: 'Win TON, USDT and more',
      icon: Gift,
      path: '/spin',
      badge: 'Free Daily',
      gradient: 'bg-gradient-to-br from-primary/15 to-primary/5',
      iconBg: 'bg-primary/20',
      iconColor: 'text-primary',
    },
    {
      id: 'vip',
      title: 'Premium VIP',
      description: 'Unlock all benefits',
      icon: Crown,
      path: '/vip',
      gradient: 'bg-gradient-to-br from-amber-500/15 to-amber-500/5',
      iconBg: 'bg-amber-500/20',
      iconColor: 'text-amber-500',
    },
    {
      id: 'servers',
      title: 'My Servers',
      description: stats.totalServers > 0 ? `${stats.totalServers} servers • ${stats.totalHashRate} TH/s` : 'No servers yet',
      icon: Server,
      path: '/mining-servers',
      gradient: 'bg-gradient-to-br from-emerald-500/15 to-emerald-500/5',
      iconBg: 'bg-emerald-500/20',
      iconColor: 'text-emerald-500',
    },
    {
      id: 'buy',
      title: 'Buy BOLT',
      description: 'Get more tokens instantly',
      icon: ShoppingCart,
      path: '/buy-bolt',
      gradient: 'bg-gradient-to-br from-blue-500/15 to-blue-500/5',
      iconBg: 'bg-blue-500/20',
      iconColor: 'text-blue-500',
    },
    {
      id: 'contest',
      title: 'Contest',
      description: 'Compete & win prizes',
      icon: Trophy,
      path: '/contest',
      badge: 'Live',
      gradient: 'bg-gradient-to-br from-purple-500/15 to-purple-500/5',
      iconBg: 'bg-purple-500/20',
      iconColor: 'text-purple-500',
    },
  ];

  const onSelect = useCallback(() => {
    if (!carouselApi) return;
    setCurrentSlide(carouselApi.selectedScrollSnap());
  }, [carouselApi]);

  useEffect(() => {
    if (!carouselApi) return;
    onSelect();
    carouselApi.on('select', onSelect);
    return () => {
      carouselApi.off('select', onSelect);
    };
  }, [carouselApi, onSelect]);

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

  // Show message if user is outside Telegram
  if (!telegramUser?.id) {
    return (
      <main className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Loader2 className="w-12 h-12 text-muted-foreground mb-4" />
        <p className="text-lg text-muted-foreground text-center mb-4">
          Please open the app from Telegram
        </p>
        <a 
          href="https://t.me/BoltMiningBot" 
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
              <div className="flex items-center gap-3">
                <motion.button
                  onClick={() => navigate('/profile')}
                  whileTap={{ scale: 0.95 }}
                  className="relative"
                >
                  <UserAvatar user={telegramUser} size="md" />
                </motion.button>
                <div>
                  <h1 className="text-xl font-semibold text-foreground">Hey, {telegramUser?.first_name || 'Miner'}</h1>
                  <p className="text-sm text-muted-foreground">Welcome back</p>
                </div>
              </div>
              {!isConnected ? (
                <motion.div whileTap={{ scale: 0.95 }}>
                  <Button onClick={() => connectWallet()} disabled={isConnecting} size="sm" variant="outline" className="text-xs h-9">
                    {isConnecting ? "..." : "Connect"}
                  </Button>
                </motion.div>
              ) : (
                <motion.div whileTap={{ scale: 0.95 }}>
                  <Button onClick={() => navigate('/profile')} size="sm" variant="outline" className="text-xs h-9 gap-1">
                    <User className="w-3.5 h-3.5" />
                    Profile
                  </Button>
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
                <p className="text-xl font-semibold text-foreground">
                  <LiveNumber 
                    value={boltBalance + (miningProgress?.tokensMinedSoFar || 0)} 
                    incrementPerSecond={isMining ? (activeMiningSession?.tokens_per_hour || 0) / 3600 : 0}
                    isActive={!!isMining}
                    decimals={2} 
                  />
                </p>
                {stats.totalBoltPerDay > 0 && <p className="text-xs text-primary mt-1">+{stats.totalBoltPerDay}/day</p>}
              </motion.div>
            </FadeUp>
            
            <FadeUp>
              <motion.div className="p-4 rounded-xl bg-card border border-border" whileTap={{ scale: 0.98 }}>
                <div className="flex items-center gap-2 mb-2">
                  <UsdtIcon size={32} />
                  <span className="text-xs text-muted-foreground">USDT</span>
                </div>
                <p className="text-xl font-semibold text-foreground">
                  <LiveNumber 
                    value={usdtBalance + ((miningProgress?.tokensMinedSoFar || 0) * 0.001)} 
                    incrementPerSecond={isMining ? ((activeMiningSession?.tokens_per_hour || 0) / 3600) * 0.001 : 0}
                    isActive={!!isMining}
                    decimals={4} 
                  />
                </p>
                {stats.totalUsdtPerDay > 0 && <p className="text-xs text-primary mt-1">+${stats.totalUsdtPerDay.toFixed(4)}/day</p>}
              </motion.div>
            </FadeUp>
          </div>

          {/* Quick Actions Carousel */}
          <FadeUp>
            <div className="space-y-3">
              <Carousel
                opts={{ align: "start", dragFree: true, loop: true }}
                className="w-full"
                setApi={setCarouselApi}
                plugins={[autoplayPlugin.current]}
              >
                <CarouselContent className="-ml-3">
                  {quickActions.map((action) => (
                    <CarouselItem key={action.id} className="pl-3 basis-[280px]">
                      <motion.button
                        onClick={() => {
                          hapticFeedback.impact('light');
                          navigate(action.path);
                        }}
                        className={`w-full h-[120px] p-4 rounded-2xl ${action.gradient} border border-border/50 flex flex-col justify-between text-left relative overflow-hidden`}
                        whileTap={{ scale: 0.97 }}
                        whileHover={{ scale: 1.02 }}
                      >
                        <div className="flex items-start justify-between">
                          <div className={`w-11 h-11 rounded-xl ${action.iconBg} flex items-center justify-center`}>
                            <action.icon className={`w-5 h-5 ${action.iconColor}`} />
                          </div>
                          {action.badge && (
                            <span className="text-[10px] font-semibold text-primary-foreground bg-primary px-2 py-0.5 rounded-full">
                              {action.badge}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground text-sm">{action.title}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">{action.description}</p>
                        </div>
                      </motion.button>
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>

              {/* Pagination Dots */}
              <div className="flex justify-center gap-1.5">
                {quickActions.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => carouselApi?.scrollTo(index)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      currentSlide === index 
                        ? 'w-6 bg-primary' 
                        : 'w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                    }`}
                  />
                ))}
              </div>
            </div>
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

        </StaggerContainer>
      </div>
    </PageWrapper>
  );
};

export default Index;