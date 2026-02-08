import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useViralMining } from '@/hooks/useViralMining';
import { useUserServers } from '@/hooks/useUserServers';
import { useTelegramBackButton } from '@/hooks/useTelegramBackButton';
import { supabase } from '@/integrations/supabase/client';
import { Server, Check, HardDrive, Database, Cloud, Globe, Shield, Layers, Loader2, Crown, Gem, TrendingUp, Sparkles, Gift, Clock } from 'lucide-react';
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
  icon: React.ElementType;
  tier: 'basic' | 'advanced' | 'elite' | 'legendary';
};

// Servers from 2 TON up to 500 TON - with offers on 9-30 TON range
// New ultra tier for 150-500 TON servers
const servers: MiningServer[] = [
  // Basic tier (no offers)
  { id: 'basic-1', name: 'Basic I', hashRate: '5 TH/s', boltPerDay: 250, usdtPerDay: 0.05, tonPerDay: 0, ethPerDay: 0.00005, viralPerDay: 50, priceTon: 2.0, icon: HardDrive, tier: 'basic' },
  { id: 'basic-2', name: 'Basic II', hashRate: '10 TH/s', boltPerDay: 500, usdtPerDay: 0.10, tonPerDay: 0, ethPerDay: 0.0001, viralPerDay: 100, priceTon: 3.0, icon: Database, tier: 'basic' },
  { id: 'pro-1', name: 'Advanced I', hashRate: '25 TH/s', boltPerDay: 1250, usdtPerDay: 0.25, tonPerDay: 0.005, ethPerDay: 0.00025, viralPerDay: 250, priceTon: 5.0, icon: Cloud, tier: 'advanced' },
  // Offer range: 9-30 TON
  { id: 'pro-2', name: 'Advanced II', hashRate: '50 TH/s', boltPerDay: 2500, usdtPerDay: 0.50, tonPerDay: 0.01, ethPerDay: 0.0005, viralPerDay: 500, priceTon: 9.0, icon: Globe, tier: 'advanced' },
  { id: 'elite-1', name: 'Elite I', hashRate: '100 TH/s', boltPerDay: 5000, usdtPerDay: 1.00, tonPerDay: 0.02, ethPerDay: 0.001, viralPerDay: 1000, priceTon: 16.0, icon: Shield, tier: 'elite' },
  { id: 'elite-2', name: 'Elite II', hashRate: '200 TH/s', boltPerDay: 10000, usdtPerDay: 2.00, tonPerDay: 0.04, ethPerDay: 0.002, viralPerDay: 2000, priceTon: 30.0, icon: Layers, tier: 'elite' },
  // Standard legendary (50-100 TON)
  { id: 'legendary-1', name: 'Legend', hashRate: '500 TH/s', boltPerDay: 25000, usdtPerDay: 5.00, tonPerDay: 0.08, ethPerDay: 0.005, viralPerDay: 5000, priceTon: 50.0, icon: Crown, tier: 'legendary' },
  { id: 'mythic-1', name: 'Mythic', hashRate: '1000 TH/s', boltPerDay: 60000, usdtPerDay: 12.00, tonPerDay: 0.15, ethPerDay: 0.01, viralPerDay: 10000, priceTon: 100.0, icon: Gem, tier: 'legendary' },
  // Ultra tier (150-500 TON) - NEW
  { id: 'ultra-1', name: 'Titan', hashRate: '2000 TH/s', boltPerDay: 120000, usdtPerDay: 25.00, tonPerDay: 0.35, ethPerDay: 0.025, viralPerDay: 25000, priceTon: 150.0, icon: Crown, tier: 'legendary' },
  { id: 'ultra-2', name: 'Omega', hashRate: '3500 TH/s', boltPerDay: 200000, usdtPerDay: 45.00, tonPerDay: 0.60, ethPerDay: 0.045, viralPerDay: 45000, priceTon: 250.0, icon: Gem, tier: 'legendary' },
  { id: 'ultra-3', name: 'Infinity', hashRate: '5000 TH/s', boltPerDay: 300000, usdtPerDay: 70.00, tonPerDay: 1.00, ethPerDay: 0.075, viralPerDay: 70000, priceTon: 350.0, icon: Crown, tier: 'legendary' },
  { id: 'ultra-4', name: 'Quantum', hashRate: '8000 TH/s', boltPerDay: 500000, usdtPerDay: 120.00, tonPerDay: 1.80, ethPerDay: 0.120, viralPerDay: 120000, priceTon: 500.0, icon: Gem, tier: 'legendary' },
];

// Servers with special offers (9-30 TON range)
const serversWithOffers = ['pro-2', 'elite-1', 'elite-2'];

const tierColors = {
  basic: 'from-slate-500/20 to-slate-500/5 border-slate-500/30',
  advanced: 'from-blue-500/20 to-blue-500/5 border-blue-500/30',
  elite: 'from-purple-500/20 to-purple-500/5 border-purple-500/30',
  legendary: 'from-amber-500/20 to-amber-500/5 border-amber-500/30',
};

const tierIconColors = {
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
            
            <div className="grid grid-cols-3 gap-2 mb-2">
              <div className="p-2.5 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-center">
                <BoltIcon size={22} className="mx-auto mb-1" />
                <p className="text-sm font-bold text-yellow-500">+{totalStats.boltPerDay.toLocaleString()}</p>
                <p className="text-[9px] text-muted-foreground uppercase">BOLT</p>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                <UsdtIcon size={22} className="mx-auto mb-1" />
                <p className="text-sm font-bold text-emerald-500">${totalStats.usdtPerDay.toFixed(2)}</p>
                <p className="text-[9px] text-muted-foreground uppercase">USDT</p>
              </div>
              <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-center">
                <TonIcon size={22} className="mx-auto mb-1" />
                <p className="text-sm font-bold text-sky-500">+{totalStats.tonPerDay.toFixed(4)}</p>
                <p className="text-[9px] text-muted-foreground uppercase">TON</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-center">
                <EthIcon size={22} className="mx-auto mb-1" />
                <p className="text-sm font-bold text-indigo-500">+{totalStats.ethPerDay.toFixed(6)}</p>
                <p className="text-[9px] text-muted-foreground uppercase">ETH</p>
              </div>
              <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center">
                <ViralIcon size={22} className="mx-auto mb-1" />
                <p className="text-sm font-bold text-purple-500">+{totalStats.viralPerDay.toLocaleString()}</p>
                <p className="text-[9px] text-muted-foreground uppercase">VIRAL</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Pending Rewards */}
        {ownedServers.length > 0 && (pendingRewards.pendingBolt > 0 || pendingRewards.pendingUsdt > 0 || pendingRewards.pendingTon > 0 || pendingRewards.pendingEth > 0 || pendingRewards.pendingViral > 0) && (
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
            
            <div className="grid grid-cols-3 gap-2 mb-2">
              <div className="p-2 rounded-lg bg-background/50 text-center">
                <BoltIcon size={18} className="mx-auto mb-1" />
                <p className="text-xs font-bold text-yellow-500">+{pendingRewards.pendingBolt.toLocaleString()}</p>
              </div>
              <div className="p-2 rounded-lg bg-background/50 text-center">
                <UsdtIcon size={18} className="mx-auto mb-1" />
                <p className="text-xs font-bold text-emerald-500">+${pendingRewards.pendingUsdt.toFixed(2)}</p>
              </div>
              <div className="p-2 rounded-lg bg-background/50 text-center">
                <TonIcon size={18} className="mx-auto mb-1" />
                <p className="text-xs font-bold text-sky-500">+{pendingRewards.pendingTon.toFixed(4)}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="p-2 rounded-lg bg-background/50 text-center">
                <EthIcon size={18} className="mx-auto mb-1" />
                <p className="text-xs font-bold text-indigo-500">+{pendingRewards.pendingEth.toFixed(6)}</p>
              </div>
              <div className="p-2 rounded-lg bg-background/50 text-center">
                <ViralIcon size={18} className="mx-auto mb-1" />
                <p className="text-xs font-bold text-purple-500">+{pendingRewards.pendingViral.toLocaleString()}</p>
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

        {/* Offer Banner for 9-30 TON servers */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-gradient-to-br from-orange-500/20 to-amber-500/10 border border-orange-500/30"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
              <Gift className="w-6 h-6 text-orange-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-foreground">🔥 HOT OFFER!</h3>
              <p className="text-xs text-muted-foreground">
                Buy servers from 9-30 TON and get <span className="text-orange-500 font-semibold">+20% BONUS</span> on all daily yields!
              </p>
            </div>
          </div>
        </motion.div>

        {/* Server List */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground px-1">Standard Servers</h2>
          
          {sortedServers.map((server, index) => {
            const owned = isOwned(server.id);
            const stock = getStock(server.id);
            const Icon = server.icon;
            const hasOffer = serversWithOffers.includes(server.id);

            return (
              <motion.div
                key={server.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`p-4 rounded-2xl border transition-all duration-200 relative ${
                  owned 
                    ? `bg-gradient-to-br ${tierColors[server.tier]} ring-2 ring-primary/30` 
                    : stock.soldOut 
                      ? 'bg-muted/30 border-border opacity-50'
                      : hasOffer
                        ? `bg-gradient-to-br ${tierColors[server.tier]} ring-2 ring-orange-500/50 hover:scale-[1.01] cursor-pointer`
                        : `bg-gradient-to-br ${tierColors[server.tier]} hover:scale-[1.01] cursor-pointer`
                }`}
                onClick={() => !owned && !stock.soldOut && handleBuyClick(server)}
              >
                {/* Offer Badge */}
                {hasOffer && !owned && !stock.soldOut && (
                  <div className="absolute -top-2 -right-2 px-2 py-1 rounded-full bg-orange-500 text-white text-[10px] font-bold shadow-lg animate-pulse">
                    +20% BONUS
                  </div>
                )}
                
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
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/20">
                        <TonIcon size={18} />
                        <span className="text-sm font-semibold text-sky-500">{server.priceTon}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Daily Earnings Grid */}
                <div className="grid grid-cols-5 gap-1.5">
                  <div className="p-2 rounded-lg bg-background/60 backdrop-blur-sm text-center">
                    <BoltIcon size={14} className="mx-auto mb-0.5" />
                    <p className="text-[11px] font-bold text-yellow-500">+{server.boltPerDay.toLocaleString()}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-background/60 backdrop-blur-sm text-center">
                    <UsdtIcon size={14} className="mx-auto mb-0.5" />
                    <p className="text-[11px] font-bold text-emerald-500">${server.usdtPerDay.toFixed(2)}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-background/60 backdrop-blur-sm text-center">
                    <TonIcon size={14} className="mx-auto mb-0.5" />
                    <p className="text-[11px] font-bold text-sky-500">+{server.tonPerDay.toFixed(3)}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-background/60 backdrop-blur-sm text-center">
                    <EthIcon size={14} className="mx-auto mb-0.5" />
                    <p className="text-[11px] font-bold text-indigo-500">+{server.ethPerDay.toFixed(5)}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-background/60 backdrop-blur-sm text-center">
                    <ViralIcon size={14} className="mx-auto mb-0.5" />
                    <p className="text-[11px] font-bold text-purple-500">+{server.viralPerDay}</p>
                  </div>
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
          onSuccess={handlePaymentSuccess}
          amount={selectedServer.priceTon}
          productType="server_hosting"
          productId={selectedServer.id}
          description={`${selectedServer.name} Server - ${selectedServer.hashRate}`}
        />
      )}
    </PageWrapper>
  );
};

export default MiningServers;
