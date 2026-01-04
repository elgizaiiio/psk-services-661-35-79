import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useViralMining } from '@/hooks/useViralMining';
import { useUserServers } from '@/hooks/useUserServers';
import { useTelegramBackButton } from '@/hooks/useTelegramBackButton';
import { useAdsGramRewarded } from '@/hooks/useAdsGramRewarded';
import { supabase } from '@/integrations/supabase/client';
import { Server, Check, Cpu, HardDrive, Database, Cloud, Globe, Shield, Layers, Play, Users, Loader2, Crown, Gem, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { PageWrapper } from '@/components/ui/motion-wrapper';
import { BoltIcon, UsdtIcon, TonIcon } from '@/components/ui/currency-icons';
import { UnifiedPaymentModal } from '@/components/payment/UnifiedPaymentModal';
import { useNavigate } from 'react-router-dom';
import CircuitAnimation from '@/components/mining/CircuitAnimation';
import TimelineTraceAnimation from '@/components/mining/TimelineTraceAnimation';

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
  { id: 'free-starter', name: 'Free Starter', hashRate: '1 TH/s', boltPerDay: 50, usdtPerDay: 0.05, priceTon: 0, tier: 'Free', icon: Zap },
  { id: 'basic-1', name: 'Starter Pro', hashRate: '5 TH/s', boltPerDay: 250, usdtPerDay: 0.25, priceTon: 1.5, tier: 'Basic', icon: HardDrive },
  { id: 'basic-2', name: 'Basic Server', hashRate: '10 TH/s', boltPerDay: 500, usdtPerDay: 0.50, priceTon: 2.5, tier: 'Basic', icon: Database },
  { id: 'pro-1', name: 'Pro Server', hashRate: '25 TH/s', boltPerDay: 1250, usdtPerDay: 1.25, priceTon: 5.0, tier: 'Pro', icon: Cloud },
  { id: 'pro-2', name: 'Advanced Pro', hashRate: '50 TH/s', boltPerDay: 2500, usdtPerDay: 2.50, priceTon: 9.0, tier: 'Pro', icon: Globe },
  { id: 'elite-1', name: 'Elite Server', hashRate: '100 TH/s', boltPerDay: 5000, usdtPerDay: 5.00, priceTon: 16.0, tier: 'Elite', icon: Shield },
  { id: 'elite-2', name: 'Ultra Elite', hashRate: '200 TH/s', boltPerDay: 10000, usdtPerDay: 10.00, priceTon: 30.0, tier: 'Elite', icon: Layers },
  { id: 'legendary-1', name: 'Legendary Server', hashRate: '500 TH/s', boltPerDay: 25000, usdtPerDay: 25.00, priceTon: 50.0, tier: 'Legendary', icon: Crown, features: ['Priority Support', '2x Mining Speed', 'VIP Badge', 'Early Access'] },
  { id: 'mythic-1', name: 'Mythic Server', hashRate: '1000 TH/s', boltPerDay: 60000, usdtPerDay: 60.00, priceTon: 100.0, tier: 'Mythic', icon: Gem, features: ['24/7 Priority Support', '3x Mining Speed', 'Exclusive VIP Badge', 'Early Access', 'Bonus Multiplier', 'Limited Edition'] },
];

const tierColors: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  Free: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500/30', glow: 'shadow-emerald-500/20' },
  Basic: { bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/30', glow: 'shadow-blue-500/20' },
  Pro: { bg: 'bg-violet-500/10', text: 'text-violet-500', border: 'border-violet-500/30', glow: 'shadow-violet-500/20' },
  Elite: { bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500/30', glow: 'shadow-amber-500/20' },
  Legendary: { bg: 'bg-orange-500/15', text: 'text-orange-500', border: 'border-orange-500/40', glow: 'shadow-orange-500/30' },
  Mythic: { bg: 'bg-fuchsia-500/15', text: 'text-fuchsia-500', border: 'border-fuchsia-500/40', glow: 'shadow-fuchsia-500/30' },
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
  const timelineRef = useRef<HTMLDivElement>(null);
  
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
      await purchaseServer(server.id, server.tier, server.name, server.hashRate, server.boltPerDay, server.usdtPerDay);
      toast.success('Free server claimed!');
      return;
    }
    setSelectedServer(server);
    setIsPaymentOpen(true);
  };

  const handlePaymentSuccess = async () => {
    if (selectedServer && user?.id) {
      await purchaseServer(selectedServer.id, selectedServer.tier, selectedServer.name, selectedServer.hashRate, selectedServer.boltPerDay, selectedServer.usdtPerDay);
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

  // Calculate timeline progress
  const sortedServers = [...servers].sort((a, b) => a.priceTon - b.priceTon);
  const lastOwnedIndex = sortedServers.reduce((lastIdx, server, idx) => 
    isOwned(server.id) ? idx : lastIdx, -1);
  const progressPercent = lastOwnedIndex >= 0 
    ? ((lastOwnedIndex + 1) / sortedServers.length) * 100 
    : 0;

  const renderTimelineNode = (server: MiningServer, index: number) => {
    const owned = isOwned(server.id);
    const stock = getStock(server.id);
    const Icon = server.icon;
    const colors = tierColors[server.tier];
    const isFreeServer = server.priceTon === 0;
    const isNext = !owned && index === lastOwnedIndex + 1;

    return (
      <div
        key={server.id}
        className={`p-3 rounded-xl border transition-all ${
          owned 
            ? `${colors.bg} ${colors.border}` 
            : stock.soldOut 
              ? 'bg-card/30 border-border/20 opacity-40'
              : isNext
                ? 'bg-card/70 border-primary/30 hover:bg-card'
                : 'bg-card/50 border-border/30 hover:bg-card/70'
        }`}
        onClick={() => !owned && !stock.soldOut && (isFreeServer ? canClaimFreeServer : true) && handleBuyClick(server)}
      >
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${colors.bg}`}>
            <Icon className={`w-5 h-5 ${colors.text}`} />
          </div>

          {/* Name & Hash */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm text-foreground truncate">{server.name}</span>
              {owned && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
            </div>
            <span className="text-xs text-muted-foreground">{server.hashRate}</span>
          </div>

          {/* Earnings */}
          <div className="text-right shrink-0">
            <div className="flex items-center gap-1 justify-end">
              <BoltIcon size={12} />
              <span className="text-xs font-medium text-primary">+{server.boltPerDay.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1 justify-end">
              <UsdtIcon size={12} />
              <span className="text-xs text-emerald-500">${server.usdtPerDay.toFixed(2)}</span>
            </div>
          </div>

          {/* Price/Status */}
          <div className="shrink-0 w-16 text-right">
            {owned ? (
              <span className={`text-xs font-medium ${colors.text}`}>Active</span>
            ) : stock.soldOut ? (
              <span className="text-xs text-muted-foreground">Sold</span>
            ) : server.priceTon === 0 ? (
              <span className="text-xs font-bold text-emerald-500">FREE</span>
            ) : (
              <div className="flex items-center gap-1 justify-end">
                <TonIcon size={12} />
                <span className="text-sm font-semibold">{server.priceTon}</span>
              </div>
            )}
          </div>
        </div>

        {/* Free Server Unlock - Compact */}
        {isFreeServer && !owned && !canClaimFreeServer && (
          <div className="flex gap-2 mt-2 pt-2 border-t border-border/20" onClick={(e) => e.stopPropagation()}>
            <Button onClick={() => navigate('/invite')} size="sm" variant="ghost" className="flex-1 h-7 text-xs">
              <Users className="w-3 h-3 mr-1" />
              Invite
            </Button>
            <Button
              onClick={handleWatchAd}
              disabled={isWatchingAd || isAdLoading || !isAdReady}
              size="sm"
              variant="ghost"
              className="flex-1 h-7 text-xs"
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
      </div>
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
        {/* Header with Circuit Animation */}
        <div className="text-center space-y-4">
          <CircuitAnimation className="mx-auto max-w-xs" />
          
          <div>
            <h1 className="text-xl font-bold text-foreground">Mining Journey</h1>
            <p className="text-sm text-muted-foreground mt-1">Your path to passive income</p>
          </div>
        </div>

        {/* Stats Bar */}
        {totalStats.servers > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-5 py-3 px-4 rounded-xl bg-card/60 border border-primary/20 shadow-lg shadow-primary/5"
          >
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold text-foreground">{totalStats.servers}</span>
            </div>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center gap-1.5">
              <BoltIcon size={14} />
              <span className="text-sm font-bold text-primary">+{totalStats.boltPerDay.toLocaleString()}/d</span>
            </div>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center gap-1.5">
              <UsdtIcon size={14} />
              <span className="text-sm font-bold text-emerald-500">+${totalStats.usdtPerDay.toFixed(2)}/d</span>
            </div>
          </motion.div>
        )}

        {/* Progress Indicator */}
        <div className="flex items-center gap-3 px-2">
          <div className="flex-1 h-1.5 rounded-full bg-secondary/50 overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
          <span className="text-xs text-muted-foreground font-medium">
            {ownedServers.length}/{servers.length}
          </span>
        </div>

        {/* Timeline */}
        <section className="relative" ref={timelineRef}>
          {/* Animated Timeline Trace */}
          <TimelineTraceAnimation 
            serverCount={sortedServers.length}
            ownedCount={ownedServers.length}
          />

          {/* Server Nodes */}
          <div className="space-y-3 pl-8">
            {sortedServers.map((server, index) => renderTimelineNode(server, index))}
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
