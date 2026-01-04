import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft,
  Zap,
  Check,
  Star,
  Crown,
  Gem,
  Rocket,
  Gift,
  Ticket,
  Clock,
  Users,
  Headphones,
  Shield,
  Sparkles,
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useTelegramTonConnect } from '@/hooks/useTelegramTonConnect';
import { useDirectTonPayment } from '@/hooks/useDirectTonPayment';
import { usePriceCalculator } from '@/hooks/usePriceCalculator';
import { useTelegramBackButton } from '@/hooks/useTelegramBackButton';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface VIPPlan {
  id: string;
  name: string;
  tier: 'silver' | 'gold' | 'platinum';
  priceTon: number;
  duration: number;
  miningBoost: number;
  dailyBonus: number;
  weeklySpinTickets: number;
  referralBonus: number;
  miningDurationBonus: number;
  popular?: boolean;
  features: string[];
}

const vipPlans: VIPPlan[] = [
  {
    id: 'silver',
    name: 'Silver',
    tier: 'silver',
    priceTon: 2,
    duration: 30,
    miningBoost: 20,
    dailyBonus: 100,
    weeklySpinTickets: 3,
    referralBonus: 20,
    miningDurationBonus: 2,
    features: [
      '+20% Mining Speed',
      '100 BOLT Daily Bonus',
      '3 Free Spins/day',
      '+20% Referral Bonus',
      '+2h Mining Duration',
    ]
  },
  {
    id: 'gold',
    name: 'Gold',
    tier: 'gold',
    priceTon: 5,
    duration: 30,
    miningBoost: 50,
    dailyBonus: 300,
    weeklySpinTickets: 10,
    referralBonus: 50,
    miningDurationBonus: 4,
    popular: true,
    features: [
      '+50% Mining Speed',
      '300 BOLT Daily Bonus',
      '5 Free Spins/day',
      '+50% Referral Bonus',
      '+4h Mining Duration',
      'Priority Support',
    ]
  },
  {
    id: 'platinum',
    name: 'Platinum',
    tier: 'platinum',
    priceTon: 10,
    duration: 30,
    miningBoost: 100,
    dailyBonus: 700,
    weeklySpinTickets: 25,
    referralBonus: 100,
    miningDurationBonus: 8,
    features: [
      '+100% Mining Speed',
      '700 BOLT Daily Bonus',
      '10 Free Spins/day',
      '+100% Referral Bonus',
      '+8h Mining Duration',
      'VIP 24/7 Support',
    ]
  }
];

const tierConfig = {
  silver: {
    icon: Star,
    gradient: 'from-slate-300 via-slate-400 to-slate-500',
    bg: 'bg-slate-500/10',
    border: 'border-slate-500/30',
    text: 'text-slate-400',
    glow: 'shadow-slate-500/20',
  },
  gold: {
    icon: Crown,
    gradient: 'from-amber-300 via-yellow-400 to-orange-500',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    glow: 'shadow-amber-500/20',
  },
  platinum: {
    icon: Gem,
    gradient: 'from-violet-300 via-purple-400 to-indigo-500',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/30',
    text: 'text-violet-400',
    glow: 'shadow-violet-500/20',
  },
};

const VIPSubscription = () => {
  const navigate = useNavigate();
  const { user: telegramUser } = useTelegramAuth();
  const { isConnected, connectWallet } = useTelegramTonConnect();
  const { sendDirectPayment, isProcessing } = useDirectTonPayment();
  const { tonToUsd, formatUsd } = usePriceCalculator();
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
          weeklySpinTickets: plan.weeklySpinTickets,
          referralBonus: plan.referralBonus,
          miningDurationBonus: plan.miningDurationBonus
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
        setVipExpiresAt(expiresAt.toISOString());
      }
    } catch (error) {
      console.error('Purchase error:', error);
      toast.error('Purchase failed');
    } finally {
      setPurchasing(null);
    }
  };

  const getDaysRemaining = () => {
    if (!vipExpiresAt) return 0;
    return Math.ceil((new Date(vipExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  };

  const currentPlanData = currentVIP ? vipPlans.find(p => p.tier === currentVIP) : null;

  return (
    <main className="min-h-screen bg-background pb-24">
      <Helmet>
        <title>VIP | Bolt</title>
        <meta name="description" content="Get VIP benefits" />
      </Helmet>

      <div className="max-w-md mx-auto px-4 pt-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(-1)}
            className="shrink-0 -ml-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">VIP Membership</h1>
            <p className="text-xs text-muted-foreground">Unlock exclusive benefits</p>
          </div>
        </div>

        {/* Current VIP Status Banner */}
        {currentVIP && currentPlanData && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 p-4 rounded-2xl bg-gradient-to-r ${tierConfig[currentVIP as keyof typeof tierConfig].gradient} relative overflow-hidden`}
          >
            <div className="absolute inset-0 bg-black/40" />
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  {currentVIP === 'silver' && <Star className="w-5 h-5 text-white" />}
                  {currentVIP === 'gold' && <Crown className="w-5 h-5 text-white" />}
                  {currentVIP === 'platinum' && <Gem className="w-5 h-5 text-white" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{currentPlanData.name} VIP</span>
                    <Badge className="bg-white/20 text-white text-[10px] border-0">Active</Badge>
                  </div>
                  <p className="text-xs text-white/80">{getDaysRemaining()} days remaining</p>
                </div>
              </div>
              <Shield className="w-8 h-8 text-white/40" />
            </div>
          </motion.div>
        )}

        {/* Plans Grid */}
        <div className="space-y-4">
          {vipPlans.map((plan, index) => {
            const config = tierConfig[plan.tier];
            const TierIcon = config.icon;
            const isActive = currentVIP === plan.tier;
            const isUpgrade = currentVIP && vipPlans.findIndex(p => p.tier === currentVIP) < index;
            
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                {plan.popular && (
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10">
                    <Badge className={`bg-gradient-to-r ${config.gradient} text-white border-0 text-[10px] px-3 shadow-lg`}>
                      <Sparkles className="w-3 h-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                <div 
                  className={`
                    relative p-4 rounded-2xl border transition-all duration-300
                    ${isActive 
                      ? `${config.bg} ${config.border} shadow-lg ${config.glow}` 
                      : 'bg-card/60 backdrop-blur-sm border-border/50 hover:border-border'
                    }
                    ${plan.popular ? 'mt-3' : ''}
                  `}
                >
                  {/* Header Row */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-xl ${config.bg} ${config.border} border flex items-center justify-center`}>
                        <TierIcon className={`w-5 h-5 ${config.text}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-foreground">{plan.name}</h3>
                          {isActive && (
                            <Check className="w-4 h-4 text-green-500" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">30 days access</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-baseline gap-1">
                        <span className={`text-xl font-bold bg-gradient-to-r ${config.gradient} bg-clip-text text-transparent`}>
                          {plan.priceTon}
                        </span>
                        <span className="text-xs text-muted-foreground">TON</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        ≈ {formatUsd(tonToUsd(plan.priceTon))}
                      </p>
                    </div>
                  </div>

                  {/* Benefits Grid */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {plan.features.slice(0, 4).map((feature, i) => (
                      <div 
                        key={i}
                        className="flex items-center gap-2 text-xs text-muted-foreground"
                      >
                        <Check className={`w-3 h-3 ${config.text} shrink-0`} />
                        <span className="truncate">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Additional features */}
                  {plan.features.length > 4 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {plan.features.slice(4).map((feature, i) => (
                        <Badge 
                          key={i}
                          variant="outline" 
                          className={`text-[10px] ${config.border} ${config.text} bg-transparent`}
                        >
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Action Button */}
                  <Button
                    onClick={() => handlePurchase(plan)}
                    disabled={isActive || purchasing === plan.id || isProcessing}
                    className={`w-full h-10 text-sm font-medium transition-all ${
                      isActive 
                        ? 'bg-muted text-muted-foreground cursor-not-allowed'
                        : `bg-gradient-to-r ${config.gradient} hover:opacity-90 text-white shadow-md`
                    }`}
                  >
                    {purchasing === plan.id ? (
                      <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                    ) : isActive ? (
                      <span className="flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Current Plan
                      </span>
                    ) : !isConnected ? (
                      'Connect Wallet'
                    ) : isUpgrade ? (
                      <span className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Upgrade
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        Subscribe
                      </span>
                    )}
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Comparison Section */}
        <div className="mt-8 p-4 rounded-2xl bg-card/40 backdrop-blur-sm border border-border/30">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Why Go VIP?
          </h3>
          <div className="space-y-3">
            {[
              { icon: Rocket, label: 'Up to 2x faster mining speed', color: 'text-blue-400' },
              { icon: Gift, label: 'Daily bonus up to 700 BOLT', color: 'text-green-400' },
              { icon: Ticket, label: 'Up to 10 free spins every day', color: 'text-purple-400' },
              { icon: Users, label: 'Double referral rewards', color: 'text-amber-400' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center">
                  <item.icon className={`w-4 h-4 ${item.color}`} />
                </div>
                <span className="text-sm text-foreground">{item.label}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="text-[10px] text-muted-foreground text-center mt-6">
          Benefits activate immediately • No auto-renewal • Cancel anytime
        </p>
      </div>
    </main>
  );
};

export default VIPSubscription;
