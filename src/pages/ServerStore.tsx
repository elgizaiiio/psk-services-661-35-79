import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Server, 
  Zap, 
  Crown,
  Star,
  ShoppingBag,
  Activity,
  CheckCircle,
  Shield,
  Rocket,
  Database,
  Globe,
  Cpu,
  HardDrive,
  Wifi
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDirectTonPayment } from '@/hooks/useDirectTonPayment';
import { useTonPrice } from '@/hooks/useTonPrice';
import { toast } from 'sonner';

const serverPackages = [
  {
    id: 1,
    name: 'Starter VPS',
    description: 'Perfect for beginners',
    specs: {
      cpu: '1 vCPU',
      ram: '2GB RAM',
      storage: '25GB SSD',
      bandwidth: '500GB Transfer'
    },
    price: '0.3 TON',
    priceValue: 0.3,
    features: ['99.9% Uptime', 'Basic Support', 'SSL Certificate', 'Control Panel'],
    popular: false,
    icon: Server,
    gradient: 'from-slate-500/20 to-gray-500/20',
    borderColor: 'border-slate-500/30',
    badgeColor: 'bg-slate-500/10 text-slate-600'
  },
  {
    id: 2,
    name: 'Business VPS',
    description: 'Most popular choice',
    specs: {
      cpu: '2 vCPU',
      ram: '4GB RAM',
      storage: '50GB SSD',
      bandwidth: '1TB Transfer'
    },
    price: '0.8 TON',
    priceValue: 0.8,
    features: ['99.95% Uptime', 'Priority Support', 'Free SSL', 'Advanced Control Panel', 'Daily Backups'],
    popular: true,
    icon: Star,
    gradient: 'from-blue-500/20 to-cyan-500/20',
    borderColor: 'border-blue-500/40',
    badgeColor: 'bg-blue-500/10 text-blue-600'
  },
  {
    id: 3,
    name: 'Performance VPS',
    description: 'High-performance computing',
    specs: {
      cpu: '4 vCPU',
      ram: '8GB RAM',
      storage: '100GB NVMe',
      bandwidth: '2TB Transfer'
    },
    price: '1.8 TON',
    priceValue: 1.8,
    features: ['99.99% Uptime', '24/7 Support', 'Premium SSL', 'Full Root Access', 'Hourly Backups', 'DDoS Protection'],
    popular: false,
    icon: Zap,
    gradient: 'from-purple-500/20 to-pink-500/20',
    borderColor: 'border-purple-500/30',
    badgeColor: 'bg-purple-500/10 text-purple-600'
  },
  {
    id: 4,
    name: 'Enterprise Cloud',
    description: 'Ultimate performance',
    specs: {
      cpu: '8 vCPU',
      ram: '16GB RAM',
      storage: '200GB NVMe',
      bandwidth: 'Unlimited'
    },
    price: '3.5 TON',
    priceValue: 3.5,
    features: ['99.999% Uptime', 'Dedicated Support', 'Enterprise SSL', 'Dedicated IP', 'Real-time Monitoring', 'Custom Solutions'],
    popular: false,
    icon: Crown,
    gradient: 'from-emerald-500/20 to-green-500/20',
    borderColor: 'border-emerald-500/30',
    badgeColor: 'bg-emerald-500/10 text-emerald-600'
  }
];

const features = [
  { icon: Globe, title: 'Global Network', description: 'Worldwide data centers' },
  { icon: Shield, title: 'DDoS Protection', description: 'Advanced security' },
  { icon: Rocket, title: 'Instant Setup', description: 'Deploy in seconds' },
  { icon: Activity, title: '24/7 Monitoring', description: 'Real-time alerts' }
];

const ServerStoreInner: React.FC = () => {
  const navigate = useNavigate();
  const [selectedServer, setSelectedServer] = useState<number | null>(null);
  const { sendDirectPayment, isProcessing, isWalletConnected } = useDirectTonPayment();
  const { formatUsd } = useTonPrice();


  const handlePurchase = async (pkg: typeof serverPackages[0]) => {
    if (!isWalletConnected) {
      toast.error('Please connect your TON wallet first');
      return;
    }
    
    setSelectedServer(pkg.id);
    
    const success = await sendDirectPayment({
      amount: pkg.priceValue,
      description: `Server Hosting - ${pkg.name}`,
      productType: 'server_hosting',
      productId: pkg.id.toString(),
      serverName: pkg.name
    });

    if (success) {
      toast.success('Server purchased successfully! Setup instructions will be sent soon.');
    }
    
    setSelectedServer(null);
  };

  return (
    <>
      <Helmet>
        <title>Cloud Servers | Premium VPS Hosting</title>
        <meta name="description" content="Deploy premium VPS servers instantly with TON payments. High-performance cloud hosting with global network coverage." />
        <meta name="keywords" content="VPS hosting, cloud servers, TON payment, instant deployment, DDoS protection" />
        <link rel="canonical" href="/server-store" />
      </Helmet>

      <main className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 pb-24">
        <div className="max-w-md mx-auto px-4 py-6">
          
          {/* Hero Header */}
          <header className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20 mb-4">
              <Database className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent mb-2">
              Cloud Servers
            </h1>
            <p className="text-muted-foreground">Premium VPS hosting with instant deployment</p>
          </header>

          {/* Features Grid */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            {features.map((feature, index) => {
              const FeatureIcon = feature.icon;
              return (
                <Card key={index} className="p-4 text-center border-primary/10 bg-gradient-to-br from-background to-muted/20">
                  <FeatureIcon className="w-6 h-6 text-primary mx-auto mb-2" />
                  <h3 className="font-semibold text-sm mb-1">{feature.title}</h3>
                  <p className="text-xs text-muted-foreground">{feature.description}</p>
                </Card>
              );
            })}
          </div>

          {/* Server Packages */}
          <section className="space-y-6" aria-label="Server Packages">
            {serverPackages.map((pkg, index) => {
              const PackageIcon = pkg.icon;
              const isSelected = selectedServer === pkg.id;
              
              return (
                <Card 
                  key={pkg.id}
                  className={`relative overflow-hidden border-2 transition-all duration-500 hover:shadow-2xl group cursor-pointer animate-fade-in ${
                    pkg.popular 
                      ? 'border-blue-500/50 shadow-xl shadow-blue-500/20 scale-105'
                      : isSelected
                      ? 'border-primary/50 shadow-xl shadow-primary/20'
                      : 'border-border/30 hover:border-primary/40 hover:scale-102'
                  }`}
                  style={{ animationDelay: `${index * 150}ms` }}
                  onClick={() => setSelectedServer(pkg.id)}
                >
                  {/* Popular Badge */}
                  {pkg.popular && (
                    <div className="absolute -top-1 -right-1 z-10">
                      <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-3 py-1 text-xs font-bold rounded-full shadow-lg">
                        POPULAR
                      </div>
                    </div>
                  )}
                  
                  {/* Package Content */}
                  <CardContent className="p-0">
                    {/* Header */}
                    <div className={`p-6 bg-gradient-to-br ${pkg.gradient} border-b ${pkg.borderColor}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-14 h-14 rounded-2xl ${pkg.badgeColor} border ${pkg.borderColor} flex items-center justify-center`}>
                            <PackageIcon className="w-7 h-7" />
                          </div>
                          <div>
                            <h3 className="font-bold text-xl mb-1">{pkg.name}</h3>
                            <p className="text-sm text-muted-foreground">{pkg.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary mb-1">{formatUsd(pkg.priceValue)}</div>
                          <div className="text-sm text-muted-foreground">{pkg.price}</div>
                          <Badge className="bg-primary/10 text-primary border-primary/20 mt-1" variant="outline">
                            /month
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Specifications */}
                    <div className="p-6 border-b border-muted/10">
                      <h4 className="font-semibold mb-4 flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-primary" />
                        Server Specifications
                      </h4>
                      <div className="grid grid-cols-1 gap-3">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                          <span className="flex items-center gap-2 text-sm">
                            <Cpu className="w-4 h-4 text-primary" />
                            Processor
                          </span>
                          <span className="font-medium">{pkg.specs.cpu}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                          <span className="flex items-center gap-2 text-sm">
                            <Zap className="w-4 h-4 text-primary" />
                            Memory
                          </span>
                          <span className="font-medium">{pkg.specs.ram}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                          <span className="flex items-center gap-2 text-sm">
                            <HardDrive className="w-4 h-4 text-primary" />
                            Storage
                          </span>
                          <span className="font-medium">{pkg.specs.storage}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                          <span className="flex items-center gap-2 text-sm">
                            <Wifi className="w-4 h-4 text-primary" />
                            Bandwidth
                          </span>
                          <span className="font-medium">{pkg.specs.bandwidth}</span>
                        </div>
                      </div>
                    </div>

                    {/* Features */}
                    <div className="p-6 space-y-3">
                      <h4 className="font-semibold mb-3">Included Features</h4>
                      {pkg.features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-center gap-3">
                          <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>

                    {/* Purchase Button */}
                    <div className="p-6 pt-0">
                      <Button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePurchase(pkg);
                        }}
                        disabled={isProcessing && selectedServer === pkg.id}
                        className={`w-full h-14 text-base font-semibold transition-all duration-300 ${
                          pkg.popular 
                            ? 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg' 
                            : 'hover:shadow-lg'
                        }`}
                        size="lg"
                      >
                        {isProcessing && selectedServer === pkg.id ? (
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            Processing payment...
                          </div>
                        ) : (
                          <>
                            <ShoppingBag className="w-5 h-5 mr-2" />
                            Deploy with TON
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </section>

          {/* Trust Section */}
          <Card className="mt-8 overflow-hidden border-emerald-500/20 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20">
            <CardContent className="p-6">
              <div className="text-center mb-4">
                <Shield className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <h3 className="font-bold text-emerald-900 dark:text-emerald-100">Enterprise Security</h3>
                <p className="text-sm text-emerald-700 dark:text-emerald-300">Bank-grade security with 99.99% uptime guarantee</p>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="space-y-1">
                  <CheckCircle className="w-6 h-6 text-emerald-500 mx-auto" />
                  <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Instant Setup</p>
                </div>
                <div className="space-y-1">
                  <Globe className="w-6 h-6 text-emerald-500 mx-auto" />
                  <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Global CDN</p>
                </div>
                <div className="space-y-1">
                  <Activity className="w-6 h-6 text-emerald-500 mx-auto" />
                  <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">24/7 Support</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
};

const ServerStore: React.FC = () => {
  return (
    <ServerStoreInner />
  );
};

export default ServerStore;