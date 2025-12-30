import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useViralMining } from '@/hooks/useViralMining';
import { useUserServers } from '@/hooks/useUserServers';
import { Server, Check, Cpu, Activity } from 'lucide-react';
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
  tier: 'Free' | 'Basic' | 'Pro' | 'Elite';
  color: string;
  glow: string;
};

const servers: MiningServer[] = [
  { id: 'free-starter', name: 'Free Starter', hashRate: '1 TH/s', boltPerDay: 10, usdtPerDay: 0.02, priceTon: 0, tier: 'Free', color: '#10B981', glow: 'shadow-emerald-500/30' },
  { id: 'basic-1', name: 'Starter', hashRate: '5 TH/s', boltPerDay: 50, usdtPerDay: 0.15, priceTon: 1.5, tier: 'Basic', color: '#3B82F6', glow: 'shadow-blue-500/30' },
  { id: 'basic-2', name: 'Basic', hashRate: '10 TH/s', boltPerDay: 100, usdtPerDay: 0.30, priceTon: 2.5, tier: 'Basic', color: '#06B6D4', glow: 'shadow-cyan-500/30' },
  { id: 'pro-1', name: 'Pro', hashRate: '18 TH/s', boltPerDay: 180, usdtPerDay: 0.55, priceTon: 4.0, tier: 'Pro', color: '#8B5CF6', glow: 'shadow-violet-500/30' },
  { id: 'pro-2', name: 'Advanced', hashRate: '30 TH/s', boltPerDay: 300, usdtPerDay: 0.90, priceTon: 6.5, tier: 'Pro', color: '#EC4899', glow: 'shadow-pink-500/30' },
  { id: 'elite-1', name: 'Elite', hashRate: '50 TH/s', boltPerDay: 500, usdtPerDay: 1.50, priceTon: 10.0, tier: 'Elite', color: '#F59E0B', glow: 'shadow-amber-500/30' },
  { id: 'elite-2', name: 'Ultra', hashRate: '100 TH/s', boltPerDay: 1000, usdtPerDay: 3.00, priceTon: 18.0, tier: 'Elite', color: '#EF4444', glow: 'shadow-red-500/30' },
];

const MiningServers = () => {
  const { user: telegramUser, isLoading: isTelegramLoading } = useTelegramAuth();
  const { user, loading: isMiningUserLoading } = useViralMining(telegramUser);
  const { servers: ownedServers, purchaseServer, getStock } = useUserServers(user?.id || null);
  const [selectedServer, setSelectedServer] = useState<MiningServer | null>(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

  const isReady = !isTelegramLoading && !isMiningUserLoading;

  const handleBuyClick = async (server: MiningServer) => {
    if (!isReady || !user?.id) {
      return;
    }
    const stock = getStock(server.id);
    if (stock.soldOut) {
      toast.error('Sold out!');
      return;
    }
    
    // Handle free server - no payment needed
    if (server.priceTon === 0) {
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

  return (
    <PageWrapper className="min-h-screen bg-gradient-to-b from-background via-background to-black/50 pb-32">
      <Helmet>
        <title>Mining Servers</title>
        <meta name="description" content="Buy mining servers to earn daily rewards." />
      </Helmet>

      <div className="max-w-md mx-auto px-4 pt-6">
        <StaggerContainer className="space-y-5">
          {/* Header */}
          <FadeUp>
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/50 mb-4 shadow-lg shadow-primary/30">
                <Cpu className="w-8 h-8 text-primary-foreground" />
              </div>
              <h1 className="text-3xl font-black text-foreground tracking-tight">Mining Servers</h1>
              <p className="text-muted-foreground mt-2">
                Passive income, 24/7 mining
              </p>
            </div>
          </FadeUp>

          {/* Stats Card */}
          {totalStats.servers > 0 && (
            <FadeUp>
              <motion.div 
                className="p-5 rounded-3xl bg-gradient-to-r from-primary/20 via-primary/10 to-transparent border border-primary/30 shadow-xl shadow-primary/10"
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center">
                      <Activity className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{totalStats.servers}</p>
                      <p className="text-xs text-muted-foreground">Active Servers</p>
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="flex items-center gap-1 justify-end">
                      <BoltIcon size={14} />
                      <span className="text-sm font-bold text-primary">+{totalStats.boltPerDay}/day</span>
                    </div>
                    <div className="flex items-center gap-1 justify-end">
                      <UsdtIcon size={14} />
                      <span className="text-sm font-bold text-emerald-400">+${totalStats.usdtPerDay.toFixed(2)}/day</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </FadeUp>
          )}

          {/* Server Grid */}
          <div className="grid grid-cols-1 gap-4">
            {servers.map((server, index) => {
              const owned = isOwned(server.id);
              const stock = getStock(server.id);

              return (
                <FadeUp key={server.id}>
                  <motion.div
                    className={`relative overflow-hidden rounded-3xl border transition-all duration-300 ${server.glow} ${
                      owned 
                        ? 'border-primary/50 bg-primary/5' 
                        : stock.soldOut 
                        ? 'border-border/50 bg-muted/20 opacity-60' 
                        : 'border-white/10 bg-gradient-to-br from-white/5 to-transparent hover:border-white/20 shadow-2xl'
                    }`}
                    whileHover={!owned && !stock.soldOut ? { scale: 1.02, y: -4 } : undefined}
                    whileTap={!owned && !stock.soldOut ? { scale: 0.98 } : undefined}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    {/* Color accent bar */}
                    <div 
                      className="absolute top-0 left-0 right-0 h-1"
                      style={{ background: `linear-gradient(90deg, ${server.color}, transparent)` }}
                    />

                    <div className="p-5">
                      <div className="flex items-start justify-between">
                        {/* Left - Server Info */}
                        <div className="flex items-start gap-4">
                          {/* Server Icon */}
                          <div 
                            className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
                            style={{ 
                              background: `linear-gradient(135deg, ${server.color}30, ${server.color}10)`,
                              boxShadow: `0 0 30px ${server.color}20`
                            }}
                          >
                            <Server className="w-7 h-7" style={{ color: server.color }} />
                          </div>

                          {/* Server Details */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-bold text-foreground">{server.name}</h3>
                              <span 
                                className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
                                style={{ 
                                  background: `${server.color}20`,
                                  color: server.color
                                }}
                              >
                                {server.tier}
                              </span>
                            </div>
                            
                            <p className="text-sm text-muted-foreground font-medium">{server.hashRate}</p>

                            {/* Rewards */}
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-primary/10">
                                <BoltIcon size={12} />
                                <span className="text-xs font-bold text-primary">+{server.boltPerDay}</span>
                              </div>
                              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-500/10">
                                <UsdtIcon size={12} />
                                <span className="text-xs font-bold text-emerald-400">+${server.usdtPerDay.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Right - Price & Action */}
                        <div className="flex flex-col items-end gap-3">
                          <div className="text-right">
                            {server.priceTon === 0 ? (
                              <span className="text-2xl font-black text-emerald-400">FREE</span>
                            ) : (
                              <>
                                <div className="flex items-center gap-1.5">
                                  <TonIcon size={20} />
                                  <span className="text-2xl font-black text-foreground">{server.priceTon}</span>
                                </div>
                                <span className="text-xs text-muted-foreground">TON</span>
                              </>
                            )}
                          </div>

                          {owned ? (
                            <div className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary/20 text-primary text-sm font-bold">
                              <Check className="w-4 h-4" />
                              Owned
                            </div>
                          ) : stock.soldOut ? (
                            <div className="px-4 py-2 rounded-xl bg-muted/50 text-muted-foreground text-sm font-medium">
                              Sold Out
                            </div>
                          ) : (
                            <Button 
                              onClick={() => handleBuyClick(server)} 
                              size="sm"
                              className="font-bold shadow-lg bg-white text-black hover:bg-white/90"
                            >
                              {server.priceTon === 0 ? 'Claim Free' : 'Buy Now'}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </FadeUp>
              );
            })}
          </div>
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
