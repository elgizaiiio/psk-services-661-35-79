import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useViralMining } from '@/hooks/useViralMining';
import { useUserServers } from '@/hooks/useUserServers';
import { useTelegramBackButton } from '@/hooks/useTelegramBackButton';
import { Server, Check, Cpu, Activity, TrendingUp, HardDrive, Database, Cloud, Wifi, Globe, Shield, Layers } from 'lucide-react';
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
  icon: React.ElementType;
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
];

const tierConfig: Record<string, { color: string; bg: string; border: string }> = {
  Free: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  Basic: { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  Pro: { color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20' },
  Elite: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
};

const MiningServers = () => {
  const { user: telegramUser, isLoading: isTelegramLoading, hapticFeedback } = useTelegramAuth();
  const { user, loading: isMiningUserLoading } = useViralMining(telegramUser);
  const { servers: ownedServers, purchaseServer, getStock } = useUserServers(user?.id || null);
  const [selectedServer, setSelectedServer] = useState<MiningServer | null>(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  useTelegramBackButton();

  const isReady = !isTelegramLoading && !isMiningUserLoading;

  const handleBuyClick = async (server: MiningServer) => {
    if (!isReady || !user?.id) return;
    
    hapticFeedback?.impact?.('medium');
    
    const stock = getStock(server.id);
    if (stock.soldOut) {
      toast.error('Sold out!');
      return;
    }
    
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
    hashRate: ownedServers.reduce((sum, s) => sum + parseFloat(s.hash_rate), 0),
    boltPerDay: ownedServers.reduce((sum, s) => sum + s.daily_bolt_yield, 0),
    usdtPerDay: ownedServers.reduce((sum, s) => sum + s.daily_usdt_yield, 0),
  };

  return (
    <PageWrapper className="min-h-screen bg-background pb-32">
      <Helmet>
        <title>Mining Servers</title>
        <meta name="description" content="Buy mining servers to earn daily rewards." />
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

                return (
                  <FadeUp key={server.id}>
                  <motion.div
                    className={`relative p-4 rounded-2xl bg-card border transition-all ${
                      owned ? 'border-primary/30 opacity-80' : stock.soldOut ? 'border-border opacity-50' : 'border-border hover:border-primary/30'
                    }`}
                    whileHover={!owned && !stock.soldOut ? { scale: 1.01 } : undefined}
                    whileTap={!owned && !stock.soldOut ? { scale: 0.99 } : undefined}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >

                      <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${config.bg}`}>
                          <Icon className={`w-6 h-6 ${config.color}`} />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-foreground text-sm">{server.name}</h3>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${config.bg} ${config.color}`}>
                              {server.tier}
                            </span>
                          </div>
                          
                          <p className="text-xs text-muted-foreground mb-3">{server.hashRate}</p>
                          
                          {/* Earnings */}
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10">
                              <BoltIcon size={14} />
                              <span className="text-xs font-semibold text-primary">+{server.boltPerDay}/day</span>
                            </div>
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10">
                              <UsdtIcon size={14} />
                              <span className="text-xs font-semibold text-emerald-400">+${server.usdtPerDay.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Price & Action */}
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          {server.priceTon === 0 ? (
                            <span className="text-lg font-black text-emerald-400">FREE</span>
                          ) : (
                            <div className="flex items-center gap-1">
                              <TonIcon size={16} />
                              <span className="text-lg font-black text-foreground">{server.priceTon}</span>
                            </div>
                          )}

                          {owned ? (
                            <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/20 text-primary text-xs font-bold">
                              <Check className="w-3 h-3" />
                              Owned
                            </div>
                          ) : stock.soldOut ? (
                            <span className="text-xs text-muted-foreground">Sold Out</span>
                          ) : (
                            <Button 
                              onClick={() => handleBuyClick(server)} 
                              size="sm"
                              className="h-8 px-4 font-bold text-xs"
                            >
                              {server.priceTon === 0 ? 'Claim' : 'Buy'}
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
