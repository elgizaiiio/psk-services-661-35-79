import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Crown, 
  Zap, 
  Gift, 
  Shield, 
  Star, 
  Gem,
  ArrowLeft,
  Check,
  Sparkles,
  Rocket
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useTelegramTonConnect } from '@/hooks/useTelegramTonConnect';
import { useDirectTonPayment } from '@/hooks/useDirectTonPayment';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface VIPPlan {
  id: string;
  name: string;
  tier: 'silver' | 'gold' | 'platinum';
  price: number;
  duration: number; // days
  features: string[];
  miningBoost: number;
  dailyBonus: number;
  referralBonus: number;
  icon: React.ReactNode;
  popular?: boolean;
  gradient: string;
}

const vipPlans: VIPPlan[] = [
  {
    id: 'silver',
    name: 'Silver VIP',
    tier: 'silver',
    price: 3.5,
    duration: 30,
    features: [
      '20% Faster Mining',
      '100 VIRAL Daily Bonus',
      '1.2x Referral Multiplier',
      'Silver VIP Badge',
      'Priority Support'
    ],
    miningBoost: 20,
    dailyBonus: 100,
    referralBonus: 20,
    icon: <Star className="w-8 h-8" />,
    gradient: 'from-gray-300 via-gray-200 to-gray-400'
  },
  {
    id: 'gold',
    name: 'Gold VIP',
    tier: 'gold',
    price: 8,
    duration: 30,
    features: [
      '50% Faster Mining',
      '300 VIRAL Daily Bonus',
      '1.5x Referral Multiplier',
      'Gold VIP Badge',
      'High Priority Support',
      'Early Access to Features'
    ],
    miningBoost: 50,
    dailyBonus: 300,
    referralBonus: 50,
    icon: <Crown className="w-8 h-8" />,
    popular: true,
    gradient: 'from-yellow-400 via-amber-300 to-yellow-500'
  },
  {
    id: 'platinum',
    name: 'Platinum VIP',
    tier: 'platinum',
    price: 15,
    duration: 30,
    features: [
      '100% Faster Mining',
      '700 VIRAL Daily Bonus',
      '2x Referral Multiplier',
      'Platinum VIP Badge',
      'Exclusive VIP Support',
      'Exclusive Feature Access',
      'Free Monthly Gifts',
      'No Ads'
    ],
    miningBoost: 100,
    dailyBonus: 700,
    referralBonus: 100,
    icon: <Gem className="w-8 h-8" />,
    gradient: 'from-purple-400 via-violet-300 to-purple-500'
  }
];

const VIPSubscription = () => {
  const navigate = useNavigate();
  const { user: telegramUser } = useTelegramAuth();
  const { isConnected, connectWallet } = useTelegramTonConnect();
  const { sendDirectPayment, isProcessing } = useDirectTonPayment();
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [currentVIP, setCurrentVIP] = useState<string | null>(null);

  // Load current VIP status
  useEffect(() => {
    const loadVIPStatus = async () => {
      if (!telegramUser) return;
      
      const { data: userData } = await supabase
        .from('bolt_users')
        .select('id')
        .eq('telegram_id', telegramUser.id)
        .maybeSingle();
      
      if (userData) {
        const { data: vipData } = await supabase
          .from('bolt_vip_tiers')
          .select('tier, expires_at')
          .eq('user_id', userData.id)
          .maybeSingle();
        
        if (vipData && new Date(vipData.expires_at) > new Date()) {
          setCurrentVIP(vipData.tier);
        }
      }
    };
    
    loadVIPStatus();
  }, [telegramUser]);

  const handlePurchase = async (plan: VIPPlan) => {
    if (!telegramUser) {
      toast.error('Please login first');
      return;
    }

    if (!isConnected) {
      await connectWallet();
      return;
    }

    setPurchasing(plan.id);

    try {
      // Get user from database
      const { data: userData, error: userError } = await supabase
        .from('bolt_users')
        .select('id')
        .eq('telegram_id', telegramUser.id)
        .maybeSingle();

      if (userError || !userData) {
        throw new Error('User not found');
      }

      // Send TON transaction
      const success = await sendDirectPayment({
        amount: plan.price,
        description: `${plan.name} subscription for ${plan.duration} days`,
        productType: 'subscription',
        productId: plan.id
      });

      if (success) {
        // Update or create VIP tier
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + plan.duration);

        const { data: existingVIP } = await supabase
          .from('bolt_vip_tiers')
          .select('id, total_spent')
          .eq('user_id', userData.id)
          .maybeSingle();

        if (existingVIP) {
          await supabase
            .from('bolt_vip_tiers')
            .update({ 
              tier: plan.tier,
              expires_at: expiresAt.toISOString(),
              total_spent: (existingVIP.total_spent || 0) + plan.price,
              benefits: {
                miningBoost: plan.miningBoost,
                dailyBonus: plan.dailyBonus,
                referralBonus: plan.referralBonus
              }
            })
            .eq('id', existingVIP.id);
        } else {
          await supabase
            .from('bolt_vip_tiers')
            .insert({
              user_id: userData.id,
              tier: plan.tier,
              expires_at: expiresAt.toISOString(),
              total_spent: plan.price,
              benefits: {
                miningBoost: plan.miningBoost,
                dailyBonus: plan.dailyBonus,
                referralBonus: plan.referralBonus
              }
            });
        }

        toast.success(`🎉 ${plan.name} activated successfully!`);
        setCurrentVIP(plan.tier);
      }
    } catch (error) {
      console.error('Purchase error:', error);
      toast.error('An error occurred during purchase');
    } finally {
      setPurchasing(null);
    }
  };

  return (
    <main className="min-h-screen bg-background pb-24">
      <Helmet>
        <title>VIP Subscription | VIRAL</title>
        <meta name="description" content="Subscribe to VIP and get exclusive benefits" />
      </Helmet>

      <div className="max-w-md mx-auto px-4 pt-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">VIP Subscriptions</h1>
            <p className="text-sm text-muted-foreground">Get exclusive benefits</p>
          </div>
        </div>

        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-2xl overflow-hidden mb-8 p-6 bg-gradient-to-br from-primary/20 via-primary/10 to-background border border-primary/30"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl" />
          <div className="relative z-10 text-center">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Crown className="w-16 h-16 text-primary mx-auto mb-4" />
            </motion.div>
            <h2 className="text-xl font-bold text-foreground mb-2">
              Join the VIP Family
            </h2>
            <p className="text-muted-foreground text-sm">
              Enjoy faster mining, daily bonuses, and exclusive benefits
            </p>
          </div>
        </motion.div>

        {/* VIP Benefits Quick View */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/mining')}
            className="bg-muted/50 rounded-xl p-3 text-center cursor-pointer hover:bg-muted transition-colors"
          >
            <Rocket className="w-6 h-6 text-primary mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Fast Mining</p>
          </motion.div>
          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/daily-tasks')}
            className="bg-muted/50 rounded-xl p-3 text-center cursor-pointer hover:bg-muted transition-colors"
          >
            <Gift className="w-6 h-6 text-primary mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Daily Rewards</p>
          </motion.div>
          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => toast.info('VIP Support available 24/7 via Telegram @VIRALSupport')}
            className="bg-muted/50 rounded-xl p-3 text-center cursor-pointer hover:bg-muted transition-colors"
          >
            <Shield className="w-6 h-6 text-primary mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Priority Support</p>
          </motion.div>
        </div>

        {/* Plans */}
        <div className="space-y-4">
          {vipPlans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`relative overflow-hidden p-5 border-2 ${
                plan.popular ? 'border-primary' : 'border-border'
              } ${currentVIP === plan.tier ? 'ring-2 ring-primary' : ''}`}>
                {/* Popular Badge */}
                {plan.popular && (
                  <Badge className="absolute top-0 right-0 rounded-none rounded-bl-lg bg-primary text-primary-foreground">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Most Popular
                  </Badge>
                )}

                {/* Current VIP Badge */}
                {currentVIP === plan.tier && (
                  <Badge className="absolute top-0 left-0 rounded-none rounded-br-lg bg-green-500 text-white">
                    <Check className="w-3 h-3 mr-1" />
                    Active
                  </Badge>
                )}

                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center text-white shadow-lg`}>
                    {plan.icon}
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-foreground">{plan.name}</h3>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-2xl font-bold text-primary">{plan.price}</span>
                      <span className="text-sm text-muted-foreground">TON/month</span>
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div className="mt-4 space-y-2">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 mt-4 p-3 bg-muted/50 rounded-xl">
                  <div className="text-center">
                    <p className="text-lg font-bold text-primary">+{plan.miningBoost}%</p>
                    <p className="text-xs text-muted-foreground">Mining</p>
                  </div>
                  <div className="text-center border-x border-border">
                    <p className="text-lg font-bold text-primary">+{plan.dailyBonus}</p>
                    <p className="text-xs text-muted-foreground">Daily</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-primary">+{plan.referralBonus}%</p>
                    <p className="text-xs text-muted-foreground">Referrals</p>
                  </div>
                </div>

                {/* Buy Button */}
                <Button
                  onClick={() => handlePurchase(plan)}
                  disabled={purchasing === plan.id || currentVIP === plan.tier}
                  className={`w-full mt-4 ${
                    plan.popular 
                      ? 'bg-primary hover:bg-primary/90' 
                      : 'bg-muted hover:bg-muted/80 text-foreground'
                  }`}
                >
                  {purchasing === plan.id ? (
                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : currentVIP === plan.tier ? (
                    'Currently Active'
                  ) : !isConnected ? (
                    'Connect Wallet'
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Subscribe Now
                    </>
                  )}
                </Button>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* FAQ */}
        <div className="mt-8 p-4 bg-muted/30 rounded-xl">
          <h3 className="font-semibold text-foreground mb-3">FAQ</h3>
          <div className="space-y-3 text-sm">
            <div>
              <p className="font-medium text-foreground">When do benefits start?</p>
              <p className="text-muted-foreground">Immediately after successful payment</p>
            </div>
            <div>
              <p className="font-medium text-foreground">Can I upgrade?</p>
              <p className="text-muted-foreground">Yes, you can upgrade anytime</p>
            </div>
            <div>
              <p className="font-medium text-foreground">Does it auto-renew?</p>
              <p className="text-muted-foreground">No, you need to renew manually</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default VIPSubscription;
