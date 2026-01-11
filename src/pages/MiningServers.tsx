import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useViralMining } from '@/hooks/useViralMining';
import { useUserServers } from '@/hooks/useUserServers';
import { useTelegramBackButton } from '@/hooks/useTelegramBackButton';
import { useAdsGramRewarded } from '@/hooks/useAdsGramRewarded';
import { supabase } from '@/integrations/supabase/client';
import { Server, Check, Cpu, HardDrive, Database, Cloud, Globe, Shield, Layers, Play, Users, Loader2, Crown, Gem, Zap, Gift, Clock, TrendingUp, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { PageWrapper } from '@/components/ui/motion-wrapper';
import { BoltIcon, UsdtIcon, TonIcon } from '@/components/ui/currency-icons';
import { UnifiedPaymentModal } from '@/components/payment/UnifiedPaymentModal';
import { useNavigate } from 'react-router-dom';
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
  tier: 'free' | 'basic' | 'advanced' | 'elite' | 'legendary';
};

const servers: MiningServer[] = [
  { id: 'free-starter', name: 'Starter', hashRate: '1 TH/s', boltPerDay: 50, usdtPerDay: 0.05, tonPerDay: 0, priceTon: 0, icon: Zap, tier: 'free' },
  { id: 'basic-1', name: 'Basic I', hashRate: '5 TH/s', boltPerDay: 250, usdtPerDay: 0.25, tonPerDay: 0, priceTon: 1.5, icon: HardDrive, tier: 'basic' },
  { id: 'basic-2', name: 'Basic II', hashRate: '10 TH/s', boltPerDay: 500, usdtPerDay: 0.50, tonPerDay: 0, priceTon: 2.5, icon: Database, tier: 'basic' },
  { id: 'pro-1', name: 'Advanced I', hashRate: '25 TH/s', boltPerDay: 1250, usdtPerDay: 1.25, tonPerDay: 0.05, priceTon: 5.0, icon: Cloud, tier: 'advanced' },
  { id: 'pro-2', name: 'Advanced II', hashRate: '50 TH/s', boltPerDay: 2500, usdtPerDay: 2.50, tonPerDay: 0.09, priceTon: 9.0, icon: Globe, tier: 'advanced' },
  { id: 'elite-1', name: 'Elite I', hashRate: '100 TH/s', boltPerDay: 5000, usdtPerDay: 5.00, tonPerDay: 0.16, priceTon: 16.0, icon: Shield, tier: 'elite' },
  { id: 'elite-2', name: 'Elite II', hashRate: '200 TH/s', boltPerDay: 10000, usdtPerDay: 10.00, tonPerDay: 0.30, priceTon: 30.0, icon: Layers, tier: 'elite' },
  { id: 'legendary-1', name: 'Legend', hashRate: '500 TH/s', boltPerDay: 25000, usdtPerDay: 25.00, tonPerDay: 0.50, priceTon: 50.0, icon: Crown, tier: 'legendary' },
  { id: 'mythic-1', name: 'Mythic', hashRate: '1000 TH/s', boltPerDay: 60000, usdtPerDay: 60.00, tonPerDay: 1.00, priceTon: 100.0, icon: Gem, tier: 'legendary' },
];

const REQUIRED_ADS = 5;

const tierColors = {
  free: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30',
  basic: 'from-slate-500/20 to-slate-500/5 border-slate-500/30',
  advanced: 'from-blue-500/20 to-blue-500/5 border-blue-500/30',
  elite: 'from-purple-500/20 to-purple-500/5 border-purple-500/30',
  legendary: 'from-amber-500/20 to-amber-500/5 border-amber-500/30',
};

const tierIconColors = {
  free: 'text-emerald-500 bg-emerald-500/10',
  basic: 'text-slate-400 bg-slate-500/10',
  advanced: 'text-blue-500 bg-blue-500/10',
  elite: 'text-purple-500 bg-purple-500/10',
  legendary: 'text-amber-500 bg-amber-500/10',
};

const MiningServers = () => {
  const { user: telegramUser, isLoading: isTelegramLoading, hapticFeedback } = useTelegramAuth();
  const { user, loading: isMiningUserLoading } = useViralMining(telegramUser);
  const { servers: ownedServers, purchaseServer, getStock, getPendingRewards, claimRewards, refetch } = useUserServers(user?.id || null);
  const [selectedServer, setSelectedServer] = useState<MiningServer | null>(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [adProgress, setAdProgress] = useState(0);
  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const [adUnlocked, setAdUnlocked] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  
  const { showAd, isLoading: isAdLoading, isReady: isAdReady } = useAdsGramRewarded();
  const navigate = useNavigate();
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
        toast.success(`Claimed +${result.claimedBolt.toLocaleString()} BOLT & $${result.claimedUsdt.toFixed(2)} USDT${tonMsg}!`);
      } else {
        toast.info('Wait at least 1 hour between claims');
      }
    } catch (error: any) {
      console.error('Claim error:', error);
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

  const sortedServers = [...servers].sort((a, b) => a.priceTon - b.priceTon);

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

        {/* Total Earnings Summary */}
        {totalStats.servers > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 rounded-2xl bg-gradient-to-br from-card to-card/80 border border-border shadow-sm"
          >
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h2 className="font-semibold text-foreground">Daily Earnings</h2>
              <span className="ml-auto px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                {totalStats.servers} Active
              </span>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              {/* BOLT */}
              <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-center">
                <BoltIcon size={28} className="mx-auto mb-2" />
                <p className="text-lg font-bold text-yellow-500">+{totalStats.boltPerDay.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">BOLT/day</p>
              </div>
              
              {/* USDT */}
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                <UsdtIcon size={28} className="mx-auto mb-2" />
                <p className="text-lg font-bold text-emerald-500">${totalStats.usdtPerDay.toFixed(2)}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">USDT/day</p>
              </div>
              
              {/* TON */}
              <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 text-center">
                <TonIcon size={28} className="mx-auto mb-2" />
                <p className="text-lg font-bold text-sky-500">+{totalStats.tonPerDay.toFixed(4)}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">TON/day</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Pending Rewards */}
        {ownedServers.length > 0 && (pendingRewards.pendingBolt > 0 || pendingRewards.pendingUsdt > 0 || pendingRewards.pendingTon > 0) && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-5 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/30"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Gift className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Pending Rewards</h3>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {pendingRewards.hoursSinceClaim}h since claim
                  </p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="p-2.5 rounded-lg bg-background/50 text-center">
                <BoltIcon size={20} className="mx-auto mb-1" />
                <p className="text-sm font-bold text-yellow-500">+{pendingRewards.pendingBolt.toLocaleString()}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-background/50 text-center">
                <UsdtIcon size={20} className="mx-auto mb-1" />
                <p className="text-sm font-bold text-emerald-500">+${pendingRewards.pendingUsdt.toFixed(2)}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-background/50 text-center">
                <TonIcon size={20} className="mx-auto mb-1" />
                <p className="text-sm font-bold text-sky-500">+{pendingRewards.pendingTon.toFixed(4)}</p>
              </div>
            </div>

            <Button
              onClick={handleClaimRewards}
              disabled={isClaiming || !pendingRewards.canClaim}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl"
            >
              {isClaiming ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <Sparkles className="w-5 h-5 mr-2" />
              )}
              {isClaiming ? 'Claiming...' : pendingRewards.canClaim ? 'CLAIM ALL REWARDS' : 'Wait 1 hour to claim'}
            </Button>
          </motion.div>
        )}

        {/* Server List */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground px-1">Available Servers</h2>
          
          {sortedServers.map((server, index) => {
            const owned = isOwned(server.id);
            const stock = getStock(server.id);
            const Icon = server.icon;
            const isFreeServer = server.priceTon === 0;

            return (
              <motion.div
                key={server.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`p-4 rounded-2xl border transition-all duration-200 ${
                  owned 
                    ? `bg-gradient-to-br ${tierColors[server.tier]} ring-2 ring-primary/30` 
                    : stock.soldOut 
                      ? 'bg-muted/30 border-border opacity-50'
                      : `bg-gradient-to-br ${tierColors[server.tier]} hover:scale-[1.01] cursor-pointer`
                }`}
                onClick={() => !owned && !stock.soldOut && handleBuyClick(server)}
              >
                {/* Server Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${tierIconColors[server.tier]}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{server.name}</h3>
                      {owned && (
                        <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-medium flex items-center gap-1">
                          <Check className="w-3 h-3" /> ACTIVE
                        </span>
                      )}
                      {stock.soldOut && !owned && (
                        <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-medium">
                          SOLD OUT
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{server.hashRate} Hash Rate</p>
                  </div>
                  
                  {/* Price */}
                  {!owned && !stock.soldOut && (
                    <div className="text-right">
                      {isFreeServer ? (
                        <span className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-500 text-sm font-semibold">
                          FREE
                        </span>
                      ) : (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/20">
                          <TonIcon size={18} />
                          <span className="text-sm font-semibold text-sky-500">{server.priceTon}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Daily Earnings Grid */}
                <div className={`grid gap-2 ${server.tonPerDay > 0 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                  {/* BOLT */}
                  <div className="p-3 rounded-xl bg-background/60 backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <BoltIcon size={16} />
                      <span className="text-[10px] text-muted-foreground uppercase">BOLT</span>
                    </div>
                    <p className="text-base font-bold text-yellow-500">+{server.boltPerDay.toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground">per day</p>
                  </div>
                  
                  {/* USDT */}
                  <div className="p-3 rounded-xl bg-background/60 backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <UsdtIcon size={16} />
                      <span className="text-[10px] text-muted-foreground uppercase">USDT</span>
                    </div>
                    <p className="text-base font-bold text-emerald-500">${server.usdtPerDay.toFixed(2)}</p>
                    <p className="text-[10px] text-muted-foreground">per day</p>
                  </div>
                  
                  {/* TON (only for servers with TON yield) */}
                  {server.tonPerDay > 0 && (
                    <div className="p-3 rounded-xl bg-background/60 backdrop-blur-sm">
                      <div className="flex items-center gap-2 mb-1">
                        <TonIcon size={16} />
                        <span className="text-[10px] text-muted-foreground uppercase">TON</span>
                      </div>
                      <p className="text-base font-bold text-sky-500">+{server.tonPerDay}</p>
                      <p className="text-[10px] text-muted-foreground">per day</p>
                    </div>
                  )}
                </div>

                {/* Free Server Unlock Options */}
                {isFreeServer && !owned && !canClaimFreeServer && (
                  <div className="flex gap-2 mt-4 pt-4 border-t border-border/50" onClick={(e) => e.stopPropagation()}>
                    <Button 
                      onClick={() => navigate('/invite')} 
                      size="sm" 
                      variant="outline" 
                      className="flex-1 h-10 rounded-xl"
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Invite Friend
                    </Button>
                    <Button
                      onClick={handleWatchAd}
                      disabled={isWatchingAd || isAdLoading || !isAdReady}
                      size="sm"
                      variant="outline"
                      className="flex-1 h-10 rounded-xl"
                    >
                      {isWatchingAd || isAdLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          Watch Ad ({adProgress}/{REQUIRED_ADS})
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Footer Info */}
        <p className="text-xs text-muted-foreground text-center px-4 pb-4">
          Servers mine automatically 24/7. Claim rewards every hour.
        </p>
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
