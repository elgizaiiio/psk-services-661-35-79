import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useViralMining } from '@/hooks/useViralMining';
import { useUserServers } from '@/hooks/useUserServers';
import { useTelegramBackButton } from '@/hooks/useTelegramBackButton';
import { useAdsGramRewarded } from '@/hooks/useAdsGramRewarded';
import { supabase } from '@/integrations/supabase/client';
import { Server, Check, HardDrive, Database, Cloud, Globe, Shield, Layers, Loader2, Crown, Gem, Zap, Gift, Clock, TrendingUp, Sparkles, Play } from 'lucide-react';
import { toast } from 'sonner';
import { PageWrapper } from '@/components/ui/motion-wrapper';
import { BoltIcon, UsdtIcon, TonIcon } from '@/components/ui/currency-icons';
import { UnifiedPaymentModal } from '@/components/payment/UnifiedPaymentModal';
import { motion } from 'motion/react';

type MiningServer = {
  id: string;
  name: string;
  hashRate: string;
  boltPerDay: number;
  usdtPerDay: number;
  tonPerDay: number;
  priceTon: number;
  icon: React.ElementType;
  tier: 'free' | 'basic' | 'pro' | 'elite' | 'legendary';
};

const servers: MiningServer[] = [
  { id: 'free-starter', name: 'Starter', hashRate: '1 TH/s', boltPerDay: 50, usdtPerDay: 0.01, tonPerDay: 0, priceTon: 0, icon: Zap, tier: 'free' },
  { id: 'basic-1', name: 'Basic I', hashRate: '5 TH/s', boltPerDay: 250, usdtPerDay: 0.05, tonPerDay: 0, priceTon: 1.5, icon: HardDrive, tier: 'basic' },
  { id: 'basic-2', name: 'Basic II', hashRate: '10 TH/s', boltPerDay: 500, usdtPerDay: 0.10, tonPerDay: 0, priceTon: 2.5, icon: Database, tier: 'basic' },
  { id: 'pro-1', name: 'Advanced I', hashRate: '25 TH/s', boltPerDay: 1250, usdtPerDay: 0.25, tonPerDay: 0.005, priceTon: 5.0, icon: Cloud, tier: 'pro' },
  { id: 'pro-2', name: 'Advanced II', hashRate: '50 TH/s', boltPerDay: 2500, usdtPerDay: 0.50, tonPerDay: 0.01, priceTon: 9.0, icon: Globe, tier: 'pro' },
  { id: 'elite-1', name: 'Elite I', hashRate: '100 TH/s', boltPerDay: 5000, usdtPerDay: 1.00, tonPerDay: 0.02, priceTon: 16.0, icon: Shield, tier: 'elite' },
  { id: 'elite-2', name: 'Elite II', hashRate: '200 TH/s', boltPerDay: 10000, usdtPerDay: 2.00, tonPerDay: 0.04, priceTon: 30.0, icon: Layers, tier: 'elite' },
  { id: 'legendary-1', name: 'Legend', hashRate: '500 TH/s', boltPerDay: 25000, usdtPerDay: 5.00, tonPerDay: 0.08, priceTon: 50.0, icon: Crown, tier: 'legendary' },
  { id: 'mythic-1', name: 'Mythic', hashRate: '1000 TH/s', boltPerDay: 60000, usdtPerDay: 12.00, tonPerDay: 0.15, priceTon: 100.0, icon: Gem, tier: 'legendary' },
];

const REQUIRED_ADS = 5;

const tierConfig = {
  free: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-500', label: 'FREE' },
  basic: { bg: 'bg-slate-500/10', border: 'border-slate-500/30', text: 'text-slate-400', label: 'BASIC' },
  pro: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-500', label: 'PRO' },
  elite: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-500', label: 'ELITE' },
  legendary: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-500', label: 'LEGENDARY' },
};

const MiningServers = () => {
  const { user: telegramUser, isLoading: isTelegramLoading, hapticFeedback } = useTelegramAuth();
  const { user, loading: isMiningUserLoading } = useViralMining(telegramUser);
  const { servers: ownedServers, purchaseServer, getStock, getPendingRewards, claimRewards } = useUserServers(user?.id || null);
  const [selectedServer, setSelectedServer] = useState<MiningServer | null>(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [adProgress, setAdProgress] = useState(0);
  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const [adUnlocked, setAdUnlocked] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  
  const { showAd, isReady: isAdReady } = useAdsGramRewarded();
  useTelegramBackButton();

  const isReady = !isTelegramLoading && !isMiningUserLoading;
  const hasReferral = (user?.total_referrals ?? 0) >= 1;
  const canClaimFreeServer = hasReferral || adUnlocked;
  const pendingRewards = getPendingRewards();

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
        await supabase.from('free_server_ad_progress' as any).upsert({
          user_id: user.id,
          ads_watched: newProgress,
          unlocked_at: newProgress >= REQUIRED_ADS ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
        setAdProgress(newProgress);
        if (newProgress >= REQUIRED_ADS) {
          setAdUnlocked(true);
          toast.success('Free server unlocked!');
        } else {
          toast.success(`${newProgress}/${REQUIRED_ADS} ads watched`);
        }
      }
    } catch (error) {
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
      await purchaseServer(server.id, 'Free', server.name, server.hashRate, server.boltPerDay, server.usdtPerDay, server.tonPerDay);
      toast.success('Free server claimed!');
      return;
    }
    setSelectedServer(server);
    setIsPaymentOpen(true);
  };

  const handlePaymentSuccess = async () => {
    if (selectedServer && user?.id) {
      await purchaseServer(selectedServer.id, 'Paid', selectedServer.name, selectedServer.hashRate, selectedServer.boltPerDay, selectedServer.usdtPerDay, selectedServer.tonPerDay);
      toast.success('Server purchased!');
    }
    setSelectedServer(null);
  };

  const handleClaimRewards = async () => {
    if (!user?.id || isClaiming) return;
    hapticFeedback?.impact?.('heavy');
    setIsClaiming(true);
    try {
      const result = await claimRewards();
      if (result.claimedBolt > 0 || result.claimedUsdt > 0 || result.claimedTon > 0) {
        const tonMsg = result.claimedTon > 0 ? ` & ${result.claimedTon.toFixed(4)} TON` : '';
        toast.success(`+${result.claimedBolt.toLocaleString()} BOLT & $${result.claimedUsdt.toFixed(2)} USDT${tonMsg}!`);
      } else {
        toast.info('Wait at least 1 hour');
      }
    } catch (error: any) {
      toast.error(error.message || 'Claim failed');
    } finally {
      setIsClaiming(false);
    }
  };

  const isOwned = (serverId: string) =>
    ownedServers.some((s) => s.server_name === servers.find((srv) => srv.id === serverId)?.name);

  const totalStats = {
    servers: ownedServers.length,
    boltPerDay: ownedServers.reduce((sum, s) => sum + s.daily_bolt_yield, 0),
    usdtPerDay: ownedServers.reduce((sum, s) => sum + s.daily_usdt_yield, 0),
    tonPerDay: ownedServers.reduce((sum, s) => sum + (s.daily_ton_yield || 0), 0),
  };

  // Group servers by tier
  const serversByTier = {
    free: servers.filter(s => s.tier === 'free'),
    basic: servers.filter(s => s.tier === 'basic'),
    pro: servers.filter(s => s.tier === 'pro'),
    elite: servers.filter(s => s.tier === 'elite'),
    legendary: servers.filter(s => s.tier === 'legendary'),
  };

  const ServerCard = ({ server, index }: { server: MiningServer; index: number }) => {
    const owned = isOwned(server.id);
    const stock = getStock(server.id);
    const Icon = server.icon;
    const config = tierConfig[server.tier];

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: index * 0.05 }}
        onClick={() => !owned && !stock.soldOut && handleBuyClick(server)}
        className={`relative p-4 rounded-2xl border-2 cursor-pointer transition-all ${
          owned 
            ? `${config.bg} ${config.border} ring-2 ring-primary/20` 
            : stock.soldOut 
              ? 'bg-muted/20 border-muted opacity-50 cursor-not-allowed'
              : `${config.bg} ${config.border} hover:scale-[1.02] active:scale-[0.98]`
        }`}
      >
        {/* Owned badge */}
        {owned && (
          <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
            <Check className="w-4 h-4 text-primary-foreground" />
          </div>
        )}

        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-10 h-10 rounded-xl ${config.bg} ${config.border} border flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${config.text}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-foreground truncate">{server.name}</h3>
            <p className="text-xs text-muted-foreground">{server.hashRate}</p>
          </div>
        </div>

        {/* Daily Income */}
        <div className="space-y-2 mb-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1.5">
              <BoltIcon size={14} />
              <span className="text-yellow-500 font-semibold">+{server.boltPerDay.toLocaleString()}</span>
            </div>
            <span className="text-[10px] text-muted-foreground">/day</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1.5">
              <UsdtIcon size={14} />
              <span className="text-emerald-500 font-semibold">${server.usdtPerDay.toFixed(2)}</span>
            </div>
            <span className="text-[10px] text-muted-foreground">/day</span>
          </div>
          {server.tonPerDay > 0 && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1.5">
                <TonIcon size={14} />
                <span className="text-sky-500 font-semibold">+{server.tonPerDay}</span>
              </div>
              <span className="text-[10px] text-muted-foreground">/day</span>
            </div>
          )}
        </div>

        {/* Price / Status Button */}
        {owned ? (
          <div className={`w-full py-2 rounded-xl ${config.bg} ${config.border} border text-center`}>
            <span className={`text-sm font-semibold ${config.text}`}>ACTIVE</span>
          </div>
        ) : stock.soldOut ? (
          <div className="w-full py-2 rounded-xl bg-muted text-center">
            <span className="text-sm font-medium text-muted-foreground">SOLD OUT</span>
          </div>
        ) : server.priceTon === 0 ? (
          <Button className="w-full h-10 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl">
            FREE
          </Button>
        ) : (
          <Button className="w-full h-10 bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-xl">
            <TonIcon size={16} className="mr-1.5" />
            {server.priceTon} TON
          </Button>
        )}
      </motion.div>
    );
  };

  return (
    <PageWrapper className="min-h-screen bg-background pb-32">
      <Helmet>
        <title>Mining Servers</title>
        <meta name="description" content="Buy mining servers to earn daily BOLT, USDT, and TON rewards." />
      </Helmet>

      <div className="max-w-md mx-auto px-4 pt-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 mb-2">
            <Server className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Mining Servers</h1>
          <p className="text-sm text-muted-foreground">Passive income 24/7</p>
        </div>

        {/* Stats Summary */}
        {totalStats.servers > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl bg-card border border-border"
          >
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="font-semibold text-sm">Daily Income</span>
              <span className="ml-auto text-xs text-muted-foreground">{totalStats.servers} servers</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2 rounded-lg bg-yellow-500/10 text-center">
                <p className="text-sm font-bold text-yellow-500">+{totalStats.boltPerDay.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">BOLT</p>
              </div>
              <div className="p-2 rounded-lg bg-emerald-500/10 text-center">
                <p className="text-sm font-bold text-emerald-500">${totalStats.usdtPerDay.toFixed(2)}</p>
                <p className="text-[10px] text-muted-foreground">USDT</p>
              </div>
              <div className="p-2 rounded-lg bg-sky-500/10 text-center">
                <p className="text-sm font-bold text-sky-500">+{totalStats.tonPerDay.toFixed(4)}</p>
                <p className="text-[10px] text-muted-foreground">TON</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Pending Rewards */}
        {ownedServers.length > 0 && pendingRewards.pendingBolt > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl bg-primary/10 border border-primary/30"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-primary" />
                <span className="font-semibold">Pending Rewards</span>
              </div>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {pendingRewards.hoursSinceClaim}h
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="p-2 rounded-lg bg-background/50 text-center">
                <p className="text-sm font-bold text-yellow-500">+{pendingRewards.pendingBolt.toLocaleString()}</p>
              </div>
              <div className="p-2 rounded-lg bg-background/50 text-center">
                <p className="text-sm font-bold text-emerald-500">+${pendingRewards.pendingUsdt.toFixed(2)}</p>
              </div>
              <div className="p-2 rounded-lg bg-background/50 text-center">
                <p className="text-sm font-bold text-sky-500">+{pendingRewards.pendingTon.toFixed(4)}</p>
              </div>
            </div>
            <Button
              onClick={handleClaimRewards}
              disabled={isClaiming || !pendingRewards.canClaim}
              className="w-full h-11 bg-primary hover:bg-primary/90 font-semibold rounded-xl"
            >
              {isClaiming ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
              {pendingRewards.canClaim ? 'CLAIM ALL' : 'Wait 1h'}
            </Button>
          </motion.div>
        )}

        {/* Free Tier */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${tierConfig.free.bg} ${tierConfig.free.text}`}>
              {tierConfig.free.label}
            </span>
            {!canClaimFreeServer && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleWatchAd}
                disabled={isWatchingAd || !isAdReady}
                className="ml-auto h-7 text-xs"
              >
                {isWatchingAd ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3 mr-1" />}
                Watch Ad ({adProgress}/{REQUIRED_ADS})
              </Button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {serversByTier.free.map((server, i) => (
              <ServerCard key={server.id} server={server} index={i} />
            ))}
          </div>
        </div>

        {/* Basic Tier */}
        <div className="space-y-3">
          <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${tierConfig.basic.bg} ${tierConfig.basic.text}`}>
            {tierConfig.basic.label}
          </span>
          <div className="grid grid-cols-2 gap-3">
            {serversByTier.basic.map((server, i) => (
              <ServerCard key={server.id} server={server} index={i} />
            ))}
          </div>
        </div>

        {/* Pro Tier */}
        <div className="space-y-3">
          <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${tierConfig.pro.bg} ${tierConfig.pro.text}`}>
            {tierConfig.pro.label}
          </span>
          <div className="grid grid-cols-2 gap-3">
            {serversByTier.pro.map((server, i) => (
              <ServerCard key={server.id} server={server} index={i} />
            ))}
          </div>
        </div>

        {/* Elite Tier */}
        <div className="space-y-3">
          <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${tierConfig.elite.bg} ${tierConfig.elite.text}`}>
            {tierConfig.elite.label}
          </span>
          <div className="grid grid-cols-2 gap-3">
            {serversByTier.elite.map((server, i) => (
              <ServerCard key={server.id} server={server} index={i} />
            ))}
          </div>
        </div>

        {/* Legendary Tier */}
        <div className="space-y-3">
          <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${tierConfig.legendary.bg} ${tierConfig.legendary.text}`}>
            {tierConfig.legendary.label}
          </span>
          <div className="grid grid-cols-2 gap-3">
            {serversByTier.legendary.map((server, i) => (
              <ServerCard key={server.id} server={server} index={i} />
            ))}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {selectedServer && (
        <UnifiedPaymentModal
          isOpen={isPaymentOpen}
          onClose={() => setIsPaymentOpen(false)}
          amount={selectedServer.priceTon}
          productType="server_hosting"
          productId={selectedServer.id}
          description={`Mining Server - ${selectedServer.name}`}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </PageWrapper>
  );
};

export default MiningServers;
