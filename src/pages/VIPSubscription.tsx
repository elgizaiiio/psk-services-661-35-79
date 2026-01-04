import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Zap,
  Check,
  Crown,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useTelegramTonConnect } from '@/hooks/useTelegramTonConnect';
import { useDirectTonPayment } from '@/hooks/useDirectTonPayment';
import { useTelegramBackButton } from '@/hooks/useTelegramBackButton';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface VIPPlan {
  id: string;
  name: string;
  tier: 'silver' | 'gold' | 'platinum';
  originalPrice: number;
  price: number;
  discount: number;
  duration: number;
  boost: string;
  boostValue: number;
  features: string[];
  popular?: boolean;
}

const vipPlans: VIPPlan[] = [
  {
    id: 'silver',
    name: 'Silver',
    tier: 'silver',
    originalPrice: 4,
    price: 2,
    discount: 50,
    duration: 30,
    boost: '+20% Boost',
    boostValue: 20,
    features: [
      '+20% Mining Speed',
      '+50% USDT Mining',
      'No Minimum Withdrawal',
      '100 BOLT Daily Bonus',
      '3 Free Spins/day',
    ],
  },
  {
    id: 'gold',
    name: 'Gold',
    tier: 'gold',
    originalPrice: 10,
    price: 5,
    discount: 50,
    duration: 30,
    boost: '+50% Boost',
    boostValue: 50,
    features: [
      '+50% Mining Speed',
      '+50% USDT Mining',
      'No Minimum Withdrawal',
      '300 BOLT Daily Bonus',
      '5 Free Spins/day',
      'Priority Support',
    ],
  },
  {
    id: 'platinum',
    name: 'Platinum',
    tier: 'platinum',
    originalPrice: 20,
    price: 10,
    discount: 50,
    duration: 30,
    boost: '+100% Boost',
    boostValue: 100,
    features: [
      '+100% Mining Speed',
      '+50% USDT Mining',
      'No Minimum Withdrawal',
      '500 BOLT Daily Bonus',
      '10 Free Spins/day',
      'Priority Support',
    ],
  },
];

const tierStyles = {
  silver: {
    button: 'bg-gradient-to-r from-slate-400 to-slate-500 hover:from-slate-500 hover:to-slate-600',
    badge: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    border: 'border-slate-500/30',
  },
  gold: {
    button: 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    border: 'border-amber-500/40',
  },
  platinum: {
    button: 'bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700',
    badge: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
    border: 'border-violet-500/40',
  },
};

const VIPSubscription = () => {
  const navigate = useNavigate();
  const { user: telegramUser } = useTelegramAuth();
  const { isConnected, connectWallet } = useTelegramTonConnect();
  const { sendDirectPayment, isProcessing } = useDirectTonPayment();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [currentVIP, setCurrentVIP] = useState<string | null>(null);
  const [vipExpiresAt, setVipExpiresAt] = useState<string | null>(null);
  
  useTelegramBackButton();

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
          setVipExpiresAt(vipData.expires_at);
        }
      }
    };
    
    loadVIPStatus();
  }, [telegramUser]);

  const getPrice = (plan: VIPPlan) => {
    if (billingCycle === 'yearly') {
      return +(plan.price * 12 * 0.8).toFixed(1);
    }
    return plan.price;
  };

  const getOriginalPrice = (plan: VIPPlan) => {
    if (billingCycle === 'yearly') {
      return plan.originalPrice * 12;
    }
    return plan.originalPrice;
  };

  const getDuration = () => {
    return billingCycle === 'yearly' ? 365 : 30;
  };

  const getDaysRemaining = () => {
    if (!vipExpiresAt) return 0;
    return Math.ceil((new Date(vipExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  };

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

      const price = getPrice(plan);
      const duration = getDuration();

      const success = await sendDirectPayment({
        amount: price,
        description: `${plan.name} VIP - ${billingCycle === 'yearly' ? 'Yearly' : 'Monthly'}`,
        productType: 'subscription',
        productId: plan.id
      });

      if (success) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + duration);

        const { data: existingVIP } = await supabase
          .from('bolt_vip_tiers')
          .select('id, total_spent')
          .eq('user_id', userData.id)
          .maybeSingle();

        const benefits = {
          miningBoost: plan.boostValue,
          dailyBonus: plan.features.find(f => f.includes('BOLT'))?.match(/\d+/)?.[0] || 0,
          features: plan.features
        };

        if (existingVIP) {
          await supabase
            .from('bolt_vip_tiers')
            .update({ 
              tier: plan.tier,
              expires_at: expiresAt.toISOString(),
              total_spent: (existingVIP.total_spent || 0) + price,
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
              total_spent: price,
              benefits
            });
        }

        toast.success(`🎉 ${plan.name} VIP activated!`);
        setCurrentVIP(plan.tier);
        setVipExpiresAt(expiresAt.toISOString());
      }
    } catch (error) {
      console.error('Purchase error:', error);
      toast.error('Purchase failed');
    } finally {
      setPurchasing(null);
    }
  };

  return (
    <main className="min-h-screen bg-background pb-24">
      <Helmet>
        <title>VIP Subscription | SUSPENDED</title>
        <meta name="description" content="Get VIP benefits and boost your mining" />
      </Helmet>

      <div className="max-w-md mx-auto px-4">
        {/* Header */}
        <div className="pt-8 pb-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 mb-4"
          >
            <Crown className="w-8 h-8 text-amber-400" />
          </motion.div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Simple, transparent pricing
          </h1>
          <p className="text-muted-foreground text-sm">
            Choose the plan that works for you
          </p>
        </div>

        {/* Current VIP Status */}
        {currentVIP && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-400 font-medium capitalize">
                  {currentVIP} VIP Active
                </span>
              </div>
              <span className="text-emerald-400/80 text-sm flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {getDaysRemaining()} days left
              </span>
            </div>
          </motion.div>
        )}

        {/* Billing Toggle */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center p-1 rounded-full bg-card border border-border">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                billingCycle === 'yearly'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Yearly
              <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                -20%
              </span>
            </button>
          </div>
        </div>

        {/* Plans */}
        <div className="space-y-4">
          {vipPlans.map((plan, index) => {
            const isActive = currentVIP === plan.tier;
            
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >

                <div
                  className={`p-5 rounded-2xl bg-card border ${tierStyles[plan.tier].border} ${isActive ? 'ring-2 ring-emerald-500/50' : ''}`}
                >
                  {/* Plan Name */}
                  <h3 className="text-lg font-bold text-foreground mb-3">{plan.name}</h3>

                  {/* Pricing */}
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-muted-foreground line-through text-sm">
                      {getOriginalPrice(plan)} TON
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-xs font-medium">
                      -{plan.discount}%
                    </span>
                  </div>

                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-3xl font-bold text-foreground">{getPrice(plan)}</span>
                    <span className="text-sm text-muted-foreground">TON</span>
                    <span className="text-muted-foreground text-xs">
                      /{billingCycle === 'yearly' ? 'year' : 'mo'}
                    </span>
                  </div>

                  <p className="text-muted-foreground text-xs mb-3">
                    {billingCycle === 'yearly' ? 'billed annually' : 'for first month'}
                  </p>

                  {/* Boost Badge */}
                  <div className="mb-4">
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full border text-sm ${tierStyles[plan.tier].badge} font-medium`}
                    >
                      <Zap className="w-3.5 h-3.5" />
                      {plan.boost}
                    </span>
                  </div>

                  {/* Features */}
                  <ul className="space-y-2 mb-4">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-foreground/90">
                        <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        <span className="text-xs">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <Button
                    onClick={() => handlePurchase(plan)}
                    disabled={isActive || purchasing === plan.id || isProcessing}
                    className={`w-full py-5 text-sm font-semibold rounded-xl ${
                      isActive 
                        ? 'bg-muted text-muted-foreground cursor-not-allowed'
                        : `${tierStyles[plan.tier].button} text-white border-0`
                    }`}
                  >
                    {purchasing === plan.id ? (
                      <span className="flex items-center gap-2">
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Processing...
                      </span>
                    ) : isActive ? (
                      'Current Plan'
                    ) : !isConnected ? (
                      'Connect Wallet'
                    ) : (
                      'Subscribe'
                    )}
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="mt-8 mb-4">
          <p className="text-center text-muted-foreground text-xs">
            Cancel anytime • No hidden fees • Instant activation
          </p>
        </div>
      </div>
    </main>
  );
};

export default VIPSubscription;
