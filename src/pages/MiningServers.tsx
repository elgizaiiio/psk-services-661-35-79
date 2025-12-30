import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useViralMining } from '@/hooks/useViralMining';
import { useUserServers } from '@/hooks/useUserServers';
import { Server, Check, Zap, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { PageWrapper, FadeUp, StaggerContainer } from '@/components/ui/motion-wrapper';
import { BoltIcon, UsdtIcon, TonIcon } from '@/components/ui/currency-icons';
import { UnifiedPaymentModal } from '@/components/payment/UnifiedPaymentModal';

type MiningServer = {
  id: string;
  name: string;
  hashRate: string;
  boltPerDay: number;
  usdtPerDay: number;
  priceTon: number;
  tier: 'Basic' | 'Pro' | 'Elite';
};

const servers: MiningServer[] = [
  { id: 'basic-1', name: 'Starter', hashRate: '5 TH/s', boltPerDay: 50, usdtPerDay: 0.15, priceTon: 1.5, tier: 'Basic' },
  { id: 'basic-2', name: 'Basic', hashRate: '10 TH/s', boltPerDay: 100, usdtPerDay: 0.30, priceTon: 2.5, tier: 'Basic' },
  { id: 'pro-1', name: 'Pro', hashRate: '18 TH/s', boltPerDay: 180, usdtPerDay: 0.55, priceTon: 4.0, tier: 'Pro' },
  { id: 'pro-2', name: 'Advanced', hashRate: '30 TH/s', boltPerDay: 300, usdtPerDay: 0.90, priceTon: 6.5, tier: 'Pro' },
  { id: 'elite-1', name: 'Elite', hashRate: '50 TH/s', boltPerDay: 500, usdtPerDay: 1.50, priceTon: 10.0, tier: 'Elite' },
  { id: 'elite-2', name: 'Ultra', hashRate: '100 TH/s', boltPerDay: 1000, usdtPerDay: 3.00, priceTon: 18.0, tier: 'Elite' },
];

const getTierColor = (tier: string) => {
  switch (tier) {
    case 'Basic': return 'from-blue-500/20 to-cyan-500/20 border-blue-500/30';
    case 'Pro': return 'from-purple-500/20 to-pink-500/20 border-purple-500/30';
    case 'Elite': return 'from-amber-500/20 to-orange-500/20 border-amber-500/30';
    default: return 'from-muted/20 to-muted/10 border-border';
  }
};

const getTierBadgeColor = (tier: string) => {
  switch (tier) {
    case 'Basic': return 'bg-blue-500/20 text-blue-400';
    case 'Pro': return 'bg-purple-500/20 text-purple-400';
    case 'Elite': return 'bg-amber-500/20 text-amber-400';
    default: return 'bg-muted text-muted-foreground';
  }
};

const MiningServers = () => {
  const { user: telegramUser, isLoading: isTelegramLoading } = useTelegramAuth();
  const { user, loading: isMiningUserLoading } = useViralMining(telegramUser);
  const { servers: ownedServers, purchaseServer, getStock } = useUserServers(user?.id || null);
  const [selectedServer, setSelectedServer] = useState<MiningServer | null>(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

  const isReady = !isTelegramLoading && !isMiningUserLoading;

  const handleBuyClick = (server: MiningServer) => {
    if (!isReady) {
      toast.error('Loading… please wait.');
      return;
    }
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

  return (
    <PageWrapper className="min-h-screen bg-background pb-32">
      <Helmet>
        <title>Mining Servers</title>
        <meta name="description" content="Buy mining servers to earn daily rewards." />
      </Helmet>

      <div className="max-w-md mx-auto px-4 pt-8">
        <StaggerContainer className="space-y-6">
          {/* Header */}
          <FadeUp>
            <div className="text-center mb-2">
              <h1 className="text-2xl font-bold text-foreground">Mining Servers</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Purchase servers to earn passive income
              </p>
            </div>
          </FadeUp>

          {/* Stats Card */}
          {totalStats.servers > 0 && (
            <FadeUp>
              <div className="p-4 rounded-2xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Server className="w-5 h-5 text-primary" />
                    <span className="font-medium text-foreground">{totalStats.servers} Servers</span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Daily Earnings</p>
                    <p className="text-sm font-semibold text-primary">+{totalStats.boltPerDay} BOLT • +${totalStats.usdtPerDay.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </FadeUp>
          )}

          {/* Server List */}
          <div className="space-y-3">
            {servers.map((server) => {
              const owned = isOwned(server.id);
              const stock = getStock(server.id);

              return (
                <FadeUp key={server.id}>
                  <motion.div
                    className={`p-4 rounded-2xl bg-gradient-to-r ${getTierColor(server.tier)} border backdrop-blur-sm transition-all ${
                      owned ? 'opacity-70' : stock.soldOut ? 'opacity-40' : ''
                    }`}
                    whileTap={!owned && !stock.soldOut ? { scale: 0.98 } : undefined}
                  >
                    {/* Top Row */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-background/50 flex items-center justify-center">
                          <Server className="w-6 h-6 text-foreground" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-foreground">{server.name}</h3>
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${getTierBadgeColor(server.tier)}`}>
                              {server.tier}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <Zap className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{server.hashRate}</span>
                          </div>
                        </div>
                      </div>

                      {/* Price */}
                      <div className="text-right">
                        <div className="flex items-center gap-1 justify-end">
                          <TonIcon size={16} />
                          <span className="font-bold text-foreground">{server.priceTon}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground">TON</span>
                      </div>
                    </div>

                    {/* Rewards Row */}
                    <div className="flex items-center gap-4 mb-3 py-2 px-3 rounded-xl bg-background/30">
                      <div className="flex items-center gap-1.5">
                        <TrendingUp className="w-3 h-3 text-primary" />
                        <span className="text-xs text-muted-foreground">Daily:</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <BoltIcon size={14} />
                        <span className="text-xs font-medium text-foreground">+{server.boltPerDay}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <UsdtIcon size={14} />
                        <span className="text-xs font-medium text-foreground">+${server.usdtPerDay.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Action Button */}
                    {owned ? (
                      <div className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary/20 text-primary text-sm font-medium">
                        <Check className="w-4 h-4" />
                        Owned
                      </div>
                    ) : stock.soldOut ? (
                      <div className="py-2.5 text-center rounded-xl bg-muted/50 text-muted-foreground text-sm font-medium">
                        Sold Out
                      </div>
                    ) : (
                      <Button 
                        onClick={() => handleBuyClick(server)} 
                        className="w-full h-10 font-semibold"
                      >
                        Buy Server
                      </Button>
                    )}
                  </motion.div>
                </FadeUp>
              );
            })}
          </div>
        </StaggerContainer>
      </div>

      {/* Payment Modal - Using priceTon directly */}
      {selectedServer && (
        <UnifiedPaymentModal
          isOpen={isPaymentOpen}
          onClose={() => {
            setIsPaymentOpen(false);
            setSelectedServer(null);
          }}
          amount={selectedServer.priceTon}
          description={`${selectedServer.name} Server`}
          productType="server_hosting"
          productId={selectedServer.id}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </PageWrapper>
  );
};

export default MiningServers;
