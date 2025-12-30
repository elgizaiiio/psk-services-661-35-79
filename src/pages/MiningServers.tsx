import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useViralMining } from '@/hooks/useViralMining';
import { useUserServers } from '@/hooks/useUserServers';
import { useTelegramBackButton } from '@/hooks/useTelegramBackButton';
import { Server, Check, Cpu, Activity, Zap, Crown, Star, Flame, ChevronRight, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { PageWrapper, FadeUp, StaggerContainer } from '@/components/ui/motion-wrapper';
import { BoltIcon, UsdtIcon, TonIcon } from '@/components/ui/currency-icons';
import { UnifiedPaymentModal } from '@/components/payment/UnifiedPaymentModal';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

type MiningServer = {
  id: string;
  name: string;
  hashRate: string;
  boltPerDay: number;
  usdtPerDay: number;
  priceTon: number;
  tier: 'Free' | 'Basic' | 'Pro' | 'Elite';
  icon: React.ElementType;
  gradient: string;
  borderColor: string;
  popular?: boolean;
};

const servers: MiningServer[] = [
  { 
    id: 'free-starter', 
    name: 'Free Starter', 
    hashRate: '1 TH/s', 
    boltPerDay: 10, 
    usdtPerDay: 0.01, 
    priceTon: 0, 
    tier: 'Free',
    icon: Zap,
    gradient: 'from-emerald-500/20 to-emerald-600/5',
    borderColor: 'border-emerald-500/30',
  },
  { 
    id: 'basic-1', 
    name: 'Starter Server', 
    hashRate: '5 TH/s', 
    boltPerDay: 50, 
    usdtPerDay: 0.05, 
    priceTon: 1.5, 
    tier: 'Basic',
    icon: Server,
    gradient: 'from-blue-500/20 to-blue-600/5',
    borderColor: 'border-blue-500/30',
  },
  { 
    id: 'basic-2', 
    name: 'Basic Server', 
    hashRate: '10 TH/s', 
    boltPerDay: 100, 
    usdtPerDay: 0.10, 
    priceTon: 2.5, 
    tier: 'Basic',
    icon: Server,
    gradient: 'from-cyan-500/20 to-cyan-600/5',
    borderColor: 'border-cyan-500/30',
  },
  { 
    id: 'pro-1', 
    name: 'Pro Server', 
    hashRate: '18 TH/s', 
    boltPerDay: 180, 
    usdtPerDay: 0.18, 
    priceTon: 4.0, 
    tier: 'Pro',
    icon: Flame,
    gradient: 'from-violet-500/20 to-violet-600/5',
    borderColor: 'border-violet-500/30',
    popular: true,
  },
  { 
    id: 'pro-2', 
    name: 'Advanced Server', 
    hashRate: '30 TH/s', 
    boltPerDay: 300, 
    usdtPerDay: 0.30, 
    priceTon: 6.5, 
    tier: 'Pro',
    icon: Flame,
    gradient: 'from-pink-500/20 to-pink-600/5',
    borderColor: 'border-pink-500/30',
  },
  { 
    id: 'elite-1', 
    name: 'Elite Server', 
    hashRate: '50 TH/s', 
    boltPerDay: 500, 
    usdtPerDay: 0.50, 
    priceTon: 10.0, 
    tier: 'Elite',
    icon: Crown,
    gradient: 'from-amber-500/20 to-amber-600/5',
    borderColor: 'border-amber-500/30',
  },
  { 
    id: 'elite-2', 
    name: 'Ultra Server', 
    hashRate: '100 TH/s', 
    boltPerDay: 1000, 
    usdtPerDay: 1.00, 
    priceTon: 18.0, 
    tier: 'Elite',
    icon: Star,
    gradient: 'from-red-500/20 to-red-600/5',
    borderColor: 'border-red-500/30',
  },
];

const tierColors: Record<string, string> = {
  Free: 'text-emerald-400 bg-emerald-500/10',
  Basic: 'text-blue-400 bg-blue-500/10',
  Pro: 'text-violet-400 bg-violet-500/10',
  Elite: 'text-amber-400 bg-amber-500/10',
};

const MiningServers = () => {
  const { user: telegramUser, isLoading: isTelegramLoading, hapticFeedback } = useTelegramAuth();
  const { user, loading: isMiningUserLoading } = useViralMining(telegramUser);
  const { servers: ownedServers, purchaseServer, getStock } = useUserServers(user?.id || null);
  const [selectedServer, setSelectedServer] = useState<MiningServer | null>(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('all');
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

  const filteredServers = activeTab === 'all' 
    ? servers 
    : servers.filter(s => s.tier.toLowerCase() === activeTab);

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
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-foreground">Mining Servers</h1>
                <p className="text-sm text-muted-foreground">Passive income 24/7</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <Cpu className="w-6 h-6 text-primary" />
              </div>
            </div>
          </FadeUp>

          {/* Stats Card */}
          {totalStats.servers > 0 && (
            <FadeUp>
              <motion.div 
                className="p-4 rounded-2xl bg-gradient-to-r from-primary/10 to-transparent border border-primary/20"
                whileHover={{ scale: 1.01 }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center">
                    <Activity className="w-7 h-7 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-muted-foreground">Active Servers</span>
                      <span className="text-lg font-bold text-foreground">{totalStats.servers}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{totalStats.hashRate} TH/s</span>
                      <div className="flex items-center gap-3">
                        <span className="text-primary font-medium">+{totalStats.boltPerDay} BOLT</span>
                        <span className="text-emerald-400 font-medium">+${totalStats.usdtPerDay.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </FadeUp>
          )}

          {/* Filter Tabs */}
          <FadeUp>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-5 h-10 bg-card border border-border">
                <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                <TabsTrigger value="free" className="text-xs">Free</TabsTrigger>
                <TabsTrigger value="basic" className="text-xs">Basic</TabsTrigger>
                <TabsTrigger value="pro" className="text-xs">Pro</TabsTrigger>
                <TabsTrigger value="elite" className="text-xs">Elite</TabsTrigger>
              </TabsList>
            </Tabs>
          </FadeUp>

          {/* Server List */}
          <AnimatePresence mode="wait">
            <motion.div 
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              {filteredServers.map((server, index) => {
                const owned = isOwned(server.id);
                const stock = getStock(server.id);
                const Icon = server.icon;

                return (
                  <FadeUp key={server.id}>
                    <motion.div
                      className={`relative overflow-hidden rounded-2xl border transition-all bg-gradient-to-br ${server.gradient} ${server.borderColor} ${
                        owned ? 'opacity-70' : stock.soldOut ? 'opacity-50' : ''
                      }`}
                      whileHover={!owned && !stock.soldOut ? { scale: 1.01 } : undefined}
                      whileTap={!owned && !stock.soldOut ? { scale: 0.99 } : undefined}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      {/* Popular Badge */}
                      {server.popular && !owned && (
                        <div className="absolute top-0 right-0 px-3 py-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-bl-xl">
                          POPULAR
                        </div>
                      )}

                      <div className="p-4">
                        <div className="flex items-center gap-4">
                          {/* Icon */}
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${tierColors[server.tier]}`}>
                            <Icon className="w-7 h-7" />
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-bold text-foreground truncate">{server.name}</h3>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tierColors[server.tier]}`}>
                                {server.tier}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mb-2">{server.hashRate}</p>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-background/50">
                                <BoltIcon size={12} />
                                <span className="text-[11px] font-semibold text-primary">+{server.boltPerDay}/day</span>
                              </div>
                              <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-background/50">
                                <UsdtIcon size={12} />
                                <span className="text-[11px] font-semibold text-emerald-400">+${server.usdtPerDay.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Price & Action */}
                          <div className="flex flex-col items-end gap-2">
                            {server.priceTon === 0 ? (
                              <span className="text-lg font-black text-emerald-400">FREE</span>
                            ) : (
                              <div className="flex items-center gap-1">
                                <TonIcon size={18} />
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
                      </div>
                    </motion.div>
                  </FadeUp>
                );
              })}

              {filteredServers.length === 0 && (
                <div className="text-center py-12">
                  <Server className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">No servers in this category</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* ROI Info */}
          <FadeUp>
            <div className="p-4 rounded-2xl bg-card border border-border">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <span className="font-semibold text-foreground">Earnings</span>
              </div>
              <p className="text-xs text-muted-foreground">
                All servers generate passive income 24/7. BOLT and USDT rewards are automatically added to your balance daily.
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