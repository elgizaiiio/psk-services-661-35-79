import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useViralMining } from '@/hooks/useViralMining';
import { useUserServers } from '@/hooks/useUserServers';
import { useTonPrice } from '@/hooks/useTonPrice';
import { Server, Check, Loader2, ArrowLeft, Package } from 'lucide-react';
import { toast } from 'sonner';
import { useDirectTonPayment } from '@/hooks/useDirectTonPayment';
import { useNavigate } from 'react-router-dom';
import { PageWrapper, StaggerContainer, FadeUp, AnimatedNumber } from '@/components/ui/motion-wrapper';
import { BoltIcon, TonIcon, UsdtIcon } from '@/components/ui/currency-icons';

type MiningServer = { id: string; name: string; hashRate: string; hashRateNum: number; boltPerDay: number; usdtPerDay: number; price: number; tier: 'Basic' | 'Pro' | 'Elite'; };

const MiningServers = () => {
  const navigate = useNavigate();
  const { user: telegramUser, isLoading: isTelegramLoading } = useTelegramAuth();
  const { user, loading: isMiningUserLoading, error: miningUserError } = useViralMining(telegramUser);
  const { servers: ownedServers, purchaseServer, getStock } = useUserServers(user?.id || null);
  const [processingServer, setProcessingServer] = useState<string | null>(null);
  const { sendDirectPayment, isProcessing, isWalletConnected } = useDirectTonPayment();
  const { formatUsd } = useTonPrice();

  const servers: MiningServer[] = [
    { id: 'basic-1', name: 'Starter', hashRate: '2.5 TH/s', hashRateNum: 2.5, boltPerDay: 15, usdtPerDay: 0.05, price: 0.5, tier: 'Basic' },
    { id: 'basic-2', name: 'Basic', hashRate: '5.0 TH/s', hashRateNum: 5, boltPerDay: 30, usdtPerDay: 0.10, price: 1.0, tier: 'Basic' },
    { id: 'pro-1', name: 'Pro', hashRate: '8.0 TH/s', hashRateNum: 8, boltPerDay: 50, usdtPerDay: 0.18, price: 2.0, tier: 'Pro' },
    { id: 'pro-2', name: 'Advanced', hashRate: '12.0 TH/s', hashRateNum: 12, boltPerDay: 80, usdtPerDay: 0.28, price: 3.5, tier: 'Pro' },
    { id: 'elite-1', name: 'Elite', hashRate: '20.0 TH/s', hashRateNum: 20, boltPerDay: 120, usdtPerDay: 0.45, price: 6.0, tier: 'Elite' },
    { id: 'elite-2', name: 'Ultra', hashRate: '35.0 TH/s', hashRateNum: 35, boltPerDay: 200, usdtPerDay: 0.80, price: 10.0, tier: 'Elite' },
  ];

  const handlePurchase = async (server: MiningServer) => {
    if (isTelegramLoading || isMiningUserLoading) {
      toast.error('Loading your account… please wait.');
      return;
    }

    if (miningUserError) {
      toast.error('Could not load your account. Please refresh and try again.');
      return;
    }

    if (!telegramUser) {
      toast.error('Please open the app in Telegram to use Mining Servers.');
      return;
    }

    if (!user?.id) {
      toast.error('Account not ready yet. Please try again in a moment.');
      return;
    }

    if (!isWalletConnected) {
      toast.error('Please connect your TON wallet first');
      return;
    }

    const stock = getStock(server.id);
    if (stock.soldOut) {
      toast.error('This server is sold out!');
      return;
    }
    setProcessingServer(server.id);

    const success = await sendDirectPayment({
      amount: server.price,
      description: `Server - ${server.name}`,
      productType: 'server_hosting',
      productId: server.id,
      serverName: server.name,
    });

    if (success) {
      await purchaseServer(server.id, server.tier, server.name, server.hashRate, server.boltPerDay, server.usdtPerDay);
      toast.success('Server purchased!');
    }

    setProcessingServer(null);
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  const isOwned = (serverId: string) => ownedServers.some(s => s.server_name === servers.find(srv => srv.id === serverId)?.name);

  return (
    <PageWrapper className="min-h-screen bg-background pb-40">
      <Helmet><title>Mining Servers | Bolt</title></Helmet>
      <div className="max-w-md mx-auto px-5 pt-8">
        <StaggerContainer className="space-y-6">
          <FadeUp>
            <div className="flex items-center gap-3">
              <motion.button onClick={handleBack} whileTap={{ scale: 0.9 }} className="w-10 h-10 bg-card border border-border rounded-xl flex items-center justify-center">
                <ArrowLeft className="w-5 h-5 text-foreground" />
              </motion.button>
              <div><h1 className="text-xl font-semibold text-foreground">Mining Servers</h1><p className="text-sm text-muted-foreground">Buy servers to earn daily</p></div>
            </div>
          </FadeUp>

          {user && (
            <FadeUp>
              <div className="p-4 rounded-xl bg-card border border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BoltIcon size={40} />
                  <div><p className="text-sm font-medium text-foreground">{telegramUser?.first_name}</p><p className="text-xs text-muted-foreground">{ownedServers.length} servers</p></div>
                </div>
                <p className="font-bold text-primary"><AnimatedNumber value={user.token_balance} decimals={0} duration={0.8} /> BOLT</p>
              </div>
            </FadeUp>
          )}

          <div className="grid grid-cols-2 gap-3">
            {servers.map((server) => {
              const owned = isOwned(server.id);
              const processing = isProcessing && processingServer === server.id;
              const stock = getStock(server.id);
              const stockPercent = stock.total > 0 ? ((stock.total - stock.remaining) / stock.total) * 100 : 0;
              
              return (
                <FadeUp key={server.id}>
                  <motion.div className={`p-4 rounded-xl border ${owned ? 'bg-primary/5 border-primary/20' : stock.soldOut ? 'bg-muted/50 border-border opacity-60' : 'bg-card border-border'}`} whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
                    <div className="flex items-center gap-2 mb-3"><Server className="w-4 h-4 text-primary" /><span className="text-sm font-medium text-foreground">{server.name}</span></div>
                    <div className="space-y-1 mb-3">
                      <p className="text-xs text-muted-foreground">{server.hashRate}</p>
                      <p className="text-xs text-primary flex items-center gap-1"><BoltIcon size={12} />+{server.boltPerDay}/day</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1"><UsdtIcon size={12} />+${server.usdtPerDay}/day</p>
                    </div>
                    
                    {/* Price display */}
                    <div className="mb-3 p-2 rounded-lg bg-muted/30">
                      <p className="text-lg font-bold text-primary">{formatUsd(server.price)}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <TonIcon size={12} />{server.price} TON
                      </p>
                    </div>
                    
                    {/* Stock indicator */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground flex items-center gap-1"><Package className="w-3 h-3" />Stock</span>
                        <span className={stock.soldOut ? 'text-destructive font-medium' : stock.remaining < 20 ? 'text-orange-500 font-medium' : 'text-muted-foreground'}>
                          {stock.soldOut ? 'Sold Out' : `${stock.remaining}/${stock.total}`}
                        </span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <motion.div 
                          className={`h-full ${stock.soldOut ? 'bg-destructive' : stockPercent > 80 ? 'bg-orange-500' : 'bg-primary'}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${stockPercent}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                    </div>
                    
                    {owned ? (
                      <motion.div className="flex items-center justify-center gap-1 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium" initial={{ scale: 0.9 }} animate={{ scale: 1 }}><Check className="w-4 h-4" />Owned</motion.div>
                    ) : stock.soldOut ? (
                      <div className="flex items-center justify-center gap-1 py-2 rounded-lg bg-muted text-muted-foreground text-sm font-medium">Sold Out</div>
                    ) : (
                      <Button onClick={() => handlePurchase(server)} className="w-full h-9 text-sm" disabled={processing}>
                        {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Buy Now'}
                      </Button>
                    )}
                  </motion.div>
                </FadeUp>
              );
            })}
          </div>
        </StaggerContainer>
      </div>
    </PageWrapper>
  );
};

export default MiningServers;
