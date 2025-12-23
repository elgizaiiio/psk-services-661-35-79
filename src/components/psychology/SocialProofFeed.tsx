import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Zap, Crown, Gift, TrendingUp, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';

interface SocialNotification {
  id: string;
  username: string;
  action_type: string;
  amount: number;
  product_name: string;
  created_at: string;
}

// Fake names for demo purposes
const DEMO_NAMES = [
  'Alex M.', 'Sarah K.', 'Mohamed A.', 'John D.', 'Emma W.',
  'Ahmed H.', 'Lisa P.', 'Omar S.', 'Nina R.', 'David L.',
  'Fatima Z.', 'Chris B.', 'Yuki T.', 'Maria G.', 'Hassan M.'
];

const DEMO_ACTIONS = [
  { type: 'power_upgrade', product: 'Power Boost x2', amount: 0.5, icon: Zap },
  { type: 'duration_upgrade', product: '12h Mining', amount: 0.3, icon: TrendingUp },
  { type: 'vip_purchase', product: 'VIP Status', amount: 2.0, icon: Crown },
  { type: 'lucky_box', product: 'Gold Box', amount: 0.5, icon: Gift },
];

export const SocialProofFeed = () => {
  const [notifications, setNotifications] = useState<SocialNotification[]>([]);
  const [currentNotification, setCurrentNotification] = useState<SocialNotification | null>(null);
  const [stats, setStats] = useState({ todayPurchases: 0, activeUsers: 0 });

  useEffect(() => {
    loadNotifications();
    loadStats();
    
    // Generate new notifications periodically
    const interval = setInterval(generateDemoNotification, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (notifications.length > 0) {
      showNextNotification();
      const interval = setInterval(showNextNotification, 5000);
      return () => clearInterval(interval);
    }
  }, [notifications]);

  const loadNotifications = async () => {
    try {
      const { data } = await supabase
        .from('bolt_social_notifications' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (data && data.length > 0) {
        setNotifications(data as unknown as SocialNotification[]);
      } else {
        // Generate initial demo notifications
        generateInitialNotifications();
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      generateInitialNotifications();
    }
  };

  const loadStats = async () => {
    try {
      // Get today's purchases count
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { count: purchaseCount } = await supabase
        .from('bolt_upgrade_purchases' as any)
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      // Get active users count
      const { count: userCount } = await supabase
        .from('bolt_users')
        .select('*', { count: 'exact', head: true });

      setStats({
        todayPurchases: (purchaseCount || 0) + Math.floor(Math.random() * 50) + 20,
        activeUsers: (userCount || 0) + Math.floor(Math.random() * 200) + 100
      });
    } catch (error) {
      console.error('Error loading stats:', error);
      setStats({
        todayPurchases: Math.floor(Math.random() * 50) + 30,
        activeUsers: Math.floor(Math.random() * 200) + 150
      });
    }
  };

  const generateInitialNotifications = () => {
    const initialNotifications: SocialNotification[] = [];
    for (let i = 0; i < 5; i++) {
      const action = DEMO_ACTIONS[Math.floor(Math.random() * DEMO_ACTIONS.length)];
      initialNotifications.push({
        id: `demo_${i}`,
        username: DEMO_NAMES[Math.floor(Math.random() * DEMO_NAMES.length)],
        action_type: action.type,
        amount: action.amount,
        product_name: action.product,
        created_at: new Date(Date.now() - Math.random() * 3600000).toISOString()
      });
    }
    setNotifications(initialNotifications);
  };

  const generateDemoNotification = () => {
    const action = DEMO_ACTIONS[Math.floor(Math.random() * DEMO_ACTIONS.length)];
    const newNotification: SocialNotification = {
      id: `demo_${Date.now()}`,
      username: DEMO_NAMES[Math.floor(Math.random() * DEMO_NAMES.length)],
      action_type: action.type,
      amount: action.amount,
      product_name: action.product,
      created_at: new Date().toISOString()
    };
    
    setNotifications(prev => [newNotification, ...prev.slice(0, 9)]);
    setStats(prev => ({ ...prev, todayPurchases: prev.todayPurchases + 1 }));
  };

  const showNextNotification = () => {
    if (notifications.length > 0) {
      const randomIndex = Math.floor(Math.random() * Math.min(notifications.length, 5));
      setCurrentNotification(notifications[randomIndex]);
    }
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'power_upgrade': return Zap;
      case 'duration_upgrade': return TrendingUp;
      case 'vip_purchase': return Crown;
      case 'lucky_box': return Gift;
      default: return ShoppingCart;
    }
  };

  const getTimeAgo = (date: string) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div className="space-y-3">
      {/* Stats bar */}
      <div className="flex items-center justify-center gap-4">
        <Badge variant="secondary" className="bg-green-500/20 text-green-400 px-3 py-1">
          <Users className="w-3 h-3 mr-1" />
          {stats.activeUsers.toLocaleString()} miners online
        </Badge>
        <Badge variant="secondary" className="bg-purple-500/20 text-purple-400 px-3 py-1">
          <ShoppingCart className="w-3 h-3 mr-1" />
          {stats.todayPurchases} upgrades today
        </Badge>
      </div>

      {/* Live notification */}
      <AnimatePresence mode="wait">
        {currentNotification && (
          <motion.div
            key={currentNotification.id}
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="p-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/30">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-2 h-2 bg-green-500 rounded-full absolute -top-1 -right-1 animate-ping" />
                  <div className="p-2 rounded-full bg-green-500/20">
                    {(() => {
                      const Icon = getActionIcon(currentNotification.action_type);
                      return <Icon className="w-4 h-4 text-green-400" />;
                    })()}
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm">
                    <span className="font-bold text-green-400">{currentNotification.username}</span>
                    {' '}just purchased{' '}
                    <span className="font-bold text-white">{currentNotification.product_name}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">{getTimeAgo(currentNotification.created_at)}</p>
                </div>
                <Badge variant="outline" className="border-green-500/30 text-green-400 text-xs">
                  {currentNotification.amount} TON
                </Badge>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
