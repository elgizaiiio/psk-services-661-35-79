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
import { Server, Check, Cpu, HardDrive, Database, Cloud, Globe, Shield, Layers, Play, Users, Loader2, Crown, Gem, Zap, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { PageWrapper } from '@/components/ui/motion-wrapper';
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
    icon: Zap,
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

const tierStyles: Record<string, { icon: string; badge: string; accent: string }> = {
  Free: { icon: 'text-emerald-500', badge: 'bg-emerald-500/10 text-emerald-500', accent: 'border-emerald-500/20' },
  Basic: { icon: 'text-blue-500', badge: 'bg-blue-500/10 text-blue-500', accent: 'border-blue-500/20' },
  Pro: { icon: 'text-violet-500', badge: 'bg-violet-500/10 text-violet-500', accent: 'border-violet-500/20' },
  Elite: { icon: 'text-amber-500', badge: 'bg-amber-500/10 text-amber-500', accent: 'border-amber-500/20' },
  Legendary: { icon: 'text-orange-500', badge: 'bg-orange-500/15 text-orange-500', accent: 'border-orange-500/30' },
  Mythic: { icon: 'text-fuchsia-500', badge: 'bg-fuchsia-500/15 text-fuchsia-500', accent: 'border-fuchsia-500/30' },
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
          toast.success('Free server unlocked!');
        } else {
          toast.success(`${newProgress}/${REQUIRED_ADS} ads watched`);
        }
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
    boltPerDay: ownedServers.reduce((sum, s) => sum + s.daily_bolt_yield, 0),
    usdtPerDay: ownedServers.reduce((sum, s) => sum + s.daily_usdt_yield, 0),
  };

  const freeServerOwned = isOwned('free-starter');
  const isPremium = (tier: string) => tier === 'Legendary' || tier === 'Mythic';

  // Group servers by category
  const freeServers = servers.filter(s => s.tier === 'Free');
  const standardServers = servers.filter(s => s.tier === 'Basic' || s.tier === 'Pro');
  const eliteServers = servers.filter(s => s.tier === 'Elite');
  const premiumServers = servers.filter(s => isPremium(s.tier));

  const ServerCard = ({ server }: { server: MiningServer }) => {
    const owned = isOwned(server.id);
    const stock = getStock(server.id);
    const Icon = server.icon;
    const styles = tierStyles[server.tier];
    const isFreeServer = server.priceTon === 0;
    const premium = isPremium(server.tier);

    return (
      <motion.div
        className={`relative p-4 rounded-xl bg-card/60 backdrop-blur-sm border transition-all ${
          owned ? 'border-primary/40 bg-primary/5' : stock.soldOut ? 'border-border/50 opacity-60' : `border-border/50 hover:border-border`
        } ${premium ? styles.accent : ''}`}
        whileHover={!owned && !stock.soldOut ? { y: -2 } : undefined}
        whileTap={!owned && !stock.soldOut ? { scale: 0.98 } : undefined}
      >
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-secondary/50`}>
            <Icon className={`w-5 h-5 ${styles.icon}`} />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground text-sm truncate">{server.name}</h3>
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${styles.badge}`}>
                {server.tier}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{server.hashRate}</p>
          </div>

          {/* Price & Action */}
          <div className="flex items-center gap-2 shrink-0">
            {owned ? (
              <div className="flex items-center gap-1 text-primary text-xs font-medium">
                <Check className="w-3.5 h-3.5" />
                <span>Owned</span>
              </div>
            ) : stock.soldOut ? (
              <span className="text-xs text-muted-foreground">Sold Out</span>
            ) : (
              <>
                {server.priceTon === 0 ? (
                  <span className="text-sm font-bold text-emerald-500">FREE</span>
                ) : (
                  <div className="flex items-center gap-1">
                    <TonIcon size={14} />
                    <span className="font-bold text-foreground text-sm">{server.priceTon}</span>
                  </div>
                )}
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </>
            )}
          </div>
        </div>

        {/* Earnings Row */}
        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border/30">
          <div className="flex items-center gap-1.5">
            <BoltIcon size={12} />
            <span className="text-xs text-primary font-medium">+{server.boltPerDay.toLocaleString()}/day</span>
          </div>
          <div className="flex items-center gap-1.5">
            <UsdtIcon size={12} />
            <span className="text-xs text-emerald-500 font-medium">+${server.usdtPerDay.toFixed(2)}/day</span>
          </div>
        </div>

        {/* Free Server Unlock Options */}
        {isFreeServer && !owned && !canClaimFreeServer && (
          <div className="flex gap-2 mt-3 pt-3 border-t border-border/30">
            <Button
              onClick={() => navigate('/invite')}
              size="sm"
              variant="outline"
              className="flex-1 h-8 text-xs"
            >
              <Users className="w-3 h-3 mr-1" />
              Invite
            </Button>
            <Button
              onClick={handleWatchAd}
              disabled={isWatchingAd || isAdLoading || !isAdReady}
              size="sm"
              variant="outline"
              className="flex-1 h-8 text-xs"
            >
              {isWatchingAd || isAdLoading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <>
                  <Play className="w-3 h-3 mr-1 fill-current" />
                  {adProgress}/{REQUIRED_ADS}
                </>
              )}
            </Button>
          </div>
        )}

        {/* Clickable Overlay */}
        {!owned && !stock.soldOut && (isFreeServer ? canClaimFreeServer : true) && (
          <button
            onClick={() => handleBuyClick(server)}
            className="absolute inset-0 w-full h-full rounded-xl"
            aria-label={`Buy ${server.name}`}
          />
        )}
      </motion.div>
    );
  };

  const PremiumServerCard = ({ server }: { server: MiningServer }) => {
    const owned = isOwned(server.id);
    const stock = getStock(server.id);
    const Icon = server.icon;
    const styles = tierStyles[server.tier];
    const isMythic = server.tier === 'Mythic';

    return (
      <motion.div
        className={`relative p-5 rounded-2xl bg-card border-2 transition-all overflow-hidden ${
          isMythic ? 'border-fuchsia-500/40' : 'border-orange-500/40'
        } ${owned ? 'opacity-80' : ''}`}
        whileHover={!owned && !stock.soldOut ? { y: -3 } : undefined}
        whileTap={!owned && !stock.soldOut ? { scale: 0.98 } : undefined}
      >
        {/* Subtle Gradient Background */}
        <div className={`absolute inset-0 opacity-5 bg-gradient-to-br ${
          isMythic ? 'from-fuchsia-500 to-purple-600' : 'from-orange-500 to-amber-500'
        }`} />

        <div className="relative">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-secondary/50 border ${styles.accent}`}>
                <Icon className={`w-6 h-6 ${styles.icon}`} />
              </div>
              <div>
                <h3 className="font-bold text-foreground">{server.name}</h3>
                <p className="text-xs text-muted-foreground">{server.hashRate}</p>
              </div>
            </div>
            <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${styles.badge}`}>
              {server.tier}
            </span>
          </div>

          {/* Earnings */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="p-3 rounded-lg bg-secondary/30 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <BoltIcon size={14} />
                <span className="text-sm font-bold text-primary">+{server.boltPerDay.toLocaleString()}</span>
              </div>
              <span className="text-[10px] text-muted-foreground">BOLT/day</span>
            </div>
            <div className="p-3 rounded-lg bg-secondary/30 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <UsdtIcon size={14} />
                <span className="text-sm font-bold text-emerald-500">+${server.usdtPerDay.toFixed(0)}</span>
              </div>
              <span className="text-[10px] text-muted-foreground">USDT/day</span>
            </div>
          </div>

          {/* Features */}
          {server.features && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {server.features.slice(0, 4).map((feature, i) => (
                <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary/50 text-muted-foreground">
                  ✓ {feature}
                </span>
              ))}
            </div>
          )}

          {/* Action */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <TonIcon size={18} />
              <span className="text-lg font-bold text-foreground">{server.priceTon}</span>
            </div>
            
            {owned ? (
              <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/20 text-primary text-xs font-bold">
                <Check className="w-3 h-3" />
                Owned
              </div>
            ) : stock.soldOut ? (
              <span className="text-sm text-muted-foreground">Sold Out</span>
            ) : (
              <Button
                onClick={() => handleBuyClick(server)}
                size="sm"
                className={`h-9 px-5 font-bold ${
                  isMythic 
                    ? 'bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:opacity-90' 
                    : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:opacity-90'
                } text-white`}
              >
                Get Now
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <PageWrapper className="min-h-screen bg-background pb-32">
      <Helmet>
        <title>Mining Servers | Passive Income</title>
        <meta name="description" content="Buy mining servers to earn daily BOLT and USDT rewards." />
        <link rel="canonical" href={`${typeof window !== 'undefined' ? window.location.origin : ''}/mining-servers`} />
      </Helmet>

      <div className="max-w-md mx-auto px-4 pt-6 space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="w-14 h-14 rounded-xl bg-secondary/50 flex items-center justify-center mx-auto mb-3">
            <Cpu className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Mining Servers</h1>
          <p className="text-sm text-muted-foreground mt-1">Earn passive income 24/7</p>
        </div>

        {/* Stats Bar */}
        {totalStats.servers > 0 && (
          <div className="flex items-center justify-center gap-6 py-3 px-4 rounded-xl bg-card/60 border border-border/50">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">{totalStats.servers}</span>
            </div>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center gap-1.5">
              <BoltIcon size={14} />
              <span className="text-sm font-medium text-primary">+{totalStats.boltPerDay.toLocaleString()}/d</span>
            </div>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center gap-1.5">
              <UsdtIcon size={14} />
              <span className="text-sm font-medium text-emerald-500">+${totalStats.usdtPerDay.toFixed(2)}/d</span>
            </div>
          </div>
        )}

        {/* Premium Servers */}
        <section>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Premium</h2>
          <div className="space-y-3">
            {premiumServers.map(server => (
              <PremiumServerCard key={server.id} server={server} />
            ))}
          </div>
        </section>

        {/* Elite Servers */}
        <section>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Elite</h2>
          <div className="space-y-2">
            {eliteServers.map(server => (
              <ServerCard key={server.id} server={server} />
            ))}
          </div>
        </section>

        {/* Standard Servers */}
        <section>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Standard</h2>
          <div className="space-y-2">
            {standardServers.map(server => (
              <ServerCard key={server.id} server={server} />
            ))}
          </div>
        </section>

        {/* Free Server */}
        <section>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Free Tier</h2>
          <div className="space-y-2">
            {freeServers.map(server => (
              <ServerCard key={server.id} server={server} />
            ))}
          </div>
        </section>

        {/* Info */}
        <div className="p-4 rounded-xl bg-secondary/30 border border-border/30">
          <p className="text-xs text-muted-foreground text-center">
            Servers mine 24/7 automatically. Rewards added to your balance daily.
          </p>
        </div>
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
