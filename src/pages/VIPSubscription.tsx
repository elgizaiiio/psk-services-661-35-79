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
  Check,
  Rocket,
  Ticket,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useTelegramTonConnect } from '@/hooks/useTelegramTonConnect';
import { useDirectTonPayment } from '@/hooks/useDirectTonPayment';
import { usePriceCalculator } from '@/hooks/usePriceCalculator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface VIPPlan {
  id: string;
  name: string;
  tier: 'silver' | 'gold' | 'platinum';
  priceTon: number;
  duration: number;
  features: string[];
  miningBoost: number;
  dailyBonus: number;
  referralBonus: number;
  weeklySpinTickets: number;
  icon: React.ReactNode;
  gradient: string;
  borderColor: string;
}

const vipPlans: VIPPlan[] = [
  {
    id: 'silver',
    name: 'Silver VIP',
    tier: 'silver',
    priceTon: 2,
    duration: 30,
    features: [
      '+20% Mining Power',
      '100 BOLT Daily Bonus',
      '3 Free Spin Tickets/week',
      'Silver VIP Badge',
      '1.2x Referral Bonus',
      'Priority Support'
    ],
    miningBoost: 20,
    dailyBonus: 100,
    referralBonus: 20,
    weeklySpinTickets: 3,
    icon: <Star className="w-6 h-6" />,
    gradient: 'from-gray-300 via-gray-200 to-gray-400',
    borderColor: 'border-gray-400/30'
  },
  {
    id: 'gold',
    name: 'Gold VIP',
    tier: 'gold',
    priceTon: 5,
    duration: 30,
    features: [
      '+50% Mining Power',
      '300 BOLT Daily Bonus',
      '10 Free Spin Tickets/week',
      'Gold VIP Badge',
      '1.5x Referral Bonus',
      'Early Access to Features',
      'Weekly Bonus Chest'
    ],
    miningBoost: 50,
    dailyBonus: 300,
    referralBonus: 50,
    weeklySpinTickets: 10,
    icon: <Crown className="w-6 h-6" />,
    gradient: 'from-yellow-400 via-amber-300 to-yellow-500',
    borderColor: 'border-amber-400/30'
  },
  {
    id: 'platinum',
    name: 'Platinum VIP',
    tier: 'platinum',
    priceTon: 10,
    duration: 30,
    features: [
      '+100% Mining Power',
      '700 BOLT Daily Bonus',
      '25 Free Spin Tickets/week',
      'Platinum VIP Badge',
      '2x Referral Bonus',
      'Exclusive Features',
      'Monthly Premium Gifts',
      'No Ads'
    ],
    miningBoost: 100,
    dailyBonus: 700,
    referralBonus: 100,
    weeklySpinTickets: 25,
    icon: <Gem className="w-6 h-6" />,
    gradient: 'from-purple-400 via-violet-300 to-purple-500',
    borderColor: 'border-purple-400/30'
  }
];

const VIPSubscription = () => {
  const navigate = useNavigate();
  const { user: telegramUser } = useTelegramAuth();
  const { isConnected, connectWallet } = useTelegramTonConnect();
  const { sendDirectPayment, isProcessing } = useDirectTonPayment();
  const { tonToUsd, tonToStars, formatUsd } = usePriceCalculator();
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [currentVIP, setCurrentVIP] = useState<string | null>(null);

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
      const { data: userData, error: userError } = await supabase
        .from('bolt_users')
        .select('id')
        .eq('telegram_id', telegramUser.id)
        .maybeSingle();

      if (userError || !userData) {
        throw new Error('User not found');
      }

      const success = await sendDirectPayment({
        amount: plan.priceTon,
        description: `${plan.name} subscription for ${plan.duration} days`,
        productType: 'subscription',
        productId: plan.id
      });

      if (success) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + plan.duration);

        const { data: existingVIP } = await supabase
          .from('bolt_vip_tiers')
          .select('id, total_spent')
          .eq('user_id', userData.id)
          .maybeSingle();

        const benefits = {
          miningBoost: plan.miningBoost,
          dailyBonus: plan.dailyBonus,
          referralBonus: plan.referralBonus,
          weeklySpinTickets: plan.weeklySpinTickets
        };

        if (existingVIP) {
          await supabase
            .from('bolt_vip_tiers')
            .update({ 
              tier: plan.tier,
              expires_at: expiresAt.toISOString(),
              total_spent: (existingVIP.total_spent || 0) + plan.priceTon,
              benefits
            })
            .eq('id', existingVIP.id);
        } else {
          await supabase
            .from('bolt_vip_tiers')
            .insert({
              user_id: userData.id,
              tier: plan.tier,
              expires_at: expiresAt.toISOString(),
              total_spent: plan.priceTon,
              benefits
            });
        }

        toast.success(`${plan.name} activated successfully!`);
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
        <title>Premium VIP | Bolt</title>
        <meta name="description" content="Subscribe to VIP and unlock exclusive benefits" />
      </Helmet>

      <div className="max-w-md mx-auto px-4 pt-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(-1)}
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Premium VIP</h1>
            <p className="text-sm text-muted-foreground">Unlock exclusive benefits</p>
          </div>
        </div>

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl overflow-hidden mb-6 p-6 bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/20"
        >
          <div className="text-center">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Crown className="w-12 h-12 text-primary mx-auto mb-3" />
            </motion.div>
            <h2 className="text-lg font-bold text-foreground mb-1">
              Join Premium VIP
            </h2>
            <p className="text-sm text-muted-foreground">
              Faster mining, free spins, and more
            </p>
          </div>
        </motion.div>

        {/* Quick Benefits */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-card rounded-xl p-3 text-center border border-border">
            <Rocket className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Fast Mining</p>
          </div>
          <div className="bg-card rounded-xl p-3 text-center border border-border">
            <Ticket className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Free Spins</p>
          </div>
          <div className="bg-card rounded-xl p-3 text-center border border-border">
            <Gift className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Daily Bonus</p>
          </div>
        </div>

        {/* Plans */}
        <div className="space-y-4">
          {vipPlans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`relative overflow-hidden p-4 border ${plan.borderColor} ${
                currentVIP === plan.tier ? 'ring-2 ring-primary' : ''
              }`}>
                {/* Active Badge */}
                {currentVIP === plan.tier && (
                  <Badge className="absolute top-2 right-2 bg-green-500/90 text-white text-xs">
                    <Check className="w-3 h-3 mr-1" />
                    Active
                  </Badge>
                )}

                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center text-white shadow-md shrink-0`}>
                    {plan.icon}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground">{plan.name}</h3>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-xl font-bold text-primary">{plan.priceTon} TON</span>
                      <span className="text-xs text-muted-foreground">
                        ~{formatUsd(tonToUsd(plan.priceTon))} • {tonToStars(plan.priceTon)} Stars
                      </span>
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div className="mt-3 space-y-1.5">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="text-xs text-muted-foreground">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-2 mt-3 p-2 bg-muted/30 rounded-lg">
                  <div className="text-center">
                    <p className="text-sm font-bold text-primary">+{plan.miningBoost}%</p>
                    <p className="text-[10px] text-muted-foreground">Mining</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-primary">+{plan.dailyBonus}</p>
                    <p className="text-[10px] text-muted-foreground">Daily</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-primary">{plan.weeklySpinTickets}</p>
                    <p className="text-[10px] text-muted-foreground">Spins/wk</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-primary">+{plan.referralBonus}%</p>
                    <p className="text-[10px] text-muted-foreground">Referral</p>
                  </div>
                </div>

                {/* Buy Button */}
                <Button
                  onClick={() => handlePurchase(plan)}
                  disabled={purchasing === plan.id || currentVIP === plan.tier || isProcessing}
                  className="w-full mt-3"
                  variant={currentVIP === plan.tier ? "secondary" : "default"}
                >
                  {purchasing === plan.id ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : currentVIP === plan.tier ? (
                    'Currently Active'
                  ) : !isConnected ? (
                    'Connect Wallet'
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Subscribe
                    </>
                  )}
                </Button>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* FAQ */}
        <div className="mt-6 p-4 bg-card rounded-xl border border-border">
          <h3 className="font-semibold text-foreground mb-3">FAQ</h3>
          <div className="space-y-3 text-sm">
            <div>
              <p className="font-medium text-foreground">When do benefits start?</p>
              <p className="text-muted-foreground text-xs">Immediately after payment</p>
            </div>
            <div>
              <p className="font-medium text-foreground">Can I upgrade?</p>
              <p className="text-muted-foreground text-xs">Yes, upgrade anytime</p>
            </div>
            <div>
              <p className="font-medium text-foreground">How do I get free spins?</p>
              <p className="text-muted-foreground text-xs">Tickets are added weekly to your account</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default VIPSubscription;
