import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Zap, Snowflake, TrendingUp, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useViralMining } from '@/hooks/useViralMining';
import { toast } from 'sonner';
import BottomNavigation from '@/components/BottomNavigation';
import { BackButton } from '@/components/ui/back-button';

interface ServerType {
  id: string;
  name: string;
  name_ar: string | null;
  description: string | null;
  image_url: string | null;
  tier: string;
  category: string;
  max_level: number;
  base_income_per_hour: number;
  upgrade_cost_per_level: number;
  price_bolt: number;
  display_order: number;
}

interface UserServerLevel {
  server_type_id: string;
  current_level: number;
  experience: number;
}

interface CoolingSystem {
  id: string;
  name: string;
  name_ar: string | null;
  image_url: string | null;
  efficiency_boost: number;
  price_bolt: number;
}

const tierColors: Record<string, { bg: string; border: string; icon: string }> = {
  basic: { bg: 'from-slate-500/20 to-slate-600/20', border: 'border-slate-500/30', icon: 'text-slate-400' },
  standard: { bg: 'from-blue-500/20 to-blue-600/20', border: 'border-blue-500/30', icon: 'text-blue-400' },
  premium: { bg: 'from-purple-500/20 to-purple-600/20', border: 'border-purple-500/30', icon: 'text-purple-400' },
  legendary: { bg: 'from-amber-500/20 to-amber-600/20', border: 'border-amber-500/30', icon: 'text-amber-400' },
};

const ServersBoost = () => {
  const navigate = useNavigate();
  const { user: telegramUser } = useTelegramAuth();
  const { user } = useViralMining(telegramUser);
  
  const [servers, setServers] = useState<ServerType[]>([]);
  const [userLevels, setUserLevels] = useState<UserServerLevel[]>([]);
  const [coolingSystems, setCoolingSystems] = useState<CoolingSystem[]>([]);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [user?.id]);

  const fetchData = async () => {
    try {
      // Fetch server types
      const { data: serversData } = await supabase
        .from('mining_server_types')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      // Fetch cooling systems
      const { data: coolingData } = await supabase
        .from('cooling_systems')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      // Fetch user's server levels
      if (user?.id) {
        const { data: levelsData } = await supabase
          .from('user_server_levels')
          .select('server_type_id, current_level, experience')
          .eq('user_id', user.id);

        setUserLevels(levelsData || []);
      }

      setServers(serversData || []);
      setCoolingSystems(coolingData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUserLevel = (serverId: string): number => {
    const level = userLevels.find(l => l.server_type_id === serverId);
    return level?.current_level || 0;
  };

  const getUpgradeCost = (server: ServerType): number => {
    const currentLevel = getUserLevel(server.id);
    if (currentLevel === 0) return server.price_bolt;
    return server.upgrade_cost_per_level * (currentLevel + 1);
  };

  const getIncomePerHour = (server: ServerType): number => {
    const level = getUserLevel(server.id);
    if (level === 0) return 0;
    return server.base_income_per_hour * level;
  };

  const handleUpgrade = async (server: ServerType) => {
    if (!user) return;
    
    const cost = getUpgradeCost(server);
    if ((user.token_balance || 0) < cost) {
      toast.error('رصيد غير كافٍ');
      return;
    }

    setUpgrading(server.id);
    try {
      const currentLevel = getUserLevel(server.id);
      
      if (currentLevel === 0) {
        // First purchase
        await supabase.from('user_server_levels').insert({
          user_id: user.id,
          server_type_id: server.id,
          current_level: 1,
          experience: 0
        });
      } else {
        // Upgrade
        await supabase
          .from('user_server_levels')
          .update({ current_level: currentLevel + 1 })
          .eq('user_id', user.id)
          .eq('server_type_id', server.id);
      }

      // Deduct balance
      await supabase
        .from('bolt_users')
        .update({ token_balance: (user.token_balance || 0) - cost })
        .eq('id', user.id);

      // Refresh page to get updated data
      window.location.reload();
      
      toast.success(currentLevel === 0 ? 'تم شراء السيرفر! 🎉' : 'تمت الترقية! ⬆️');
    } catch (error) {
      toast.error('حدث خطأ');
    } finally {
      setUpgrading(null);
    }
  };

  const farmingServers = servers.filter(s => s.category === 'farming');
  const distanceServers = servers.filter(s => s.category === 'distance');

  const renderServerCard = (server: ServerType) => {
    const level = getUserLevel(server.id);
    const colors = tierColors[server.tier] || tierColors.basic;
    const income = getIncomePerHour(server);
    const cost = getUpgradeCost(server);
    const isMaxLevel = level >= server.max_level;

    return (
      <motion.div
        key={server.id}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Card 
          className={`p-4 bg-gradient-to-br ${colors.bg} ${colors.border} border cursor-pointer relative overflow-hidden`}
          onClick={() => !isMaxLevel && handleUpgrade(server)}
        >
          {upgrading === server.id && (
            <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Zap className="w-6 h-6 text-primary" />
              </motion.div>
            </div>
          )}

          {/* Level badge */}
          <Badge 
            variant="secondary" 
            className="absolute top-2 right-2 text-xs"
          >
            {level} lvl
          </Badge>

          {/* Server icon/image */}
          <div className={`w-12 h-12 rounded-lg bg-background/50 flex items-center justify-center mb-3 ${colors.icon}`}>
            {server.image_url ? (
              <img src={server.image_url} alt={server.name} className="w-8 h-8 object-contain" />
            ) : (
              <Zap className="w-6 h-6" />
            )}
          </div>

          {/* Server name */}
          <h3 className="font-semibold text-sm text-foreground mb-1">
            {server.name_ar || server.name}
          </h3>

          {/* Income */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
            <TrendingUp className="w-3 h-3" />
            <span>الدخل: {income}/ساعة</span>
          </div>

          {/* Upgrade cost */}
          <div className="flex items-center justify-center gap-1 text-sm font-bold text-primary">
            <Zap className="w-4 h-4" />
            {isMaxLevel ? 'MAX' : cost.toLocaleString()}
          </div>
        </Card>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <Zap className="w-8 h-8 text-primary" />
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Boost - SUSPENDED</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-background to-background/95 pb-24">
        {/* Header */}
        <div className="p-4 flex items-center gap-3 border-b border-border/50">
          <BackButton />
          <h1 className="text-xl font-bold text-foreground">Boost</h1>
          
          <div className="ml-auto flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-full">
            <Zap className="w-4 h-4 text-primary" />
            <span className="font-bold text-sm">{(user?.token_balance || 0).toLocaleString()}</span>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="farming" className="p-4">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="farming">Farming</TabsTrigger>
            <TabsTrigger value="distance">Distance</TabsTrigger>
          </TabsList>

          <TabsContent value="farming">
            <div className="grid grid-cols-2 gap-3">
              {farmingServers.map(renderServerCard)}
            </div>
          </TabsContent>

          <TabsContent value="distance">
            <div className="grid grid-cols-2 gap-3">
              {distanceServers.map(renderServerCard)}
            </div>
          </TabsContent>
        </Tabs>

        {/* Cooling Systems Section */}
        <div className="px-4 mt-6">
          <div className="flex items-center gap-2 mb-4">
            <Snowflake className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-foreground">أنظمة التبريد</h2>
          </div>

          <div className="space-y-3">
            {coolingSystems.map((cooling) => (
              <Card 
                key={cooling.id}
                className="p-4 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-cyan-500/20 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                    <Snowflake className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{cooling.name_ar || cooling.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      +{(cooling.efficiency_boost * 100).toFixed(0)}% كفاءة
                    </p>
                  </div>
                </div>
                
                <Button size="sm" variant="outline" className="border-cyan-500/30">
                  <Zap className="w-3 h-3 mr-1" />
                  {cooling.price_bolt}
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <BottomNavigation />
    </>
  );
};

export default ServersBoost;
