import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft,
  Sparkles,
  Zap,
  Check,
  CircleDollarSign,
  Flame,
  Diamond,
  Clock,
  Users,
  Gauge
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  weeklySpinTickets: number;
  icon: React.ReactNode;
  accentColor: string;
}

const vipPlans: VIPPlan[] = [
  {
    id: 'silver',
    name: 'Silver',
    tier: 'silver',
    priceTon: 2,
    duration: 30,
    features: [
      '+20% Mining Speed',
      '100 BOLT Daily',
      '3 Spins/week',
      'Priority Support'
    ],
    miningBoost: 20,
    dailyBonus: 100,
    weeklySpinTickets: 3,
    icon: <Sparkles className="w-5 h-5" />,
    accentColor: 'text-gray-400'
  },
  {
    id: 'gold',
    name: 'Gold',
    tier: 'gold',
    priceTon: 5,
    duration: 30,
    features: [
      '+50% Mining Speed',
      '300 BOLT Daily',
      '10 Spins/week',
      'Early Access',
      'Weekly Chest'
    ],
    miningBoost: 50,
    dailyBonus: 300,
    weeklySpinTickets: 10,
    icon: <Flame className="w-5 h-5" />,
    accentColor: 'text-amber-500'
  },
  {
    id: 'platinum',
    name: 'Platinum',
    tier: 'platinum',
    priceTon: 10,
    duration: 30,
    features: [
      '+100% Mining Speed',
      '700 BOLT Daily',
      '25 Spins/week',
      'Exclusive Access',
      'Monthly Gifts',
      'No Ads'
    ],
    miningBoost: 100,
    dailyBonus: 700,
    weeklySpinTickets: 25,
    icon: <Diamond className="w-5 h-5" />,
    accentColor: 'text-violet-400'
  }
];

const VIPSubscription = () => {
  const navigate = useNavigate();
  const { user: telegramUser } = useTelegramAuth();
  const { isConnected, connectWallet } = useTelegramTonConnect();
  const { sendDirectPayment, isProcessing } = useDirectTonPayment();
  const { tonToUsd, formatUsd } = usePriceCalculator();
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
        description: `${plan.name} VIP - ${plan.duration} days`,
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

        toast.success(`${plan.name} VIP activated!`);
        setCurrentVIP(plan.tier);
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
        <title>VIP | Bolt</title>
        <meta name="description" content="Get VIP benefits" />
      </Helmet>

      <div className="max-w-md mx-auto px-4 pt-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(-1)}
            className="shrink-0 -ml-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-semibold text-foreground">VIP Plans</h1>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="flex flex-col items-center p-3 rounded-xl bg-card border border-border">
            <Gauge className="w-5 h-5 text-primary mb-1" />
            <span className="text-xs text-muted-foreground">Speed</span>
          </div>
          <div className="flex flex-col items-center p-3 rounded-xl bg-card border border-border">
            <CircleDollarSign className="w-5 h-5 text-primary mb-1" />
            <span className="text-xs text-muted-foreground">Bonus</span>
          </div>
          <div className="flex flex-col items-center p-3 rounded-xl bg-card border border-border">
            <Clock className="w-5 h-5 text-primary mb-1" />
            <span className="text-xs text-muted-foreground">30 Days</span>
          </div>
        </div>

        {/* Plans */}
        <div className="space-y-3">
          {vipPlans.map((plan, index) => {
            const isActive = currentVIP === plan.tier;
            const isLoading = purchasing === plan.id;
            
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`relative p-4 rounded-2xl border transition-all ${
                  isActive 
                    ? 'bg-primary/5 border-primary/30' 
                    : 'bg-card border-border hover:border-primary/20'
                }`}
              >
                {/* Active indicator */}
                {isActive && (
                  <div className="absolute top-3 right-3">
                    <span className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      Active
                    </span>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-xl bg-muted flex items-center justify-center ${plan.accentColor}`}>
                    {plan.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between mb-2">
                      <h3 className="font-medium text-foreground">{plan.name}</h3>
                      <div className="text-right">
                        <span className="text-lg font-semibold text-foreground">{plan.priceTon} TON</span>
                        <p className="text-[10px] text-muted-foreground">{formatUsd(tonToUsd(plan.priceTon))}</p>
                      </div>
                    </div>

                    {/* Features */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {plan.features.slice(0, 3).map((feature, i) => (
                        <span 
                          key={i}
                          className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full"
                        >
                          {feature}
                        </span>
                      ))}
                      {plan.features.length > 3 && (
                        <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                          +{plan.features.length - 3} more
                        </span>
                      )}
                    </div>

                    {/* Button */}
                    <Button
                      onClick={() => handlePurchase(plan)}
                      disabled={isActive || isLoading || isProcessing}
                      size="sm"
                      className="w-full h-9"
                      variant={isActive ? "secondary" : "default"}
                    >
                      {isLoading ? (
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : isActive ? (
                        <span className="flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5" />
                          Subscribed
                        </span>
                      ) : !isConnected ? (
                        'Connect Wallet'
                      ) : (
                        <span className="flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5" />
                          Subscribe
                        </span>
                      )}
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Info */}
        <div className="mt-6 p-4 rounded-xl bg-muted/30">
          <div className="flex items-start gap-3">
            <Users className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              VIP benefits activate immediately after payment. Subscriptions are valid for 30 days and do not auto-renew.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
};

export default VIPSubscription;
