import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useTonWallet, useTonConnectUI } from "@tonconnect/ui-react";
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { TON_PAYMENT_ADDRESS, getValidUntil, tonToNano } from '@/lib/ton-constants';

const tabVariants = {
  hidden: { opacity: 0, x: 20, scale: 0.98 },
  visible: { 
    opacity: 1, 
    x: 0, 
    scale: 1,
    transition: { 
      duration: 0.3, 
      ease: "easeOut" as const,
      staggerChildren: 0.05
    }
  },
  exit: { 
    opacity: 0, 
    x: -20, 
    scale: 0.98,
    transition: { duration: 0.2, ease: "easeOut" as const }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15, scale: 0.98 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { duration: 0.3, ease: "easeOut" as const }
  }
};

const UpgradeCenterInner = () => {
  const navigate = useNavigate();
  const wallet = useTonWallet();
  const [tcui] = useTonConnectUI();
  const [activeTab, setActiveTab] = useState('upgrades');
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
      const nanotons = tonToNano(price);
      await tcui.sendTransaction({
        validUntil: getValidUntil(),
        messages: [
          {
            address: TON_PAYMENT_ADDRESS,
            amount: nanotons
          }
        ]
      });
      
      await supabase.from('bolt_social_notifications' as any).insert({
        user_id: userId,
        username: 'Someone',
        action_type: 'upgrade',
        amount: price,
        product_name: upgradeName
      });
      
      toast.success(`${upgradeName} upgraded successfully`);
      handleUpgrade();
    } catch (e: any) {
      console.error("Upgrade failed:", e);
      if (e.message?.includes('User rejects')) {
        toast.error("Transaction cancelled");
      } else {
        toast.error("Transaction failed");
      }
    }
  };

  const coreUpgrades = [
    {
      id: 'power',
      name: 'Power Boost',
      description: 'Multiply your hash rate exponentially',
      currentLevel: 3,
      maxLevel: 10,
      nextCost: 15,
      boost: '+25% Hash Rate',
      progress: 30
    },
    {
      id: 'battery',
      name: 'Battery Expansion',
      description: 'Mine longer without interruption',
      currentLevel: 2,
      maxLevel: 8,
      nextCost: 8,
      boost: '+12h Runtime',
      progress: 25
    },
    {
      id: 'storage',
      name: 'Storage Upgrade',
      description: 'Store more blockchain data for efficiency',
      currentLevel: 4,
      maxLevel: 7,
      nextCost: 22,
      boost: '+2TB Capacity',
      progress: 57
    },
    {
      id: 'cooling',
      name: 'Cooling System',
      description: 'Prevent overheating and maintain peak performance',
      currentLevel: 1,
      maxLevel: 6,
      nextCost: 5,
      boost: '-20% Heat',
      progress: 16
    },
    {
      id: 'reliability',
      name: 'Reliability Upgrade',
      description: 'Reduce downtime and system failures',
      currentLevel: 5,
      maxLevel: 5,
      nextCost: null,
      boost: 'MAX LEVEL',
      progress: 100
    },
    {
      id: 'overclock',
      name: 'Overclock Mode',
      description: 'Push your server beyond safe limits',
      currentLevel: 0,
      maxLevel: 1,
      nextCost: 500,
      boost: '+200% Performance',
      progress: 0,
      premium: true
    }
  ];

  const specialAddOns = [
    {
      name: 'Smart Cooling Tower',
      description: 'Zero heat generation system',
      price: 20,
      boost: '+150% Uptime',
      duration: 'Permanent',
      rarity: 'rare'
    },
    {
      name: 'Solar Battery',
      description: 'Harness unlimited solar energy',
      price: 50,
      boost: '+85% Efficiency',
      duration: 'Permanent',
      rarity: 'epic'
    },
    {
      name: 'AI Chip',
      description: 'Smart optimization algorithms',
      price: 100,
      boost: 'x75 Boost',
      duration: '24 Hours',
      rarity: 'legendary'
    },
    {
      name: 'Cloud Mining License',
      description: 'Mine from anywhere in the world',
      price: 150,
      boost: '+200% Mining',
      duration: '30 Days',
      rarity: 'epic'
    }
  ];

  const tabs = [
    { id: 'upgrades', label: 'Upgrades' },
    { id: 'addons', label: 'Add-Ons' },
    { id: 'vip', label: 'VIP' }
  ];

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      <Helmet>
        <title>Upgrade Center | TON Crypto Mining</title>
        <meta name="description" content="Upgrade your mining servers with powerful enhancements" />
      </Helmet>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/95 backdrop-blur-sm border-b border-primary/20">
        <div className="flex items-center justify-between p-4 max-w-4xl mx-auto">
          <h1 className="text-xl font-semibold tracking-tight text-primary">
            Upgrade Center
          </h1>
          <Button 
            onClick={() => navigate('/')}
            variant="outline"
            size="sm"
            className="border-primary/30 text-primary hover:bg-primary/10 hover:text-primary"
          >
            Back
          </Button>
        </div>
      </header>

      {/* Stats Summary */}
      <section className="px-4 pt-6 max-w-4xl mx-auto">
        <Card className="bg-black border border-primary/20">
          <CardContent className="p-5">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-semibold text-primary">
                  {userData.token_balance.toFixed(0)}
                </div>
                <div className="text-xs text-white/50 mt-1">Balance</div>
              </div>
              <div>
                <div className="text-2xl font-semibold text-primary">
                  {userData.mining_power}x
                </div>
                <div className="text-xs text-white/50 mt-1">Power</div>
              </div>
              <div>
                <div className="text-2xl font-semibold text-primary">
                  {userData.mining_duration_hours}h
                </div>
                <div className="text-xs text-white/50 mt-1">Duration</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Tab Navigation */}
      <nav className="px-4 pt-6 max-w-4xl mx-auto">
        <div className="flex gap-2 p-1 bg-black border border-primary/20 rounded-lg relative">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 px-4 text-sm font-medium rounded-md transition-colors duration-200 relative z-10 ${
                activeTab === tab.id
                  ? 'text-black'
                  : 'text-white/60 hover:text-primary'
              }`}
            >
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-primary rounded-md"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main className="px-4 pt-6 max-w-4xl mx-auto overflow-hidden">
        <AnimatePresence mode="wait">
          {/* Upgrades Tab */}
          {activeTab === 'upgrades' && (
            <motion.div
              key="upgrades"
              variants={tabVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-3"
            >
              {coreUpgrades.map((upgrade, index) => (
                <motion.div
                  key={upgrade.id}
                  variants={itemVariants}
                >
                  <Card className={`bg-black border ${upgrade.premium ? 'border-primary/50' : 'border-primary/15'} hover:border-primary/40 transition-colors`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-white truncate">{upgrade.name}</h3>
                            {upgrade.premium && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-primary/20 text-primary rounded">
                                PREMIUM
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-white/40 mb-3">{upgrade.description}</p>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-white/50">
                                Level {upgrade.currentLevel}/{upgrade.maxLevel}
                              </span>
                              <span className="text-primary font-medium">
                                {upgrade.boost}
                              </span>
                            </div>
                            <Progress 
                              value={upgrade.progress} 
                              className="h-1.5 bg-white/5"
                            />
                          </div>
                        </div>
                        
                        <Button 
                          disabled={!upgrade.nextCost || !wallet?.account}
                          onClick={() => upgrade.nextCost && buyUpgrade(upgrade.name, upgrade.nextCost)}
                          size="sm"
                          className={`shrink-0 min-w-[90px] ${
                            upgrade.nextCost 
                              ? 'bg-primary hover:bg-primary/90 text-black' 
                              : 'bg-white/5 text-white/30'
                          }`}
                        >
                          {!wallet?.account ? 'Connect' : upgrade.nextCost ? `${upgrade.nextCost} TON` : 'Maxed'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Add-Ons Tab */}
          {activeTab === 'addons' && (
            <motion.div
              key="addons"
              variants={tabVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="grid grid-cols-1 sm:grid-cols-2 gap-3"
            >
              {specialAddOns.map((addon) => (
                <motion.div
                  key={addon.name}
                  variants={itemVariants}
                >
                  <Card className="bg-black border border-primary/15 hover:border-primary/40 transition-colors h-full">
                    <CardContent className="p-4 flex flex-col h-full">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-medium text-white">{addon.name}</h3>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                          addon.rarity === 'legendary' 
                            ? 'bg-primary/20 text-primary' 
                            : addon.rarity === 'epic'
                              ? 'bg-primary/15 text-primary/80'
                              : 'bg-primary/10 text-primary/60'
                        }`}>
                          {addon.rarity.toUpperCase()}
                        </span>
                      </div>
                      
                      <p className="text-xs text-white/40 mb-3 flex-1">{addon.description}</p>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-primary">{addon.boost}</span>
                          <span className="text-white/40">{addon.duration}</span>
                        </div>
                        
                        <Button 
                          disabled={!wallet?.account}
                          onClick={() => buyUpgrade(addon.name, addon.price)}
                          className="w-full bg-primary hover:bg-primary/90 text-black"
                          size="sm"
                        >
                          {wallet?.account ? `${addon.price} TON` : 'Connect Wallet'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* VIP Tab */}
          {activeTab === 'vip' && (
            <motion.div
              key="vip"
              variants={tabVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-4"
            >
              <motion.div variants={itemVariants}>
                <Card className="bg-black border border-primary/30">
                  <CardContent className="p-5">
                    <h3 className="font-semibold text-lg text-white mb-4">VIP Membership</h3>
                    
                    <div className="space-y-3 mb-6">
                      {[
                        { benefit: '+30% Mining Bonus', included: true },
                        { benefit: 'Unlimited Daily Spins', included: true },
                        { benefit: 'Early Access to Flash Deals', included: true },
                        { benefit: 'Priority Support', included: true },
                        { benefit: 'Exclusive Upgrades', included: true }
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-3 text-sm">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                          <span className="text-white/70">{item.benefit}</span>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { duration: '7 Days', price: 5 },
                        { duration: '30 Days', price: 15 },
                        { duration: '90 Days', price: 35 }
                      ].map((plan) => (
                        <Button
                          key={plan.duration}
                          disabled={!wallet?.account}
                          onClick={() => buyUpgrade(`VIP ${plan.duration}`, plan.price)}
                          variant="outline"
                          className="flex-col h-auto py-3 border-primary/30 hover:bg-primary/10 hover:border-primary/50"
                        >
                          <span className="text-xs text-white/60">{plan.duration}</span>
                          <span className="text-primary font-semibold">{plan.price} TON</span>
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card className="bg-black border border-primary/15">
                  <CardContent className="p-5">
                    <h3 className="font-semibold text-white mb-3">VIP Tiers</h3>
                    
                    <div className="space-y-2">
                      {[
                        { tier: 'Bronze', spend: '10 TON', bonus: '+10%' },
                        { tier: 'Silver', spend: '50 TON', bonus: '+20%' },
                        { tier: 'Gold', spend: '100 TON', bonus: '+30%' },
                        { tier: 'Platinum', spend: '500 TON', bonus: '+50%' }
                      ].map((tier) => (
                        <div 
                          key={tier.tier}
                          className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/[0.02] border border-primary/10"
                        >
                          <span className="text-sm text-white/70">{tier.tier}</span>
                          <div className="flex items-center gap-4 text-xs">
                            <span className="text-white/40">{tier.spend}</span>
                            <span className="text-primary">{tier.bonus}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

const UpgradeCenter = () => {
  return <UpgradeCenterInner />;
};

export default UpgradeCenter;
