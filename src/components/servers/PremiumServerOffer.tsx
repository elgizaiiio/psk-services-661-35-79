import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Gift, Crown, Sparkles, Gem } from 'lucide-react';
import { useDirectTonPayment } from '@/hooks/useDirectTonPayment';
import { toast } from 'sonner';
import { BoltIcon, UsdtIcon, TonIcon, EthIcon, ViralIcon } from '@/components/ui/currency-icons';
import serverOfferBanner from '@/assets/server-offer-banner.png';

interface PremiumServer {
  id: string;
  name: string;
  price: number;
  hashRate: string;
  boltPerDay: number;
  usdtPerDay: number;
  tonPerDay: number;
  ethPerDay: number;
  viralPerDay: number;
  icon: React.ElementType;
  tier: 'legendary';
}

const premiumServers: PremiumServer[] = [
  {
    id: 'legendary-1',
    name: 'Legend',
    price: 50,
    hashRate: '500 TH/s',
    boltPerDay: 25000,
    usdtPerDay: 5.00,
    tonPerDay: 0.08,
    ethPerDay: 0.005,
    viralPerDay: 5000,
    icon: Crown,
    tier: 'legendary'
  },
  {
    id: 'mythic-1',
    name: 'Mythic',
    price: 100,
    hashRate: '1000 TH/s',
    boltPerDay: 60000,
    usdtPerDay: 12.00,
    tonPerDay: 0.15,
    ethPerDay: 0.01,
    viralPerDay: 10000,
    icon: Gem,
    tier: 'legendary'
  }
];

const tierColors = {
  legendary: 'from-amber-500/20 to-amber-500/5 border-amber-500/30',
};

const tierIconColors = {
  legendary: 'text-amber-500 bg-amber-500/10',
};

const generateRandomGift = (): number => {
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

  const handlePurchase = async (server: PremiumServer) => {
    if (!isWalletConnected) {
      toast.error('Please connect your TON wallet first');
      return;
    }
    
    setSelectedServer(server.id);
    
    const success = await sendDirectPayment({
      amount: server.price,
      description: `${server.name} Server + Mystery Gift`,
      productType: 'server_hosting',
      productId: server.id,
      serverName: server.name
    });

    if (success) {
      const gift = generateRandomGift();
      setWonGift(gift);
      toast.success(`Server purchased! You won a $${gift} bonus gift!`);
      setTimeout(() => setWonGift(null), 3000);
    }
    
    setSelectedServer(null);
  };

  return (
    <div className="space-y-3">
      {/* Banner */}
      {showBanner && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl"
        >
          <img 
            src={serverOfferBanner} 
            alt="Server Offer"
            className="w-full h-auto aspect-[16/9] object-cover"
          />
        </motion.div>
      )}

      {/* Gift Won Notification */}
      {wonGift && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="p-4 rounded-xl bg-gradient-to-r from-primary/20 to-primary/10 border border-primary/30 text-center"
        >
          <Gift className="w-8 h-8 text-primary mx-auto mb-2" />
          <p className="text-lg font-bold text-primary">You Won ${wonGift}!</p>
          <p className="text-xs text-muted-foreground">Added to your balance</p>
        </motion.div>
      )}

      {/* Server Cards - Same design as MiningServers page */}
      <div className="space-y-3">
        {premiumServers.map((server, index) => {
          const Icon = server.icon;
          const isSelected = selectedServer === server.id;

          return (
            <motion.div
              key={server.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`p-4 rounded-2xl border transition-all duration-200 bg-gradient-to-br ${tierColors[server.tier]} hover:scale-[1.01] cursor-pointer relative`}
              onClick={() => !isProcessing && handlePurchase(server)}
            >
              {/* Gift Badge */}
              <div className="absolute top-3 right-3">
                <Badge className="bg-primary text-primary-foreground text-[10px] px-2 py-0.5">
                  <Gift className="w-3 h-3 mr-1" />
                  +$50-999 GIFT
                </Badge>
              </div>

              {/* Server Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${tierIconColors[server.tier]}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground">{server.name}</h3>
                    <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-medium">
                      MEGA OFFER
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{server.hashRate} Hash Rate</p>
                </div>
                
                {/* Price */}
                <div className="text-right">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/20">
                    <TonIcon size={18} />
                    <span className="text-sm font-semibold text-sky-500">{server.price}</span>
                  </div>
                </div>
              </div>

              {/* Daily Earnings Grid - Same as MiningServers */}
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

              {/* Loading indicator */}
              {isProcessing && isSelected && (
                <div className="absolute inset-0 bg-background/50 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Info */}
      <div className="p-3 rounded-xl bg-primary/5 border border-primary/20">
        <div className="flex items-center gap-2">
          <Gift className="w-5 h-5 text-primary flex-shrink-0" />
          <p className="text-xs text-muted-foreground">
            Every purchase includes a random bonus gift worth $50 to $999
          </p>
        </div>
      </div>
    </div>
  );
};

export default PremiumServerOffer;
