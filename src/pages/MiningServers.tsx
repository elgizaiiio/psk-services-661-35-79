import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useViralMining } from '@/hooks/useViralMining';
import UserAvatar from '@/components/UserAvatar';
import { 
  Server, 
  Zap, 
  ShoppingCart,
  ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';
import { useDirectTonPayment } from '@/hooks/useDirectTonPayment';
import { useNavigate } from 'react-router-dom';

type MiningServer = {
  id: string;
  name: string;
  hashRate: string;
  price: number;
  tier: 'Basic' | 'Pro' | 'Elite';
};

const RECEIVER_ADDRESS = "UQALON5gUq_kQzpTq2GkPeHQABL1nOeAuWwRPGPNkzDz_lZZ";

const MiningServersInner = () => {
  const navigate = useNavigate();
  const { user: telegramUser, hapticFeedback } = useTelegramAuth();
  const { user } = useViralMining(telegramUser);
  const [ownedServers, setOwnedServers] = useState<Set<string>>(new Set(['server-1']));
  const [processingServer, setProcessingServer] = useState<string | null>(null);
  const { sendDirectPayment, isProcessing } = useDirectTonPayment();

  const servers: MiningServer[] = [
    {
      id: 'server-1',
      name: 'Basic Miner',
      hashRate: '2.5 TH/s',
      price: 0.5,
      tier: 'Basic'
    },
    {
      id: 'server-2',
      name: 'Pro Miner',
      hashRate: '8.0 TH/s',
      price: 0.6,
      tier: 'Pro'
    },
    {
      id: 'server-3',
      name: 'Elite Miner',
      hashRate: '20.0 TH/s',
      price: 8.0,
      tier: 'Elite'
    },
    {
      id: 'server-4',
      name: 'Standard Miner',
      hashRate: '5.2 TH/s',
      price: 1.5,
      tier: 'Basic'
    },
    {
      id: 'server-5',
      name: 'Advanced Miner',
      hashRate: '12.5 TH/s',
      price: 4.5,
      tier: 'Pro'
    },
    {
      id: 'server-6',
      name: 'Turbo Miner',
      hashRate: '18.8 TH/s',
      price: 6.5,
      tier: 'Pro'
    },
    {
      id: 'server-7',
      name: 'Ultra Miner',
      hashRate: '35.0 TH/s',
      price: 12.0,
      tier: 'Elite'
    },
    {
      id: 'server-8',
      name: 'Mega Miner',
      hashRate: '28.5 TH/s',
      price: 10.0,
      tier: 'Elite'
    },
    {
      id: 'server-9',
      name: 'Speed Miner',
      hashRate: '15.2 TH/s',
      price: 5.0,
      tier: 'Pro'
    },
    {
      id: 'server-10',
      name: 'Power Miner',
      hashRate: '22.8 TH/s',
      price: 7.5,
      tier: 'Elite'
    },
    {
      id: 'server-11',
      name: 'Boost Miner',
      hashRate: '6.8 TH/s',
      price: 2.0,
      tier: 'Basic'
    },
    {
      id: 'server-12',
      name: 'Supreme Miner',
      hashRate: '45.0 TH/s',
      price: 15.0,
      tier: 'Elite'
    }
  ];

  const handlePurchase = async (server: MiningServer) => {
    setProcessingServer(server.id);
    
    const success = await sendDirectPayment({
      amount: server.price,
      description: `Mining Server - ${server.name}`,
      productType: 'server_hosting',
      productId: server.id,
      serverName: server.name
    });

    if (success) {
      setOwnedServers(prev => new Set([...prev, server.id]));
      toast.success('Mining server purchased successfully! 🎉');
    }
    
    setProcessingServer(null);
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Basic': return 'bg-primary/10 text-primary';
      case 'Pro': return 'bg-accent/10 text-accent-foreground';
      case 'Elite': return 'bg-destructive/10 text-destructive';
      default: return 'bg-muted';
    }
  };

  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-md mx-auto p-4 space-y-4">
        <Helmet>
          <title>Mining Servers</title>
        </Helmet>

        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="font-bold">Mining Servers</h1>
          <div />
        </div>

        {/* User Balance */}
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserAvatar user={telegramUser} size="sm" />
                <span className="font-medium">{telegramUser?.first_name}</span>
              </div>
              {user && (
                <div className="text-right">
                  <p className="font-bold text-primary">{user.token_balance.toFixed(1)} VIRAL</p>
                  <p className="text-xs text-muted-foreground">{ownedServers.size} servers</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Servers */}
        <div className="space-y-3">
          {servers.map((server) => {
            const isOwned = ownedServers.has(server.id);
            return (
              <Card key={server.id} className={isOwned ? 'border-primary/30' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Server className="w-4 h-4" />
                      <span className="font-medium">{server.name}</span>
                    </div>
                    <Badge className={getTierColor(server.tier)} variant="outline">
                      {server.tier}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1 text-sm">
                      <Zap className="w-3 h-3 text-primary" />
                      <span>{server.hashRate}</span>
                    </div>
                    <span className="text-lg font-bold text-primary">{server.price} TON</span>
                  </div>

                  {isOwned ? (
                    <Badge className="w-full justify-center bg-green-500/10 text-green-600 border-green-500/30">
                      Owned ✓
                    </Badge>
                  ) : (
                    <Button 
                      onClick={() => handlePurchase(server)}
                      className="w-full"
                      size="sm"
                      disabled={isProcessing && processingServer === server.id}
                    >
                      {isProcessing && processingServer === server.id ? (
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                          Processing payment...
                        </div>
                      ) : (
                        <>
                          <ShoppingCart className="w-3 h-3 mr-1" />
                          Buy with TON
                        </>
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MiningServersInner;
