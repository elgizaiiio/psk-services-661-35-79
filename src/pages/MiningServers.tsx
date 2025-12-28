import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useViralMining } from '@/hooks/useViralMining';
import { useUserServers } from '@/hooks/useUserServers';
import { Server, Zap, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useDirectTonPayment } from '@/hooks/useDirectTonPayment';

type MiningServer = {
  id: string;
  name: string;
  hashRate: string;
  hashRateNum: number;
  boltPerDay: number;
  usdtPerDay: number;
  price: number;
  tier: 'Basic' | 'Pro' | 'Elite';
};

const MiningServers = () => {
  const { user: telegramUser } = useTelegramAuth();
  const { user } = useViralMining(telegramUser);
  const { servers: ownedServers, purchaseServer } = useUserServers(user?.id || null);
  const [processingServer, setProcessingServer] = useState<string | null>(null);
  const { sendDirectPayment, isProcessing } = useDirectTonPayment();

  const servers: MiningServer[] = [
    { id: 'basic-1', name: 'Starter', hashRate: '2.5 TH/s', hashRateNum: 2.5, boltPerDay: 5, usdtPerDay: 0.01, price: 0.5, tier: 'Basic' },
    { id: 'basic-2', name: 'Basic', hashRate: '5.0 TH/s', hashRateNum: 5, boltPerDay: 10, usdtPerDay: 0.02, price: 1.0, tier: 'Basic' },
    { id: 'pro-1', name: 'Pro', hashRate: '8.0 TH/s', hashRateNum: 8, boltPerDay: 15, usdtPerDay: 0.03, price: 2.0, tier: 'Pro' },
    { id: 'pro-2', name: 'Advanced', hashRate: '12.0 TH/s', hashRateNum: 12, boltPerDay: 25, usdtPerDay: 0.05, price: 3.5, tier: 'Pro' },
    { id: 'elite-1', name: 'Elite', hashRate: '20.0 TH/s', hashRateNum: 20, boltPerDay: 40, usdtPerDay: 0.08, price: 6.0, tier: 'Elite' },
    { id: 'elite-2', name: 'Ultra', hashRate: '35.0 TH/s', hashRateNum: 35, boltPerDay: 70, usdtPerDay: 0.14, price: 10.0, tier: 'Elite' },
  ];

  const handlePurchase = async (server: MiningServer) => {
    if (!user?.id) {
      toast.error('Please login first');
      return;
    }

    setProcessingServer(server.id);
    
    const success = await sendDirectPayment({
      amount: server.price,
      description: `Server - ${server.name}`,
      productType: 'server_hosting',
      productId: server.id,
      serverName: server.name
    });

    if (success) {
      await purchaseServer(
        server.tier,
        server.name,
        server.hashRate,
        server.boltPerDay,
        server.usdtPerDay
      );
      toast.success('Server purchased!');
    }
    
    setProcessingServer(null);
  };

  const isOwned = (serverId: string) => {
    return ownedServers.some(s => s.server_name === servers.find(srv => srv.id === serverId)?.name);
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      <Helmet>
        <title>Mining Servers</title>
        <meta name="description" content="Buy mining servers" />
      </Helmet>

      <div className="max-w-md mx-auto px-5 pt-8 space-y-6">
        
        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold text-foreground">Mining Servers</h1>
          <p className="text-sm text-muted-foreground">Buy servers to earn BOLT & USDT daily</p>
        </div>

        {/* Balance */}
        {user && (
          <div className="p-4 rounded-xl bg-card border border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{telegramUser?.first_name}</p>
                <p className="text-xs text-muted-foreground">{ownedServers.length} servers owned</p>
              </div>
            </div>
            <p className="font-bold text-primary">{user.token_balance.toFixed(0)} BOLT</p>
          </div>
        )}

        {/* Servers Grid */}
        <div className="grid grid-cols-2 gap-3">
          {servers.map((server) => {
            const owned = isOwned(server.id);
            const processing = isProcessing && processingServer === server.id;
            
            return (
              <div 
                key={server.id} 
                className={`p-4 rounded-xl border ${
                  owned ? 'bg-primary/5 border-primary/20' : 'bg-card border-border'
                }`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Server className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">{server.name}</span>
                </div>
                
                <div className="space-y-1 mb-3">
                  <p className="text-xs text-muted-foreground">{server.hashRate}</p>
                  <p className="text-xs text-primary">+{server.boltPerDay} BOLT/day</p>
                  <p className="text-xs text-green-500">+${server.usdtPerDay} USDT/day</p>
                </div>

                {owned ? (
                  <div className="flex items-center justify-center gap-1 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium">
                    <Check className="w-4 h-4" />
                    Owned
                  </div>
                ) : (
                  <Button 
                    onClick={() => handlePurchase(server)}
                    className="w-full h-9 text-sm"
                    disabled={processing}
                  >
                    {processing ? '...' : `${server.price} TON`}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MiningServers;
