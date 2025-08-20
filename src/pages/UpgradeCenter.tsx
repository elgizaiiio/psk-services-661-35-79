import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useTonWallet, useTonConnectUI } from "@tonconnect/ui-react";
import { toast } from 'sonner';
import { 
  Zap, 
  Battery, 
  HardDrive, 
  Thermometer, 
  Shield, 
  Gauge,
  Sun,
  Cpu,
  CloudSnow,
  Layers,
  TrendingUp,
  Star
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const RECEIVER_ADDRESS = "UQBJSGcoWTcjdkWFSxA4A6sLmnD5uFKoKHFEHc3LqGJvFWya";

const UpgradeCenterInner = () => {
  const navigate = useNavigate();
  const wallet = useTonWallet();
  const [tcui] = useTonConnectUI();

  const buyUpgrade = async (upgradeName: string, price: number) => {
    if (!wallet?.account) {
      toast.error("Please connect your TON wallet first");
      return;
    }

    try {
      const nanotons = Math.floor(price * 1e9).toString();
      await tcui.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 300,
        messages: [
          {
            address: RECEIVER_ADDRESS,
            amount: nanotons
          }
        ]
      });
      
      toast.success(`${upgradeName} upgraded successfully! 🚀`);
    } catch (e: any) {
      console.error("Upgrade failed:", e);
      if (e.message?.includes('User rejects')) {
        toast.error("Transaction cancelled by user");
      } else {
        toast.error("Transaction failed");
      }
    }
  };

  const buyAddon = async (addonName: string, price: number) => {
    if (!wallet?.account) {
      toast.error("Please connect your TON wallet first");
      return;
    }

    try {
      const nanotons = Math.floor(price * 1e9).toString();
      await tcui.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 300,
        messages: [
          {
            address: RECEIVER_ADDRESS,
            amount: nanotons
          }
        ]
      });
      
      toast.success(`${addonName} activated successfully! ✨`);
    } catch (e: any) {
      console.error("Purchase failed:", e);
      if (e.message?.includes('User rejects')) {
        toast.error("Transaction cancelled by user");
      } else {
        toast.error("Transaction failed");
      }
    }
  };

  const coreUpgrades = [
    {
      id: 'power',
      name: 'Power Boost',
      icon: Zap,
      description: 'Multiply your hash rate exponentially',
      minPrice: 1,
      maxPrice: 500,
      currentLevel: 3,
      maxLevel: 10,
      nextCost: 15,
      boost: '+25% Hash Rate',
      color: 'neon-blue',
      progress: 30
    },
    {
      id: 'battery',
      name: 'Battery Expansion',
      icon: Battery,
      description: 'Mine longer without interruption',
      minPrice: 1,
      maxPrice: 300,
      currentLevel: 2,
      maxLevel: 8,
      nextCost: 8,
      boost: '+12h Runtime',
      color: 'neon-green',
      progress: 25
    },
    {
      id: 'storage',
      name: 'Storage Upgrade',
      icon: HardDrive,
      description: 'Store more blockchain data for efficiency',
      minPrice: 1,
      maxPrice: 200,
      currentLevel: 4,
      maxLevel: 7,
      nextCost: 22,
      boost: '+2TB Capacity',
      color: 'neon-purple',
      progress: 57
    },
    {
      id: 'cooling',
      name: 'Cooling System',
      icon: Thermometer,
      description: 'Prevent overheating and maintain peak performance',
      minPrice: 1,
      maxPrice: 200,
      currentLevel: 1,
      maxLevel: 6,
      nextCost: 5,
      boost: '-20% Heat',
      color: 'neon-orange',
      progress: 16
    },
    {
      id: 'reliability',
      name: 'Reliability Upgrade',
      icon: Shield,
      description: 'Reduce downtime and system failures',
      minPrice: 1,
      maxPrice: 100,
      currentLevel: 5,
      maxLevel: 5,
      nextCost: null,
      boost: 'MAX LEVEL',
      color: 'neon-pink',
      progress: 100
    },
    {
      id: 'overclock',
      name: 'Overclock Mode',
      icon: Gauge,
      description: 'Push your server beyond safe limits',
      minPrice: 500,
      maxPrice: 500,
      currentLevel: 0,
      maxLevel: 1,
      nextCost: 500,
      boost: '+200% Performance',
      color: 'neon-orange',
      progress: 0,
      premium: true
    }
  ];

  const specialAddOns = [
    {
      name: 'Solar Battery',
      icon: Sun,
      description: 'Harness unlimited solar energy',
      price: 50,
      boost: '+50% Efficiency',
      duration: 'Permanent',
      color: 'neon-orange',
      rarity: 'epic'
    },
    {
      name: 'AI Chip',
      icon: Cpu,
      description: 'Smart optimization algorithms',
      price: 100,
      boost: '×50 Boost',
      duration: '24 Hours',
      color: 'neon-blue',
      rarity: 'legendary'
    },
    {
      name: 'Smart Cooling Tower',
      icon: CloudSnow,
      description: 'Zero heat generation system',
      price: 20,
      boost: '100% Uptime',
      duration: 'Permanent',
      color: 'neon-green',
      rarity: 'rare'
    },
    {
      name: 'Cloud Mining License',
      icon: Layers,
      description: 'Mine from anywhere in the world',
      price: 150,
      boost: '24/7 Mining',
      duration: '30 Days',
      color: 'neon-purple',
      rarity: 'epic'
    }
  ];

  const getRarityStyles = (rarity: string) => {
    switch (rarity) {
      case 'rare':
        return 'border-2 border-neon-green/40 bg-gradient-to-br from-neon-green/10 to-background animate-pulse';
      case 'epic':
        return 'border-2 border-neon-orange/50 bg-gradient-to-br from-neon-orange/15 to-background animate-glow';
      case 'legendary':
        return 'border-2 border-neon-blue/60 bg-gradient-to-br from-neon-blue/20 to-background animate-neon-pulse';
      default:
        return 'border border-primary/20 bg-gradient-to-br from-card/80 to-background';
    }
  };

  return (
    <div className="min-h-screen text-foreground font-rajdhani pb-24">
      <Helmet>
        <title>Upgrade Center | TON Crypto Mining</title>
        <meta name="description" content="Upgrade your mining servers with powerful enhancements" />
      </Helmet>

      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-primary/20">
        <div className="flex items-center justify-between p-4 max-w-7xl mx-auto">
          <h1 className="text-2xl font-orbitron font-black bg-gradient-to-r from-neon-purple to-neon-pink bg-clip-text text-transparent">
            UPGRADE CENTER
          </h1>
          <Button 
            onClick={() => navigate('/')}
            className="bg-neon-purple/20 border border-neon-purple text-neon-purple hover:bg-neon-purple hover:text-background"
          >
            Dashboard
          </Button>
        </div>
      </div>

      {/* Hero Section */}
      <section className="py-12 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-6">
            <TrendingUp className="w-12 h-12 text-neon-purple animate-pulse" />
            <h1 className="text-5xl font-orbitron font-black bg-gradient-to-r from-neon-purple via-neon-pink to-neon-orange bg-clip-text text-transparent">
              UPGRADE MATRIX
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Transform your servers into unstoppable mining machines. Every upgrade brings exponential gains.
          </p>
        </div>
      </section>

      {/* Core Upgrades */}
      <section className="py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-orbitron font-black text-neon-blue mb-2">
              CORE UPGRADES
            </h2>
            <p className="text-muted-foreground">Fundamental enhancements for maximum efficiency</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coreUpgrades.map((upgrade, index) => (
              <Card 
                key={upgrade.id} 
                className={`relative overflow-hidden border-2 border-${upgrade.color}/30 bg-gradient-to-br from-${upgrade.color}/5 to-background hover:border-${upgrade.color} transition-all duration-500 group animate-fade-in ${upgrade.premium ? 'animate-neon-pulse' : ''}`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {upgrade.premium && (
                  <div className="absolute top-4 right-4 z-20">
                    <Badge className="bg-neon-orange/20 text-neon-orange border-neon-orange/30 animate-pulse">
                      PREMIUM
                    </Badge>
                  </div>
                )}

                <CardContent className="p-6">
                  {/* Upgrade Icon & Info */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`w-14 h-14 rounded-xl bg-${upgrade.color}/10 flex items-center justify-center border-2 border-${upgrade.color}/30 group-hover:border-${upgrade.color} transition-all duration-300`}>
                      <upgrade.icon className={`w-7 h-7 text-${upgrade.color}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-orbitron font-bold text-lg mb-1">{upgrade.name}</h3>
                      <p className="text-sm text-muted-foreground">{upgrade.description}</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-muted-foreground">
                        Level {upgrade.currentLevel}/{upgrade.maxLevel}
                      </span>
                      <span className={`text-sm font-bold text-${upgrade.color}`}>
                        {upgrade.boost}
                      </span>
                    </div>
                    <Progress 
                      value={upgrade.progress} 
                      className={`h-3 bg-background border border-${upgrade.color}/30`}
                    />
                  </div>

                  {/* TON Price */}
                  <div className={`flex items-center justify-between p-3 rounded-lg bg-${upgrade.color}/5 border border-${upgrade.color}/20 mb-4`}>
                    <span className="text-sm text-muted-foreground">Next Upgrade:</span>
                    {upgrade.nextCost ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-r from-neon-blue to-neon-green flex items-center justify-center text-xs font-bold text-background">
                          T
                        </div>
                        <span className={`text-lg font-orbitron font-bold text-${upgrade.color}`}>
                          {upgrade.nextCost} TON
                        </span>
                      </div>
                    ) : (
                      <Badge className={`bg-${upgrade.color}/20 text-${upgrade.color} border-${upgrade.color}/30`}>
                        MAXED
                      </Badge>
                    )}
                  </div>

                  {/* Upgrade Button */}
                  <Button 
                    disabled={!upgrade.nextCost || !wallet?.account}
                    onClick={() => upgrade.nextCost && buyUpgrade(upgrade.name, upgrade.nextCost)}
                    className={`w-full font-orbitron font-bold transition-all duration-300 ${
                      upgrade.premium
                        ? `bg-gradient-to-r from-${upgrade.color}/20 to-neon-purple/20 border-2 border-${upgrade.color} text-${upgrade.color} hover:bg-gradient-to-r hover:from-${upgrade.color} hover:to-neon-purple hover:text-background`
                        : `bg-${upgrade.color}/20 border border-${upgrade.color} text-${upgrade.color} hover:bg-${upgrade.color} hover:text-background`
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {!wallet?.account ? 'CONNECT WALLET' : upgrade.nextCost ? `UPGRADE FOR ${upgrade.nextCost} TON` : 'MAX LEVEL'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Special Add-Ons */}
      <section className="py-12 px-4 bg-gradient-to-r from-card/30 to-background">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Star className="w-8 h-8 text-neon-orange animate-pulse" />
              <h2 className="text-3xl font-orbitron font-black text-neon-orange">
                SPECIAL ADD-ONS
              </h2>
              <Star className="w-8 h-8 text-neon-orange animate-pulse" />
            </div>
            <p className="text-muted-foreground">Legendary enhancements that separate the elite from the masses</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {specialAddOns.map((addon, index) => (
              <Card 
                key={addon.name} 
                className={`relative overflow-hidden ${getRarityStyles(addon.rarity)} hover:scale-105 transition-all duration-500 group`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Particle Effects */}
                {addon.rarity === 'legendary' && (
                  <div className="absolute inset-0 z-0 opacity-30">
                    <div className="absolute top-2 right-2 w-1 h-1 bg-neon-blue rounded-full animate-ping"></div>
                    <div className="absolute top-6 right-6 w-1 h-1 bg-neon-purple rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
                    <div className="absolute bottom-4 left-4 w-1 h-1 bg-neon-orange rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
                  </div>
                )}

                {/* Rarity Badge */}
                <div className="absolute top-4 right-4 z-20">
                  <Badge 
                    className={`
                      ${addon.rarity === 'rare' ? 'bg-neon-green/20 text-neon-green border-neon-green/30' : ''}
                      ${addon.rarity === 'epic' ? 'bg-neon-orange/20 text-neon-orange border-neon-orange/30' : ''}
                      ${addon.rarity === 'legendary' ? 'bg-neon-blue/20 text-neon-blue border-neon-blue/30 animate-pulse' : ''}
                    `}
                  >
                    {addon.rarity.toUpperCase()}
                  </Badge>
                </div>

                <CardContent className="p-6 text-center relative z-10">
                  {/* Add-on Icon */}
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-xl bg-${addon.color}/10 flex items-center justify-center border-2 border-${addon.color}/30 group-hover:border-${addon.color} transition-all duration-300 group-hover:animate-neon-pulse`}>
                    <addon.icon className={`w-8 h-8 text-${addon.color}`} />
                  </div>
                  
                  <h3 className="font-orbitron font-bold text-lg mb-2">{addon.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{addon.description}</p>
                  
                  {/* Boost & Duration */}
                  <div className="space-y-2 mb-4">
                    <Badge variant="secondary" className={`text-${addon.color} border-${addon.color}/30`}>
                      {addon.boost}
                    </Badge>
                    <div className="text-xs text-muted-foreground">
                      Duration: {addon.duration}
                    </div>
                  </div>
                  
                  {/* Glowing TON Price */}
                  <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-full bg-${addon.color}/10 border border-${addon.color}/30 mb-4 group-hover:bg-${addon.color}/20 transition-all duration-300`}>
                    <div className="w-5 h-5 rounded-full bg-gradient-to-r from-neon-blue to-neon-green flex items-center justify-center text-xs font-bold text-background">
                      T
                    </div>
                    <span className={`text-xl font-orbitron font-black text-${addon.color}`}>
                      {addon.price}
                    </span>
                  </div>
                  
                  <Button 
                    disabled={!wallet?.account}
                    onClick={() => buyAddon(addon.name, addon.price)}
                    className={`w-full font-orbitron font-bold transition-all duration-300 ${
                      addon.rarity === 'legendary'
                        ? `bg-gradient-to-r from-${addon.color}/20 to-neon-purple/20 border-2 border-${addon.color} text-${addon.color} hover:bg-gradient-to-r hover:from-${addon.color} hover:to-neon-purple hover:text-background animate-neon-pulse`
                        : `bg-${addon.color}/20 border border-${addon.color} text-${addon.color} hover:bg-${addon.color} hover:text-background`
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {wallet?.account ? 'ACTIVATE' : 'CONNECT WALLET'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Total Investment Showcase */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Card className="border-2 border-neon-purple/50 bg-gradient-to-br from-neon-purple/10 to-background animate-neon-pulse">
            <CardContent className="p-8">
              <h3 className="text-3xl font-orbitron font-black mb-4 bg-gradient-to-r from-neon-purple to-neon-pink bg-clip-text text-transparent">
                TOTAL INVESTMENT POTENTIAL
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-orbitron font-black text-neon-blue mb-2">1,100 TON</div>
                  <div className="text-sm text-muted-foreground">Core Upgrades</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-orbitron font-black text-neon-orange mb-2">320 TON</div>
                  <div className="text-sm text-muted-foreground">Special Add-Ons</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-orbitron font-black text-neon-purple mb-2">1,420 TON</div>
                  <div className="text-sm text-muted-foreground">Maximum Power</div>
                </div>
              </div>
              <p className="text-lg text-muted-foreground">
                Unlock the ultimate mining experience. Every TON invested multiplies your earning potential.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

const UpgradeCenter = () => {
  return (
    <UpgradeCenterInner />
  );
};

export default UpgradeCenter;