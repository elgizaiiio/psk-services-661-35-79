import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useViralMining } from '@/hooks/useViralMining';
import { useUserServers } from '@/hooks/useUserServers';
import { useTonPrice } from '@/hooks/useTonPrice';
import { Server, Check } from 'lucide-react';
import { toast } from 'sonner';
import { PageWrapper, FadeUp } from '@/components/ui/motion-wrapper';
import { BoltIcon, UsdtIcon } from '@/components/ui/currency-icons';
import { UnifiedPaymentModal } from '@/components/payment/UnifiedPaymentModal';

type MiningServer = {
  id: string;
  name: string;
  hashRate: string;
  boltPerDay: number;
  usdtPerDay: number;
  price: number;
  tier: 'Basic' | 'Pro' | 'Elite';
};

const servers: MiningServer[] = [
  { id: 'basic-1', name: 'Starter', hashRate: '2.5 TH/s', boltPerDay: 15, usdtPerDay: 0.05, price: 1.5, tier: 'Basic' },
  { id: 'basic-2', name: 'Basic', hashRate: '5.0 TH/s', boltPerDay: 30, usdtPerDay: 0.10, price: 2.5, tier: 'Basic' },
  { id: 'pro-1', name: 'Pro', hashRate: '8.0 TH/s', boltPerDay: 50, usdtPerDay: 0.18, price: 4.0, tier: 'Pro' },
  { id: 'pro-2', name: 'Advanced', hashRate: '12.0 TH/s', boltPerDay: 80, usdtPerDay: 0.28, price: 6.5, tier: 'Pro' },
  { id: 'elite-1', name: 'Elite', hashRate: '20.0 TH/s', boltPerDay: 120, usdtPerDay: 0.45, price: 10.0, tier: 'Elite' },
  { id: 'elite-2', name: 'Ultra', hashRate: '35.0 TH/s', boltPerDay: 200, usdtPerDay: 0.80, price: 18.0, tier: 'Elite' },
];

const MiningServers = () => {
  const { user: telegramUser, isLoading: isTelegramLoading } = useTelegramAuth();
  const { user, loading: isMiningUserLoading } = useViralMining(telegramUser);
  const { servers: ownedServers, purchaseServer, getStock } = useUserServers(user?.id || null);
  const [selectedServer, setSelectedServer] = useState<MiningServer | null>(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const { tonToUsd } = useTonPrice();

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

  return (
    <PageWrapper className="min-h-screen bg-background pb-32">
      <Helmet>
        <title>Mining Servers</title>
        <meta name="description" content="Buy mining servers to earn daily rewards." />
      </Helmet>

      <div className="max-w-md mx-auto px-4 pt-10">
        {/* Header */}
        <FadeUp>
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground">Servers</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {ownedServers.length} owned
            </p>
          </div>
        </FadeUp>

        {/* Server Grid */}
        <div className="grid grid-cols-2 gap-3">
          {servers.map((server) => {
            const owned = isOwned(server.id);
            const stock = getStock(server.id);

            return (
              <FadeUp key={server.id}>
                <motion.div
                  className={`p-4 rounded-2xl border transition-all ${
                    owned
                      ? 'bg-primary/5 border-primary/30'
                      : stock.soldOut
                      ? 'bg-muted/30 border-border opacity-50'
                      : 'bg-card border-border'
                  }`}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Server Name */}
                  <div className="flex items-center gap-2 mb-3">
                    <Server className="w-4 h-4 text-primary" />
                    <span className="font-semibold text-foreground">{server.name}</span>
                  </div>

                  {/* Hash Rate */}
                  <p className="text-xs text-muted-foreground mb-2">{server.hashRate}</p>

                  {/* Rewards */}
                  <div className="space-y-1 mb-4">
                    <div className="flex items-center gap-1 text-xs">
                      <BoltIcon size={12} />
                      <span className="text-primary font-medium">+{server.boltPerDay}/day</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                      <UsdtIcon size={12} />
                      <span className="text-muted-foreground">+${server.usdtPerDay}/day</span>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-3">
                    <p className="text-lg font-bold text-foreground">{server.price} TON</p>
                  </div>

                  {/* Action */}
                  {owned ? (
                    <div className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-primary/10 text-primary text-sm font-medium">
                      <Check className="w-4 h-4" />
                      Owned
                    </div>
                  ) : stock.soldOut ? (
                    <div className="py-2 text-center rounded-xl bg-muted text-muted-foreground text-sm">
                      Sold Out
                    </div>
                  ) : (
                    <Button onClick={() => handleBuyClick(server)} className="w-full h-9 text-sm">
                      Buy
                    </Button>
                  )}
                </motion.div>
              </FadeUp>
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
          amount={tonToUsd(selectedServer.price)}
          description={`Server - ${selectedServer.name}`}
          productType="server_hosting"
          productId={selectedServer.id}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </PageWrapper>
  );
};

export default MiningServers;
