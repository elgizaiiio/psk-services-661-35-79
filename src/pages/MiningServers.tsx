import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useViralMining } from '@/hooks/useViralMining';
import { useUserServers } from '@/hooks/useUserServers';
import { useTelegramBackButton } from '@/hooks/useTelegramBackButton';
import { useAdsGramRewarded } from '@/hooks/useAdsGramRewarded';
import { supabase } from '@/integrations/supabase/client';
import { Server, Check, Cpu, HardDrive, Database, Cloud, Globe, Shield, Layers, Play, Users, Loader2, Crown, Gem, Zap, Gift, Clock } from 'lucide-react';
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
  tonPerDay: number;
  priceTon: number;
  icon: React.ElementType;
};

const servers: MiningServer[] = [
  { id: 'free-starter', name: 'Starter', hashRate: '1 TH/s', boltPerDay: 50, usdtPerDay: 0.05, tonPerDay: 0, priceTon: 0, icon: Zap },
  { id: 'basic-1', name: 'Basic I', hashRate: '5 TH/s', boltPerDay: 250, usdtPerDay: 0.25, tonPerDay: 0, priceTon: 1.5, icon: HardDrive },
  { id: 'basic-2', name: 'Basic II', hashRate: '10 TH/s', boltPerDay: 500, usdtPerDay: 0.50, tonPerDay: 0, priceTon: 2.5, icon: Database },
  { id: 'pro-1', name: 'Advanced I', hashRate: '25 TH/s', boltPerDay: 1250, usdtPerDay: 1.25, tonPerDay: 0.05, priceTon: 5.0, icon: Cloud },
  { id: 'pro-2', name: 'Advanced II', hashRate: '50 TH/s', boltPerDay: 2500, usdtPerDay: 2.50, tonPerDay: 0.09, priceTon: 9.0, icon: Globe },
  { id: 'elite-1', name: 'Elite I', hashRate: '100 TH/s', boltPerDay: 5000, usdtPerDay: 5.00, tonPerDay: 0.16, priceTon: 16.0, icon: Shield },
  { id: 'elite-2', name: 'Elite II', hashRate: '200 TH/s', boltPerDay: 10000, usdtPerDay: 10.00, tonPerDay: 0.30, priceTon: 30.0, icon: Layers },
  { id: 'legendary-1', name: 'Legend', hashRate: '500 TH/s', boltPerDay: 25000, usdtPerDay: 25.00, tonPerDay: 0.50, priceTon: 50.0, icon: Crown },
  { id: 'mythic-1', name: 'Mythic', hashRate: '1000 TH/s', boltPerDay: 60000, usdtPerDay: 60.00, tonPerDay: 1.00, priceTon: 100.0, icon: Gem },
];

const REQUIRED_ADS = 5;

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
        <meta name="description" content="Buy mining servers to earn daily BOLT and USDT rewards." />
      </Helmet>

      <div className="max-w-md mx-auto px-4 pt-6 space-y-5">
        {/* Header */}
        <div className="text-center space-y-1">
          <h1 className="text-xl font-bold text-foreground">Mining Servers</h1>
          <p className="text-sm text-muted-foreground">Earn passive income 24/7</p>
        </div>

        {/* Claim Rewards Card */}
        {ownedServers.length > 0 && (pendingRewards.pendingBolt > 0 || pendingRewards.pendingUsdt > 0 || pendingRewards.pendingTon > 0) && (
          <div className="p-4 rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-primary" />
                <span className="font-semibold text-foreground">Pending Rewards</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                <span>{pendingRewards.hoursSinceClaim}h ago</span>
              </div>
            </div>
            
            <div className="flex items-center gap-4 mb-4 flex-wrap">
              <div className="flex items-center gap-1.5">
                <BoltIcon size={18} />
                <span className="text-lg font-bold text-primary">+{pendingRewards.pendingBolt.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <UsdtIcon size={18} />
                <span className="text-lg font-bold text-emerald-500">+${pendingRewards.pendingUsdt.toFixed(2)}</span>
              </div>
              {pendingRewards.pendingTon > 0 && (
                <div className="flex items-center gap-1.5">
                  <TonIcon size={18} />
                  <span className="text-lg font-bold text-sky-500">+{pendingRewards.pendingTon.toFixed(4)}</span>
                </div>
              )}
            </div>

            <Button
              onClick={handleClaimRewards}
              disabled={isClaiming || !pendingRewards.canClaim}
              className="w-full bg-primary hover:bg-primary/90"
            >
              {isClaiming ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Gift className="w-4 h-4 mr-2" />
              )}
              {isClaiming ? 'Claiming...' : pendingRewards.canClaim ? 'CLAIM REWARDS' : 'Wait 1 hour'}
            </Button>
          </div>
        )}

        {/* Stats */}
        {totalStats.servers > 0 && (
          <div className="p-3 rounded-xl bg-card border border-border space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-foreground">{totalStats.servers} active</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <BoltIcon size={14} />
                  <span className="text-sm font-medium text-primary">+{totalStats.boltPerDay.toLocaleString()}/day</span>
                </div>
                <div className="flex items-center gap-1">
                  <UsdtIcon size={14} />
                  <span className="text-sm font-medium text-emerald-500">${totalStats.usdtPerDay.toFixed(2)}/day</span>
                </div>
              </div>
            </div>
            {totalStats.tonPerDay > 0 && (
              <div className="flex items-center justify-end gap-1">
                <TonIcon size={14} />
                <span className="text-sm font-medium text-sky-500">+{totalStats.tonPerDay.toFixed(4)} TON/day</span>
              </div>
            )}
          </div>
        )}

        {/* Server List */}
        <div className="space-y-2">
          {sortedServers.map((server) => {
            const owned = isOwned(server.id);
            const stock = getStock(server.id);
            const Icon = server.icon;
            const isFreeServer = server.priceTon === 0;

            return (
              <div
                key={server.id}
                className={`p-3 rounded-xl border transition-colors ${
                  owned 
                    ? 'bg-primary/5 border-primary/20' 
                    : stock.soldOut 
                      ? 'bg-muted/30 border-border opacity-60'
                      : 'bg-card border-border hover:border-primary/30 cursor-pointer'
                }`}
                onClick={() => !owned && !stock.soldOut && handleBuyClick(server)}
              >
                <div className="flex items-center gap-3">
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    owned ? 'bg-primary/10' : 'bg-secondary'
                  }`}>
                    <Icon className={`w-5 h-5 ${owned ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-foreground text-sm">{server.name}</h3>
                      {owned && <Check className="w-4 h-4 text-primary" />}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs text-muted-foreground">{server.hashRate}</span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-primary">+{server.boltPerDay}</span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-emerald-500">${server.usdtPerDay}</span>
                      {server.tonPerDay > 0 && (
                        <>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs text-sky-500">+{server.tonPerDay} TON</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Price */}
                  <div className="shrink-0">
                    {owned ? (
                      <span className="text-xs text-primary font-medium">Active</span>
                    ) : stock.soldOut ? (
                      <span className="text-xs text-muted-foreground">Sold</span>
                    ) : isFreeServer ? (
                      <span className="text-xs text-emerald-500 font-medium">Free</span>
                    ) : (
                      <div className="flex items-center gap-1">
                        <TonIcon size={14} />
                        <span className="text-sm font-medium text-foreground">{server.priceTon}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Free Server Unlock */}
                {isFreeServer && !owned && !canClaimFreeServer && (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-border" onClick={(e) => e.stopPropagation()}>
                    <Button 
                      onClick={() => navigate('/invite')} 
                      size="sm" 
                      variant="outline" 
                      className="flex-1 h-8 text-xs"
                    >
                      <Users className="w-3.5 h-3.5 mr-1.5" />
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
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 mr-1.5" />
                          Ad ({adProgress}/{REQUIRED_ADS})
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Info */}
        <p className="text-xs text-muted-foreground text-center px-4">
          Servers mine automatically. Rewards added daily.
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
