import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Star,
  Brain,
  Flame,
  Gift,
  Crown,
  Trophy
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { DailyStreakWidget } from '@/components/psychology/DailyStreakWidget';
import { FlashOfferBanner } from '@/components/psychology/FlashOfferBanner';
import { LevelProgressCard } from '@/components/psychology/LevelProgressCard';
import { SocialProofFeed } from '@/components/psychology/SocialProofFeed';
import { LuckySpinModal } from '@/components/psychology/LuckySpinModal';
import { LossAversionCard } from '@/components/psychology/LossAversionCard';
import { VIPStatusCard } from '@/components/psychology/VIPStatusCard';
import { motion } from 'framer-motion';

const RECEIVER_ADDRESS = "UQALON5gUq_kQzpTq2GkPeHQABL1nOeAuWwRPGPNkzDz_lZZ";

const UpgradeCenterInner = () => {
  const navigate = useNavigate();
  const wallet = useTonWallet();
  const [tcui] = useTonConnectUI();
  const [activeTab, setActiveTab] = useState('psychology');
  const [userId, setUserId] = useState<string>('');
  const [userData, setUserData] = useState({
    token_balance: 0,
    mining_power: 2,
    mining_duration_hours: 4
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      // Try to get user from Telegram or localStorage
      const telegramId = (window as any).Telegram?.WebApp?.initDataUnsafe?.user?.id;
      
      if (telegramId) {
        const { data } = await supabase
          .from('bolt_users')
          .select('*')
          .eq('telegram_id', telegramId)
          .maybeSingle();
        
        if (data) {
          setUserId(data.id);
          setUserData({
            token_balance: Number(data.token_balance) || 0,
            mining_power: Number(data.mining_power) || 2,
            mining_duration_hours: data.mining_duration_hours || 4
          });
        }
      } else {
        // Generate a demo user ID for testing
        const demoId = localStorage.getItem('demo_user_id') || crypto.randomUUID();
        localStorage.setItem('demo_user_id', demoId);
        setUserId(demoId);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      const demoId = localStorage.getItem('demo_user_id') || crypto.randomUUID();
      localStorage.setItem('demo_user_id', demoId);
      setUserId(demoId);
    }
  };

  const handleUpgrade = () => {
    loadUserData();
  };

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
      
      // Add social notification
      await supabase.from('bolt_social_notifications' as any).insert({
        user_id: userId,
        username: 'Someone',
        action_type: 'upgrade',
        amount: price,
        product_name: upgradeName
      });
      
      toast.success(`${upgradeName} upgraded successfully! 🚀`);
      handleUpgrade();
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
      
      // Add social notification
      await supabase.from('bolt_social_notifications' as any).insert({
        user_id: userId,
        username: 'Someone',
        action_type: 'addon_purchase',
        amount: price,
        product_name: addonName
      });
      
      toast.success(`${addonName} activated successfully! ✨`);
      handleUpgrade();
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
      name: 'Smart Cooling Tower',
      icon: CloudSnow,
      description: 'Zero heat generation system',
      price: 20,
      boost: '+150% Uptime',
      duration: 'Permanent',
      color: 'neon-green',
      rarity: 'rare'
    },
    {
      name: 'Solar Battery',
      icon: Sun,
      description: 'Harness unlimited solar energy',
      price: 50,
      boost: '+85% Efficiency',
      duration: 'Permanent',
      color: 'neon-orange',
      rarity: 'epic'
    },
    {
      name: 'AI Chip',
      icon: Cpu,
      description: 'Smart optimization algorithms',
      price: 100,
      boost: '×75 Boost',
      duration: '24 Hours',
      color: 'neon-blue',
      rarity: 'legendary'
    },
    {
      name: 'Cloud Mining License',
      icon: Layers,
      description: 'Mine from anywhere in the world',
      price: 150,
      boost: '+200% Mining',
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

      {/* Social Proof - Always visible */}
      <div className="px-4 pt-4 max-w-6xl mx-auto">
        <SocialProofFeed />
      </div>

      {/* Flash Offers */}
      {userId && (
        <div className="px-4 pt-4 max-w-6xl mx-auto">
          <FlashOfferBanner userId={userId} onPurchase={handleUpgrade} />
        </div>
      )}

      {/* Main Tabs */}
      <div className="px-4 pt-6 max-w-6xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 w-full bg-background/50 backdrop-blur-sm border border-primary/20">
            <TabsTrigger value="psychology" className="flex items-center gap-1 data-[state=active]:bg-neon-purple/20">
              <Brain className="w-4 h-4" />
              <span className="hidden sm:inline">Smart</span>
            </TabsTrigger>
            <TabsTrigger value="upgrades" className="flex items-center gap-1 data-[state=active]:bg-neon-blue/20">
              <Zap className="w-4 h-4" />
              <span className="hidden sm:inline">Upgrades</span>
            </TabsTrigger>
            <TabsTrigger value="addons" className="flex items-center gap-1 data-[state=active]:bg-neon-orange/20">
              <Star className="w-4 h-4" />
              <span className="hidden sm:inline">Add-Ons</span>
            </TabsTrigger>
            <TabsTrigger value="vip" className="flex items-center gap-1 data-[state=active]:bg-neon-pink/20">
              <Crown className="w-4 h-4" />
              <span className="hidden sm:inline">VIP</span>
            </TabsTrigger>
          </TabsList>

          {/* Psychology Tab - Smart Upgrades */}
          <TabsContent value="psychology" className="space-y-4 mt-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Daily Streak */}
              {userId && (
                <DailyStreakWidget userId={userId} onStreakClaimed={handleUpgrade} />
              )}

              {/* Loss Aversion */}
              <LossAversionCard
                userId={userId}
                currentMiningPower={userData.mining_power}
                miningDurationHours={userData.mining_duration_hours}
                tokenBalance={userData.token_balance}
                onUpgrade={() => setActiveTab('upgrades')}
              />

              {/* Level Progress */}
              {userId && (
                <LevelProgressCard userId={userId} tokenBalance={userData.token_balance} />
              )}

              {/* Lucky Boxes */}
              {userId && (
                <LuckySpinModal userId={userId} onReward={handleUpgrade} />
              )}
            </motion.div>
          </TabsContent>

          {/* Core Upgrades Tab */}
          <TabsContent value="upgrades" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {coreUpgrades.map((upgrade, index) => (
                <motion.div
                  key={upgrade.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card 
                    className={`relative overflow-hidden border-2 border-${upgrade.color}/30 bg-gradient-to-br from-${upgrade.color}/5 to-background hover:border-${upgrade.color} transition-all duration-500 group ${upgrade.premium ? 'animate-neon-pulse' : ''}`}
                  >
                    {upgrade.premium && (
                      <div className="absolute top-4 right-4 z-20">
                        <Badge className="bg-neon-orange/20 text-neon-orange border-neon-orange/30 animate-pulse">
                          PREMIUM
                        </Badge>
                      </div>
                    )}

                    <CardContent className="p-4">
                      <div className="flex items-start gap-3 mb-3">
                        <div className={`w-12 h-12 rounded-xl bg-${upgrade.color}/10 flex items-center justify-center border border-${upgrade.color}/30`}>
                          <upgrade.icon className={`w-6 h-6 text-${upgrade.color}`} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-orbitron font-bold text-sm">{upgrade.name}</h3>
                          <p className="text-xs text-muted-foreground">{upgrade.description}</p>
                        </div>
                      </div>

                      <div className="mb-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-muted-foreground">
                            Level {upgrade.currentLevel}/{upgrade.maxLevel}
                          </span>
                          <span className={`text-xs font-bold text-${upgrade.color}`}>
                            {upgrade.boost}
                          </span>
                        </div>
                        <Progress value={upgrade.progress} className="h-2" />
                      </div>

                      <Button 
                        disabled={!upgrade.nextCost || !wallet?.account}
                        onClick={() => upgrade.nextCost && buyUpgrade(upgrade.name, upgrade.nextCost)}
                        className={`w-full text-sm font-orbitron bg-${upgrade.color}/20 border border-${upgrade.color} text-${upgrade.color} hover:bg-${upgrade.color} hover:text-background`}
                        size="sm"
                      >
                        {!wallet?.account ? 'CONNECT WALLET' : upgrade.nextCost ? `${upgrade.nextCost} TON` : 'MAXED'}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* Add-Ons Tab */}
          <TabsContent value="addons" className="mt-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {specialAddOns.map((addon, index) => (
                <motion.div
                  key={addon.name}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className={`relative overflow-hidden ${getRarityStyles(addon.rarity)} hover:scale-105 transition-all duration-500`}>
                    <div className="absolute top-2 right-2 z-20">
                      <Badge 
                        className={`text-xs
                          ${addon.rarity === 'rare' ? 'bg-neon-green/20 text-neon-green border-neon-green/30' : ''}
                          ${addon.rarity === 'epic' ? 'bg-neon-orange/20 text-neon-orange border-neon-orange/30' : ''}
                          ${addon.rarity === 'legendary' ? 'bg-neon-blue/20 text-neon-blue border-neon-blue/30 animate-pulse' : ''}
                        `}
                      >
                        {addon.rarity.toUpperCase()}
                      </Badge>
                    </div>

                    <CardContent className="p-4 text-center">
                      <div className={`w-12 h-12 mx-auto mb-3 rounded-xl bg-${addon.color}/10 flex items-center justify-center border border-${addon.color}/30`}>
                        <addon.icon className={`w-6 h-6 text-${addon.color}`} />
                      </div>
                      
                      <h3 className="font-orbitron font-bold text-sm mb-1">{addon.name}</h3>
                      <p className="text-xs text-muted-foreground mb-2">{addon.description}</p>
                      
                      <Badge variant="secondary" className={`text-xs text-${addon.color} mb-2`}>
                        {addon.boost}
                      </Badge>
                      
                      <div className="text-lg font-orbitron font-bold mb-2">{addon.price} TON</div>
                      
                      <Button 
                        disabled={!wallet?.account}
                        onClick={() => buyAddon(addon.name, addon.price)}
                        className={`w-full text-xs bg-${addon.color}/20 border border-${addon.color} text-${addon.color} hover:bg-${addon.color} hover:text-background`}
                        size="sm"
                      >
                        {wallet?.account ? 'ACTIVATE' : 'CONNECT'}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* VIP Tab */}
          <TabsContent value="vip" className="mt-4 space-y-4">
            {userId && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <VIPStatusCard userId={userId} />
              </motion.div>
            )}

            {/* VIP Benefits */}
            <Card className="p-4 bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/30">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Crown className="w-5 h-5 text-purple-400" />
                VIP Exclusive Benefits
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="p-3 bg-black/20 rounded-lg flex items-center gap-2"
                >
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm">+30% Mining Bonus</span>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="p-3 bg-black/20 rounded-lg flex items-center gap-2"
                >
                  <Gift className="w-4 h-4 text-green-400" />
                  <span className="text-sm">Unlimited Spins</span>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="p-3 bg-black/20 rounded-lg flex items-center gap-2"
                >
                  <Flame className="w-4 h-4 text-orange-400" />
                  <span className="text-sm">Flash Deals Early</span>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="p-3 bg-black/20 rounded-lg flex items-center gap-2"
                >
                  <Trophy className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm">VIP Support</span>
                </motion.div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Stats Footer */}
      <section className="py-8 px-4 mt-6">
        <div className="max-w-4xl mx-auto">
          <Card className="border border-neon-purple/30 bg-gradient-to-br from-neon-purple/5 to-background">
            <CardContent className="p-6">
              <h3 className="text-xl font-orbitron font-bold mb-4 text-center bg-gradient-to-r from-neon-purple to-neon-pink bg-clip-text text-transparent">
                YOUR MINING STATS
              </h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-orbitron font-bold text-neon-blue">
                    {userData.token_balance.toFixed(0)}
                  </div>
                  <div className="text-xs text-muted-foreground">VIRAL Balance</div>
                </div>
                <div>
                  <div className="text-2xl font-orbitron font-bold text-neon-green">
                    {userData.mining_power}x
                  </div>
                  <div className="text-xs text-muted-foreground">Mining Power</div>
                </div>
                <div>
                  <div className="text-2xl font-orbitron font-bold text-neon-orange">
                    {userData.mining_duration_hours}h
                  </div>
                  <div className="text-xs text-muted-foreground">Max Duration</div>
                </div>
              </div>
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
