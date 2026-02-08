import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useViralMining } from '@/hooks/useViralMining';
import { useUserServers } from '@/hooks/useUserServers';
import { useTelegramBackButton } from '@/hooks/useTelegramBackButton';
import { supabase } from '@/integrations/supabase/client';
import { Server, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { PageWrapper } from '@/components/ui/motion-wrapper';
import { BoltIcon, UsdtIcon, TonIcon, EthIcon, ViralIcon } from '@/components/ui/currency-icons';
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
  ethPerDay: number;
  viralPerDay: number;
  priceTon: number;
  tier: 'basic' | 'advanced' | 'elite' | 'legendary' | 'ultra';
  bonusPercent?: number;
};

// All servers from 9 TON to 500 TON with special offers
const servers: MiningServer[] = [
  // 9-30 TON range - 25% bonus
  { id: 'pro-2', name: 'Advanced II', hashRate: '50 TH/s', boltPerDay: 2500, usdtPerDay: 0.50, tonPerDay: 0.01, ethPerDay: 0.0005, viralPerDay: 500, priceTon: 9.0, tier: 'advanced', bonusPercent: 25 },
  { id: 'elite-1', name: 'Elite I', hashRate: '100 TH/s', boltPerDay: 5000, usdtPerDay: 1.00, tonPerDay: 0.02, ethPerDay: 0.001, viralPerDay: 1000, priceTon: 16.0, tier: 'elite', bonusPercent: 25 },
  { id: 'elite-2', name: 'Elite II', hashRate: '200 TH/s', boltPerDay: 10000, usdtPerDay: 2.00, tonPerDay: 0.04, ethPerDay: 0.002, viralPerDay: 2000, priceTon: 30.0, tier: 'elite', bonusPercent: 25 },
  // 50-100 TON - 30% bonus
  { id: 'legendary-1', name: 'Legend', hashRate: '500 TH/s', boltPerDay: 25000, usdtPerDay: 5.00, tonPerDay: 0.08, ethPerDay: 0.005, viralPerDay: 5000, priceTon: 50.0, tier: 'legendary', bonusPercent: 30 },
  { id: 'mythic-1', name: 'Mythic', hashRate: '1000 TH/s', boltPerDay: 60000, usdtPerDay: 12.00, tonPerDay: 0.15, ethPerDay: 0.01, viralPerDay: 10000, priceTon: 100.0, tier: 'legendary', bonusPercent: 30 },
  // 150-500 TON Ultra tier - 40% bonus
  { id: 'ultra-1', name: 'Titan', hashRate: '2000 TH/s', boltPerDay: 120000, usdtPerDay: 25.00, tonPerDay: 0.35, ethPerDay: 0.025, viralPerDay: 25000, priceTon: 150.0, tier: 'ultra', bonusPercent: 40 },
  { id: 'ultra-2', name: 'Omega', hashRate: '3500 TH/s', boltPerDay: 200000, usdtPerDay: 45.00, tonPerDay: 0.60, ethPerDay: 0.045, viralPerDay: 45000, priceTon: 250.0, tier: 'ultra', bonusPercent: 40 },
  { id: 'ultra-3', name: 'Infinity', hashRate: '5000 TH/s', boltPerDay: 300000, usdtPerDay: 70.00, tonPerDay: 1.00, ethPerDay: 0.075, viralPerDay: 70000, priceTon: 350.0, tier: 'ultra', bonusPercent: 40 },
  { id: 'ultra-4', name: 'Quantum', hashRate: '8000 TH/s', boltPerDay: 500000, usdtPerDay: 120.00, tonPerDay: 1.80, ethPerDay: 0.120, viralPerDay: 120000, priceTon: 500.0, tier: 'ultra', bonusPercent: 40 },
];

const tierBg = {
  basic: 'bg-card',
  advanced: 'bg-card',
  elite: 'bg-card',
  legendary: 'bg-card',
  ultra: 'bg-gradient-to-br from-amber-500/5 to-card',
};

const MiningServers = () => {
  const { user: telegramUser, isLoading: isTelegramLoading, hapticFeedback } = useTelegramAuth();
  const { user, loading: isMiningUserLoading } = useViralMining(telegramUser);
  const { servers: ownedServers, purchaseServer, getStock, getPendingRewards, claimRewards, refetch } = useUserServers(user?.id || null);
  const [selectedServer, setSelectedServer] = useState<MiningServer | null>(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  
  const navigate = useNavigate();
  useTelegramBackButton();

  const isReady = !isTelegramLoading && !isMiningUserLoading;
  const pendingRewards = getPendingRewards();

  const handleBuyClick = async (server: MiningServer) => {
    if (!isReady || !user?.id) return;
    hapticFeedback?.impact?.('medium');
    const stock = getStock(server.id);
    if (stock.soldOut) {
      toast.error('Sold out!');
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
        selectedServer.usdtPerDay, 
        selectedServer.tonPerDay,
        selectedServer.ethPerDay,
        selectedServer.viralPerDay
      );
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
      if (result.claimedBolt > 0 || result.claimedUsdt > 0 || result.claimedTon > 0 || result.claimedEth > 0 || result.claimedViral > 0) {
        const parts = [];
        if (result.claimedBolt > 0) parts.push(`+${result.claimedBolt.toLocaleString()} BOLT`);
        if (result.claimedUsdt > 0) parts.push(`$${result.claimedUsdt.toFixed(2)} USDT`);
        if (result.claimedTon > 0) parts.push(`${result.claimedTon.toFixed(4)} TON`);
        if (result.claimedEth > 0) parts.push(`${result.claimedEth.toFixed(6)} ETH`);
        if (result.claimedViral > 0) parts.push(`${result.claimedViral.toLocaleString()} VIRAL`);
        toast.success(`Claimed ${parts.join(' & ')}!`);
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
    ethPerDay: ownedServers.reduce((sum, s) => sum + (s.daily_eth_yield || 0), 0),
    viralPerDay: ownedServers.reduce((sum, s) => sum + (s.daily_viral_yield || 0), 0),
  };

  const sortedServers = [...servers].sort((a, b) => a.priceTon - b.priceTon);

  return (
    <PageWrapper className="min-h-screen bg-background pb-32">
      <Helmet>
        <title>Mining Servers</title>
        <meta name="description" content="Buy mining servers to earn daily BOLT, USDT, TON, ETH and VIRAL rewards." />
      </Helmet>

      <div className="max-w-md mx-auto px-4 pt-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-foreground">Mining Servers</h1>
          <p className="text-sm text-muted-foreground">Earn passive income daily</p>
        </div>

        {/* Total Earnings Summary */}
        {totalStats.servers > 0 && (
          <div className="p-4 rounded-2xl bg-card border border-border">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-muted-foreground">Daily Earnings</p>
              <span className="text-xs text-primary font-medium">{totalStats.servers} active</span>
            </div>
            <div className="grid grid-cols-5 gap-2 text-center">
              <div>
                <BoltIcon size={18} className="mx-auto mb-1" />
                <p className="text-xs font-semibold text-foreground">{totalStats.boltPerDay.toLocaleString()}</p>
              </div>
              <div>
                <UsdtIcon size={18} className="mx-auto mb-1" />
                <p className="text-xs font-semibold text-foreground">${totalStats.usdtPerDay.toFixed(2)}</p>
              </div>
              <div>
                <TonIcon size={18} className="mx-auto mb-1" />
                <p className="text-xs font-semibold text-foreground">{totalStats.tonPerDay.toFixed(3)}</p>
              </div>
              <div>
                <EthIcon size={18} className="mx-auto mb-1" />
                <p className="text-xs font-semibold text-foreground">{totalStats.ethPerDay.toFixed(5)}</p>
              </div>
              <div>
                <ViralIcon size={18} className="mx-auto mb-1" />
                <p className="text-xs font-semibold text-foreground">{totalStats.viralPerDay.toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}

        {/* Pending Rewards */}
        {ownedServers.length > 0 && (pendingRewards.pendingBolt > 0 || pendingRewards.pendingUsdt > 0) && (
          <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-foreground">Pending Rewards</p>
              <span className="text-xs text-muted-foreground">{pendingRewards.hoursSinceClaim}h ago</span>
            </div>
            <div className="grid grid-cols-5 gap-2 text-center mb-4">
              <div>
                <p className="text-xs font-semibold text-primary">+{pendingRewards.pendingBolt.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-primary">+${pendingRewards.pendingUsdt.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-primary">+{pendingRewards.pendingTon.toFixed(3)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-primary">+{pendingRewards.pendingEth.toFixed(5)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-primary">+{pendingRewards.pendingViral.toLocaleString()}</p>
              </div>
            </div>
            <Button
              onClick={handleClaimRewards}
              disabled={isClaiming || !pendingRewards.canClaim}
              className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
            >
              {isClaiming ? <Loader2 className="w-4 h-4 animate-spin" /> : pendingRewards.canClaim ? 'Claim Rewards' : 'Wait 1h to claim'}
            </Button>
          </div>
        )}

        {/* Server List */}
        <div className="space-y-3">
          {sortedServers.map((server, index) => {
            const owned = isOwned(server.id);
            const stock = getStock(server.id);

            return (
              <motion.div
                key={server.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => !owned && !stock.soldOut && handleBuyClick(server)}
                className={`relative p-4 rounded-2xl border transition-all ${
                  owned 
                    ? 'bg-primary/5 border-primary/30' 
                    : stock.soldOut 
                      ? 'bg-muted/30 border-border opacity-50'
                      : `${tierBg[server.tier]} border-border hover:border-primary/30 cursor-pointer`
                }`}
              >
                {/* Bonus Badge */}
                {server.bonusPercent && !owned && !stock.soldOut && (
                  <div className="absolute -top-2 right-3 px-2.5 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                    +{server.bonusPercent}% Bonus
                  </div>
                )}

                {/* Server Info */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{server.name}</h3>
                      {owned && (
                        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-medium">
                          <Check className="w-3 h-3" /> Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{server.hashRate}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-foreground">{server.priceTon}</p>
                    <p className="text-xs text-muted-foreground">TON</p>
                  </div>
                </div>

                {/* Daily Yields */}
                <div className="grid grid-cols-5 gap-2 text-center p-3 rounded-xl bg-background/50">
                  <div>
                    <BoltIcon size={16} className="mx-auto mb-1 opacity-70" />
                    <p className="text-[10px] font-medium text-foreground">{server.boltPerDay.toLocaleString()}</p>
                  </div>
                  <div>
                    <UsdtIcon size={16} className="mx-auto mb-1 opacity-70" />
                    <p className="text-[10px] font-medium text-foreground">${server.usdtPerDay.toFixed(2)}</p>
                  </div>
                  <div>
                    <TonIcon size={16} className="mx-auto mb-1 opacity-70" />
                    <p className="text-[10px] font-medium text-foreground">{server.tonPerDay.toFixed(3)}</p>
                  </div>
                  <div>
                    <EthIcon size={16} className="mx-auto mb-1 opacity-70" />
                    <p className="text-[10px] font-medium text-foreground">{server.ethPerDay.toFixed(4)}</p>
                  </div>
                  <div>
                    <ViralIcon size={16} className="mx-auto mb-1 opacity-70" />
                    <p className="text-[10px] font-medium text-foreground">{server.viralPerDay.toLocaleString()}</p>
                  </div>
                </div>

                {/* ROI Info */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                  <span className="text-xs text-muted-foreground">Daily Return</span>
                  <span className="text-xs font-medium text-primary">
                    ~${(server.usdtPerDay + server.tonPerDay * 3.5).toFixed(2)}/day
                  </span>
                </div>
              </motion.div>
            );
          })}
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
          description={`${selectedServer.name} Server - ${selectedServer.hashRate}`}
          productType="server_hosting"
          productId={selectedServer.id}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </PageWrapper>
  );
};

export default MiningServers;