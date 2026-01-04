import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useViralMining } from '@/hooks/useViralMining';
import { useUserServers } from '@/hooks/useUserServers';
import { useTelegramBackButton } from '@/hooks/useTelegramBackButton';
import { useAdsGramRewarded } from '@/hooks/useAdsGramRewarded';
import { supabase } from '@/integrations/supabase/client';
import { Server, Check, Cpu, Activity, TrendingUp, HardDrive, Database, Cloud, Wifi, Globe, Shield, Layers, Play, Users, Loader2, Crown, Gem, Sparkles, Star, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { PageWrapper, FadeUp, StaggerContainer } from '@/components/ui/motion-wrapper';
import { BoltIcon, UsdtIcon, TonIcon } from '@/components/ui/currency-icons';
import { UnifiedPaymentModal } from '@/components/payment/UnifiedPaymentModal';
import { useNavigate } from 'react-router-dom';

type MiningServer = {
  id: string;
  name: string;
  hashRate: string;
  boltPerDay: number;
  usdtPerDay: number;
  priceTon: number;
  tier: 'Free' | 'Basic' | 'Pro' | 'Elite' | 'Legendary' | 'Mythic';
  icon: React.ElementType;
  features?: string[];
};

const servers: MiningServer[] = [
  { 
    id: 'free-starter', 
    name: 'Free Starter', 
    hashRate: '1 TH/s', 
    boltPerDay: 50, 
    usdtPerDay: 0.05, 
    priceTon: 0, 
    tier: 'Free',
    icon: Wifi,
  },
  { 
    id: 'basic-1', 
    name: 'Starter Pro', 
    hashRate: '5 TH/s', 
    boltPerDay: 250, 
    usdtPerDay: 0.25, 
    priceTon: 1.5, 
    tier: 'Basic',
    icon: HardDrive,
  },
  { 
    id: 'basic-2', 
    name: 'Basic Server', 
    hashRate: '10 TH/s', 
    boltPerDay: 500, 
    usdtPerDay: 0.50, 
    priceTon: 2.5, 
    tier: 'Basic',
    icon: Database,
  },
  { 
    id: 'pro-1', 
    name: 'Pro Server', 
    hashRate: '25 TH/s', 
    boltPerDay: 1250, 
    usdtPerDay: 1.25, 
    priceTon: 5.0, 
    tier: 'Pro',
    icon: Cloud,
  },
  { 
    id: 'pro-2', 
    name: 'Advanced Pro', 
    hashRate: '50 TH/s', 
    boltPerDay: 2500, 
    usdtPerDay: 2.50, 
    priceTon: 9.0, 
    tier: 'Pro',
    icon: Globe,
  },
  { 
    id: 'elite-1', 
    name: 'Elite Server', 
    hashRate: '100 TH/s', 
    boltPerDay: 5000, 
    usdtPerDay: 5.00, 
    priceTon: 16.0, 
    tier: 'Elite',
    icon: Shield,
  },
  { 
    id: 'elite-2', 
    name: 'Ultra Elite', 
    hashRate: '200 TH/s', 
    boltPerDay: 10000, 
    usdtPerDay: 10.00, 
    priceTon: 30.0, 
    tier: 'Elite',
    icon: Layers,
  },
  { 
    id: 'legendary-1', 
    name: 'Legendary Server', 
    hashRate: '500 TH/s', 
    boltPerDay: 25000, 
    usdtPerDay: 25.00, 
    priceTon: 50.0, 
    tier: 'Legendary',
    icon: Crown,
    features: ['Priority Support', '2x Mining Speed', 'VIP Badge', 'Early Access'],
  },
  { 
    id: 'mythic-1', 
    name: 'Mythic Server', 
    hashRate: '1000 TH/s', 
    boltPerDay: 60000, 
    usdtPerDay: 60.00, 
    priceTon: 100.0, 
    tier: 'Mythic',
    icon: Gem,
    features: ['24/7 Priority Support', '3x Mining Speed', 'Exclusive VIP Badge', 'Early Access', 'Bonus Multiplier', 'Limited Edition'],
  },
];

const tierConfig: Record<string, { color: string; bg: string; border: string; glow?: string; gradient?: string }> = {
  Free: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  Basic: { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  Pro: { color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20' },
  Elite: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  Legendary: { 
    color: 'text-orange-400', 
    bg: 'bg-gradient-to-r from-orange-500/20 to-yellow-500/20', 
    border: 'border-orange-500/40',
    glow: 'shadow-lg shadow-orange-500/30',
    gradient: 'from-orange-500 to-yellow-500'
  },
  Mythic: { 
    color: 'text-fuchsia-400', 
    bg: 'bg-gradient-to-r from-fuchsia-500/20 to-purple-500/20', 
    border: 'border-fuchsia-500/40',
    glow: 'shadow-xl shadow-fuchsia-500/40',
    gradient: 'from-fuchsia-500 to-purple-500'
  },
};

const REQUIRED_ADS = 5;

const MiningServers = () => {
  const { user: telegramUser, isLoading: isTelegramLoading, hapticFeedback } = useTelegramAuth();
  const { user, loading: isMiningUserLoading } = useViralMining(telegramUser);
  const { servers: ownedServers, purchaseServer, getStock } = useUserServers(user?.id || null);
  const [selectedServer, setSelectedServer] = useState<MiningServer | null>(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [adProgress, setAdProgress] = useState(0);
  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const [adUnlocked, setAdUnlocked] = useState(false);
  
  const { showAd, isLoading: isAdLoading, isReady: isAdReady } = useAdsGramRewarded();
  const navigate = useNavigate();
  useTelegramBackButton();

  const isReady = !isTelegramLoading && !isMiningUserLoading;
  const hasReferral = (user?.total_referrals ?? 0) >= 1;
  const canClaimFreeServer = hasReferral || adUnlocked;

  // Fetch ad progress
  const fetchAdProgress = useCallback(async () => {
    if (!user?.id) return;
    
    const { data } = await supabase
      .from('free_server_ad_progress' as any)
      .select('ads_watched, unlocked_at')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      setAdProgress((data as any).ads_watched || 0);
      setAdUnlocked(!!(data as any).unlocked_at);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchAdProgress();
  }, [fetchAdProgress]);

  // Watch ad for free server
  const handleWatchAd = async () => {
    if (!user?.id || !isAdReady) {
      toast.error('Ads not available');
      return;
    }

    setIsWatchingAd(true);
    try {
      const adWatched = await showAd();
      if (adWatched) {
        const newProgress = adProgress + 1;
        
        // Upsert progress
        const { error } = await supabase
          .from('free_server_ad_progress' as any)
          .upsert({
            user_id: user.id,
            ads_watched: newProgress,
            unlocked_at: newProgress >= REQUIRED_ADS ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' });

        if (error) throw error;

        setAdProgress(newProgress);
        
        if (newProgress >= REQUIRED_ADS) {
          setAdUnlocked(true);
          toast.success('🎉 Free server unlocked! You can now claim it.');
        } else {
          toast.success(`Ad watched! ${newProgress}/${REQUIRED_ADS} - ${REQUIRED_ADS - newProgress} more to go`);
        }
      } else {
        toast.error('Watch the full ad to count');
      }
    } catch (error) {
      console.error('Ad error:', error);
      toast.error('Something went wrong');
    } finally {
      setIsWatchingAd(false);
    }
  };

  const handleBuyClick = async (server: MiningServer) => {
    if (!isReady || !user?.id) return;

    hapticFeedback?.impact?.('medium');

    const stock = getStock(server.id);
    if (stock.soldOut) {
      toast.error('Sold out!');
      return;
    }

    if (server.priceTon === 0) {
      if (!canClaimFreeServer) {
        toast.error('Invite 1 friend or watch 5 ads to unlock');
        return;
      }

      await purchaseServer(
        server.id,
        server.tier,
        server.name,
        server.hashRate,
        server.boltPerDay,
        server.usdtPerDay
      );
      toast.success('Free server claimed!');
      return;
    }

    setSelectedServer(server);
    setIsPaymentOpen(true);
  };

  const handlePaymentSuccess = async () => {
    if (selectedServer && user?.id) {
      await purchaseServer(
        selectedServer.id,
        selectedServer.tier,
        selectedServer.name,
        selectedServer.hashRate,
        selectedServer.boltPerDay,
        selectedServer.usdtPerDay
      );
      toast.success('Server purchased!');
    }
    setSelectedServer(null);
  };

  const isOwned = (serverId: string) =>
    ownedServers.some((s) => s.server_name === servers.find((srv) => srv.id === serverId)?.name);

  const totalStats = {
    servers: ownedServers.length,
    hashRate: ownedServers.reduce((sum, s) => sum + parseFloat(s.hash_rate), 0),
    boltPerDay: ownedServers.reduce((sum, s) => sum + s.daily_bolt_yield, 0),
    usdtPerDay: ownedServers.reduce((sum, s) => sum + s.daily_usdt_yield, 0),
  };

  const freeServerOwned = isOwned('free-starter');

  return (
    <PageWrapper className="min-h-screen bg-background pb-32">
      <Helmet>
        <title>Mining Servers | Passive Income</title>
        <meta name="description" content="Buy mining servers to earn daily BOLT and USDT rewards." />
        <link rel="canonical" href={`${typeof window !== 'undefined' ? window.location.origin : ''}/mining-servers`} />
        <meta property="og:title" content="Mining Servers" />
        <meta property="og:description" content="Buy mining servers to earn daily rewards." />
        <meta property="og:type" content="website" />
      </Helmet>

      <div className="max-w-md mx-auto px-4 pt-6">
        <StaggerContainer className="space-y-5">
          {/* Header */}
          <FadeUp>
            <div className="text-center mb-2">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-4">
                <Cpu className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">Mining Servers</h1>
              <p className="text-sm text-muted-foreground mt-1">Earn passive income 24/7</p>
            </div>
          </FadeUp>

          {/* Stats Overview */}
          {totalStats.servers > 0 && (
            <FadeUp>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-card border border-border text-center">
                  <Activity className="w-5 h-5 text-primary mx-auto mb-1" />
                  <p className="text-lg font-bold text-foreground">{totalStats.servers}</p>
                  <p className="text-[10px] text-muted-foreground">Servers</p>
                </div>
                <div className="p-3 rounded-xl bg-card border border-border text-center">
                  <BoltIcon size={20} className="mx-auto mb-1" />
                  <p className="text-lg font-bold text-primary">+{totalStats.boltPerDay}</p>
                  <p className="text-[10px] text-muted-foreground">BOLT/day</p>
                </div>
                <div className="p-3 rounded-xl bg-card border border-border text-center">
                  <UsdtIcon size={20} className="mx-auto mb-1" />
                  <p className="text-lg font-bold text-emerald-400">+${totalStats.usdtPerDay.toFixed(2)}</p>
                  <p className="text-[10px] text-muted-foreground">USDT/day</p>
                </div>
              </div>
            </FadeUp>
          )}

          {/* Server Grid */}
          <div className="space-y-3">
            {servers.map((server, index) => {
                const owned = isOwned(server.id);
                const stock = getStock(server.id);
                const Icon = server.icon;
                const config = tierConfig[server.tier];
                const isFreeServer = server.priceTon === 0;
                const isPremium = server.tier === 'Legendary' || server.tier === 'Mythic';

                return (
                  <FadeUp key={server.id}>
                  <motion.div
                    className={`relative p-4 rounded-2xl bg-card border transition-all ${
                      isPremium 
                        ? `${config.border} ${config.glow} bg-gradient-to-br from-card via-card to-card`
                        : owned ? 'border-primary/30 opacity-80' : stock.soldOut ? 'border-border opacity-50' : 'border-border hover:border-primary/30'
                    }`}
                    whileHover={!owned && !stock.soldOut ? { scale: 1.02 } : undefined}
                    whileTap={!owned && !stock.soldOut ? { scale: 0.98 } : undefined}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                      {/* Premium Badge */}
                      {isPremium && (
                        <div className="absolute -top-2 -right-2 z-10">
                          <span className={`px-2 py-1 text-[10px] font-black rounded-full bg-gradient-to-r ${config.gradient} text-white shadow-lg flex items-center gap-1`}>
                            {server.tier === 'Mythic' ? (
                              <>
                                <Sparkles className="w-3 h-3" />
                                LIMITED
                              </>
                            ) : (
                              <>
                                <Star className="w-3 h-3 fill-current" />
                                EXCLUSIVE
                              </>
                            )}
                          </span>
                        </div>
                      )}

                      {/* Glowing Border Effect for Premium */}
                      {isPremium && (
                        <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${config.gradient} opacity-10 pointer-events-none`} />
                      )}

                      <div className="flex items-start gap-4 relative">
                        {/* Icon */}
                        <div className={`${isPremium ? 'w-14 h-14' : 'w-12 h-12'} rounded-xl flex items-center justify-center shrink-0 ${config.bg} ${isPremium ? 'ring-2 ring-offset-2 ring-offset-card' : ''}`}
                          style={isPremium ? { '--tw-ring-color': server.tier === 'Mythic' ? 'rgb(217 70 239 / 0.5)' : 'rgb(249 115 22 / 0.5)' } as React.CSSProperties : {}}
                        >
                          <Icon className={`${isPremium ? 'w-7 h-7' : 'w-6 h-6'} ${config.color}`} />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className={`font-bold text-foreground ${isPremium ? 'text-base' : 'text-sm'}`}>{server.name}</h3>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isPremium ? `bg-gradient-to-r ${config.gradient} text-white` : `${config.bg} ${config.color}`}`}>
                              {server.tier}
                            </span>
                            {isPremium && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 animate-pulse">
                                🔥 HOT
                              </span>
                            )}
                          </div>

                          <p className={`text-xs text-muted-foreground mb-1 ${isPremium ? 'font-semibold' : ''}`}>
                            {server.hashRate}
                            {isPremium && <span className="ml-2 text-emerald-400">⚡ Ultra Fast</span>}
                          </p>
                          
                          {/* Free Server Special Text */}
                          {isFreeServer && !owned && (
                            <p className="text-[11px] text-muted-foreground mb-3">
                              First 100 users • Invite 1 friend OR watch 5 ads
                            </p>
                          )}

                          {/* Earnings */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${isPremium ? 'bg-primary/20' : 'bg-primary/10'}`}>
                              <BoltIcon size={14} />
                              <span className={`text-xs font-semibold text-primary ${isPremium ? 'text-sm' : ''}`}>+{server.boltPerDay.toLocaleString()}/day</span>
                            </div>
                            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${isPremium ? 'bg-emerald-500/20' : 'bg-emerald-500/10'}`}>
                              <UsdtIcon size={14} />
                              <span className={`text-xs font-semibold text-emerald-400 ${isPremium ? 'text-sm' : ''}`}>+${server.usdtPerDay.toFixed(2)}</span>
                            </div>
                          </div>

                          {/* Premium Features */}
                          {isPremium && server.features && (
                            <div className="mt-3 flex flex-wrap gap-1.5">
                              {server.features.slice(0, 4).map((feature, i) => (
                                <span key={i} className={`text-[9px] px-2 py-0.5 rounded-full bg-gradient-to-r ${config.gradient} text-white/90`}>
                                  ✓ {feature}
                                </span>
                              ))}
                              {server.features.length > 4 && (
                                <span className="text-[9px] px-2 py-0.5 rounded-full bg-white/10 text-muted-foreground">
                                  +{server.features.length - 4} more
                                </span>
                              )}
                            </div>
                          )}

                          {/* Free Server Unlock Options */}
                          {isFreeServer && !owned && !canClaimFreeServer && (
                            <div className="flex gap-2 mt-3">
                              <Button
                                onClick={() => navigate('/invite')}
                                size="sm"
                                variant="outline"
                                className="flex-1 h-8 text-xs border-primary/30 text-primary"
                              >
                                <Users className="w-3 h-3 mr-1" />
                                Invite Friend
                              </Button>
                              <Button
                                onClick={handleWatchAd}
                                disabled={isWatchingAd || isAdLoading || !isAdReady}
                                size="sm"
                                variant="outline"
                                className="flex-1 h-8 text-xs border-emerald-500/30 text-emerald-400"
                              >
                                {isWatchingAd || isAdLoading ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <>
                                    <Play className="w-3 h-3 mr-1 fill-current" />
                                    Ad ({adProgress}/{REQUIRED_ADS})
                                  </>
                                )}
                              </Button>
                            </div>
                          )}
                        </div>

                        {/* Price & Action */}
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          {server.priceTon === 0 ? (
                            <span className="text-lg font-black text-emerald-400">FREE</span>
                          ) : (
                            <div className="flex items-center gap-1">
                              <TonIcon size={isPremium ? 20 : 16} />
                              <span className={`font-black text-foreground ${isPremium ? 'text-xl' : 'text-lg'}`}>{server.priceTon}</span>
                            </div>
                          )}

                          {owned ? (
                            <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/20 text-primary text-xs font-bold">
                              <Check className="w-3 h-3" />
                              Owned
                            </div>
                          ) : stock.soldOut ? (
                            <span className="text-xs text-muted-foreground">Sold Out</span>
                          ) : isFreeServer && !canClaimFreeServer ? null : (
                            <Button
                              onClick={() => handleBuyClick(server)}
                              size="sm"
                              className={`h-8 px-4 font-bold text-xs ${isPremium ? `bg-gradient-to-r ${config.gradient} hover:opacity-90 text-white shadow-lg` : ''}`}
                            >
                              {server.priceTon === 0 ? 'Claim' : isPremium ? '🔥 Buy Now' : 'Buy'}
                            </Button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  </FadeUp>
                );
              })}
          </div>

          {/* Info Card */}
          <FadeUp>
            <div className="p-4 rounded-2xl bg-gradient-to-r from-primary/5 to-transparent border border-primary/10">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <span className="font-semibold text-foreground text-sm">How it works</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Servers mine 24/7 automatically. BOLT and USDT rewards are added to your balance daily. Higher tier servers = more earnings!
              </p>
            </div>
          </FadeUp>
        </StaggerContainer>
      </div>

      {/* Payment Modal */}
      {selectedServer && (
        <UnifiedPaymentModal
          isOpen={isPaymentOpen}
          onClose={() => {
            setIsPaymentOpen(false);
            setSelectedServer(null);
          }}
          amount={selectedServer.priceTon}
          description={selectedServer.name}
          productType="server_hosting"
          productId={selectedServer.id}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </PageWrapper>
  );
};

export default MiningServers;