import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Server, 
  Zap, 
  Crown,
  Star,
  ShoppingBag,
  CheckCircle,
  Cpu,
  HardDrive,
  Wifi,
  Database
} from 'lucide-react';
import { useDirectTonPayment } from '@/hooks/useDirectTonPayment';
import { useTonPrice } from '@/hooks/useTonPrice';
import { toast } from 'sonner';
import { TonIcon } from '@/components/ui/currency-icons';
import { motion } from 'motion/react';

const serverPackages = [
  {
    id: 1,
    name: 'Starter',
    specs: { cpu: '1 vCPU', ram: '2GB', storage: '25GB SSD', bandwidth: '500GB' },
    price: 0.3,
    features: ['99.9% Uptime', 'Basic Support', 'SSL'],
    tier: 'starter' as const,
  },
  {
    id: 2,
    name: 'Business',
    specs: { cpu: '2 vCPU', ram: '4GB', storage: '50GB SSD', bandwidth: '1TB' },
    price: 0.8,
    features: ['99.95% Uptime', 'Priority Support', 'Free SSL', 'Backups'],
    tier: 'business' as const,
    popular: true,
  },
  {
    id: 3,
    name: 'Performance',
    specs: { cpu: '4 vCPU', ram: '8GB', storage: '100GB NVMe', bandwidth: '2TB' },
    price: 1.8,
    features: ['99.99% Uptime', '24/7 Support', 'DDoS Protection'],
    tier: 'performance' as const,
  },
  {
    id: 4,
    name: 'Enterprise',
    specs: { cpu: '8 vCPU', ram: '16GB', storage: '200GB NVMe', bandwidth: 'Unlimited' },
    price: 3.5,
    features: ['99.999% Uptime', 'Dedicated Support', 'Custom Solutions'],
    tier: 'enterprise' as const,
  }
];

const tierConfig = {
  starter: { bg: 'bg-slate-500/10', border: 'border-slate-500/30', text: 'text-slate-400', icon: Server },
  business: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-500', icon: Star },
  performance: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-500', icon: Zap },
  enterprise: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-500', icon: Crown },
};

const ServerStore: React.FC = () => {
  const [selectedServer, setSelectedServer] = useState<number | null>(null);
  const { sendDirectPayment, isProcessing, isWalletConnected } = useDirectTonPayment();
  const { formatUsd } = useTonPrice();

  const handlePurchase = async (pkg: typeof serverPackages[0]) => {
    if (!isWalletConnected) {
      toast.error('Connect your TON wallet first');
      return;
    }
    
    setSelectedServer(pkg.id);
    
    const success = await sendDirectPayment({
      amount: pkg.price,
      description: `Cloud Server - ${pkg.name}`,
      productType: 'server_hosting',
      productId: pkg.id.toString(),
      serverName: pkg.name
    });

    if (success) {
      toast.success('Server purchased! Setup instructions coming soon.');
    }
    
    setSelectedServer(null);
  };

  return (
    <>
      <Helmet>
        <title>Cloud Servers | Premium VPS</title>
        <meta name="description" content="Deploy premium VPS servers instantly with TON payments." />
      </Helmet>

      <main className="min-h-screen bg-background pb-24">
        <div className="max-w-md mx-auto px-4 pt-6 space-y-6">
          
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 mb-2">
              <Database className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Cloud Servers</h1>
            <p className="text-sm text-muted-foreground">Premium VPS • Instant Deploy</p>
          </div>

          {/* Server Grid */}
          <div className="grid grid-cols-2 gap-3">
            {serverPackages.map((pkg, index) => {
              const config = tierConfig[pkg.tier];
              const Icon = config.icon;
              const isSelected = selectedServer === pkg.id;
              
              return (
                <motion.div
                  key={pkg.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className={`relative p-4 rounded-2xl border-2 transition-all ${
                    pkg.popular 
                      ? 'border-blue-500/50 ring-2 ring-blue-500/20' 
                      : `${config.border}`
                  } ${config.bg}`}
                >
                  {/* Popular Badge */}
                  {pkg.popular && (
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                      <Badge className="bg-blue-500 text-white text-[10px] px-2">POPULAR</Badge>
                    </div>
                  )}

                  {/* Header */}
                  <div className="flex items-center gap-2 mb-3 mt-1">
                    <div className={`w-8 h-8 rounded-lg ${config.bg} ${config.border} border flex items-center justify-center`}>
                      <Icon className={`w-4 h-4 ${config.text}`} />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-foreground">{pkg.name}</h3>
                      <p className="text-[10px] text-muted-foreground">/month</p>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-3">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-foreground">{pkg.price}</span>
                      <span className="text-sm text-muted-foreground">TON</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{formatUsd(pkg.price)}</p>
                  </div>

                  {/* Specs */}
                  <div className="space-y-1.5 mb-3">
                    <div className="flex items-center gap-1.5 text-xs">
                      <Cpu className="w-3 h-3 text-muted-foreground" />
                      <span>{pkg.specs.cpu}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                      <Zap className="w-3 h-3 text-muted-foreground" />
                      <span>{pkg.specs.ram}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                      <HardDrive className="w-3 h-3 text-muted-foreground" />
                      <span>{pkg.specs.storage}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                      <Wifi className="w-3 h-3 text-muted-foreground" />
                      <span>{pkg.specs.bandwidth}</span>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-1 mb-3">
                    {pkg.features.slice(0, 2).map((feature, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <CheckCircle className="w-3 h-3 text-emerald-500" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Buy Button */}
                  <Button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePurchase(pkg);
                    }}
                    disabled={isProcessing && isSelected}
                    className={`w-full h-9 text-xs font-semibold rounded-xl ${
                      pkg.popular 
                        ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                        : 'bg-sky-500 hover:bg-sky-600 text-white'
                    }`}
                    size="sm"
                  >
                    {isProcessing && isSelected ? (
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Processing</span>
                      </div>
                    ) : (
                      <>
                        <TonIcon size={14} className="mr-1" />
                        Deploy
                      </>
                    )}
                  </Button>
                </motion.div>
              );
            })}
          </div>

          {/* Trust Section */}
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
            <div className="flex items-center justify-around text-center">
              <div>
                <CheckCircle className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                <p className="text-[10px] font-medium text-emerald-700 dark:text-emerald-300">Instant</p>
              </div>
              <div>
                <Database className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                <p className="text-[10px] font-medium text-emerald-700 dark:text-emerald-300">Global</p>
              </div>
              <div>
                <Zap className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                <p className="text-[10px] font-medium text-emerald-700 dark:text-emerald-300">24/7</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default ServerStore;
