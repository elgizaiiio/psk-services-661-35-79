import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Gift, Crown, Sparkles, Server, Star, Zap, Flame, Diamond } from 'lucide-react';
import { useDirectTonPayment } from '@/hooks/useDirectTonPayment';
import { useTonPrice } from '@/hooks/useTonPrice';
import { toast } from 'sonner';
import serverOfferBanner from '@/assets/server-offer-banner.png';

interface PremiumServer {
  id: string;
  name: string;
  price: number;
  specs: {
    cpu: string;
    ram: string;
    storage: string;
    bandwidth: string;
  };
  icon: React.ElementType;
  gradient: string;
  borderColor: string;
}

const premiumServers: PremiumServer[] = [
  {
    id: 'premium-50',
    name: 'Premium Elite',
    price: 50,
    specs: {
      cpu: '16 vCPU',
      ram: '32GB RAM',
      storage: '500GB NVMe',
      bandwidth: '10TB Transfer'
    },
    icon: Crown,
    gradient: 'from-amber-500/20 to-yellow-500/20',
    borderColor: 'border-amber-500/40'
  },
  {
    id: 'premium-70',
    name: 'Premium Ultra',
    price: 70,
    specs: {
      cpu: '24 vCPU',
      ram: '64GB RAM',
      storage: '1TB NVMe',
      bandwidth: '20TB Transfer'
    },
    icon: Star,
    gradient: 'from-purple-500/20 to-pink-500/20',
    borderColor: 'border-purple-500/40'
  },
  {
    id: 'premium-85',
    name: 'Premium Legendary',
    price: 85,
    specs: {
      cpu: '32 vCPU',
      ram: '128GB RAM',
      storage: '2TB NVMe',
      bandwidth: '50TB Transfer'
    },
    icon: Flame,
    gradient: 'from-orange-500/20 to-red-500/20',
    borderColor: 'border-orange-500/40'
  },
  {
    id: 'premium-100',
    name: 'Premium Divine',
    price: 100,
    specs: {
      cpu: '48 vCPU',
      ram: '256GB RAM',
      storage: '4TB NVMe',
      bandwidth: 'Unlimited'
    },
    icon: Diamond,
    gradient: 'from-cyan-500/20 to-blue-500/20',
    borderColor: 'border-cyan-500/40'
  }
];

const generateRandomGift = (): number => {
  // Random gift between $50 and $999
  const weights = [
    { min: 50, max: 100, probability: 0.5 },
    { min: 100, max: 300, probability: 0.3 },
    { min: 300, max: 600, probability: 0.15 },
    { min: 600, max: 999, probability: 0.05 }
  ];
  
  const rand = Math.random();
  let cumulative = 0;
  
  for (const weight of weights) {
    cumulative += weight.probability;
    if (rand <= cumulative) {
      return Math.floor(Math.random() * (weight.max - weight.min + 1)) + weight.min;
    }
  }
  
  return 50;
};

interface PremiumServerOfferProps {
  showBanner?: boolean;
}

const PremiumServerOffer: React.FC<PremiumServerOfferProps> = ({ showBanner = true }) => {
  const [selectedServer, setSelectedServer] = useState<string | null>(null);
  const [wonGift, setWonGift] = useState<number | null>(null);
  const { sendDirectPayment, isProcessing, isWalletConnected } = useDirectTonPayment();
  const { formatUsd } = useTonPrice();

  const handlePurchase = async (server: PremiumServer) => {
    if (!isWalletConnected) {
      toast.error('Please connect your TON wallet first');
      return;
    }
    
    setSelectedServer(server.id);
    
    const success = await sendDirectPayment({
      amount: server.price,
      description: `Premium Server - ${server.name} + Mystery Gift`,
      productType: 'server_hosting',
      productId: server.id,
      serverName: server.name
    });

    if (success) {
      const gift = generateRandomGift();
      setWonGift(gift);
      toast.success(
        <div className="flex flex-col gap-1">
          <span className="font-bold">🎉 Server purchased!</span>
          <span className="text-emerald-400">You won a ${gift} bonus gift!</span>
        </div>
      );
      
      // Reset after 3 seconds
      setTimeout(() => setWonGift(null), 3000);
    }
    
    setSelectedServer(null);
  };

  return (
    <div className="space-y-4">
      {/* Banner */}
      {showBanner && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl"
        >
          <img 
            src={serverOfferBanner} 
            alt="Premium Server Offer"
            className="w-full h-auto aspect-[16/9] object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <Badge className="bg-primary text-primary-foreground mb-2">
              <Sparkles className="w-3 h-3 mr-1" />
              LIMITED OFFER
            </Badge>
            <h2 className="text-xl font-bold text-white">
              Buy Server, Win Gift up to $999!
            </h2>
            <p className="text-sm text-white/80">
              Premium servers 50-100 TON with random bonus
            </p>
          </div>
        </motion.div>
      )}

      {/* Gift Won Notification */}
      {wonGift && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/20 to-green-500/20 border border-emerald-500/40 text-center"
        >
          <Gift className="w-10 h-10 text-emerald-400 mx-auto mb-2 animate-bounce" />
          <p className="text-lg font-bold text-emerald-400">
            🎁 You Won ${wonGift}!
          </p>
          <p className="text-xs text-muted-foreground">
            Added to your account balance
          </p>
        </motion.div>
      )}

      {/* Server Cards */}
      <div className="space-y-4">
        {premiumServers.map((server, index) => {
          const ServerIcon = server.icon;
          const isSelected = selectedServer === server.id;
          
          return (
            <motion.div
              key={server.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`relative overflow-hidden border-2 ${server.borderColor} bg-gradient-to-br ${server.gradient} transition-all duration-300 hover:shadow-xl`}>
                {/* Gift Badge */}
                <div className="absolute top-3 right-3">
                  <Badge className="bg-emerald-500 text-white animate-pulse">
                    <Gift className="w-3 h-3 mr-1" />
                    +$50-999
                  </Badge>
                </div>

                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${server.gradient} border ${server.borderColor} flex items-center justify-center`}>
                      <ServerIcon className="w-7 h-7 text-primary" />
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">{server.name}</h3>
                      <div className="grid grid-cols-2 gap-2 mt-2 text-xs text-muted-foreground">
                        <span>• {server.specs.cpu}</span>
                        <span>• {server.specs.ram}</span>
                        <span>• {server.specs.storage}</span>
                        <span>• {server.specs.bandwidth}</span>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">
                        {server.price} TON
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatUsd(server.price)}
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => handlePurchase(server)}
                    disabled={isProcessing && isSelected}
                    className="w-full mt-4 h-12 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                  >
                    {isProcessing && isSelected ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        Processing...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Server className="w-4 h-4" />
                        Buy + Get Mystery Gift
                      </div>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Info Section */}
      <Card className="p-4 bg-primary/5 border-primary/20">
        <div className="flex items-start gap-3">
          <Gift className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-sm">Mystery Gift Included</h4>
            <p className="text-xs text-muted-foreground mt-1">
              Every purchase includes a random bonus gift worth $50 to $999! 
              The gift is instantly added to your account balance.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PremiumServerOffer;
