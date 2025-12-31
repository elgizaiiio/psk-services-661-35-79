import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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
  Headphones
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useTelegramTonConnect } from '@/hooks/useTelegramTonConnect';
import { useDirectTonPayment } from '@/hooks/useDirectTonPayment';
import { usePriceCalculator } from '@/hooks/usePriceCalculator';
import { useTelegramBackButton } from '@/hooks/useTelegramBackButton';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface VIPBenefit {
  icon: React.ReactNode;
  label: string;
  value: string;
}

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
  gradient: string;
  iconBg: string;
  icon: React.ReactNode;
  benefits: VIPBenefit[];
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
    gradient: 'from-slate-400 to-slate-500',
    iconBg: 'bg-slate-500/20',
    icon: <Star className="w-6 h-6 text-slate-400" />,
    benefits: [
      { icon: <Rocket className="w-4 h-4" />, label: 'Mining Speed', value: '+20%' },
      { icon: <Gift className="w-4 h-4" />, label: 'Daily Bonus', value: '100 BOLT' },
      { icon: <Ticket className="w-4 h-4" />, label: 'Free Spins', value: '3/day' },
      { icon: <Users className="w-4 h-4" />, label: 'Referral Bonus', value: '+20%' },
      { icon: <Clock className="w-4 h-4" />, label: 'Mining Duration', value: '+2 hours' },
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
    gradient: 'from-amber-400 to-orange-500',
    iconBg: 'bg-amber-500/20',
    icon: <Crown className="w-6 h-6 text-amber-400" />,
    benefits: [
      { icon: <Rocket className="w-4 h-4" />, label: 'Mining Speed', value: '+50%' },
      { icon: <Gift className="w-4 h-4" />, label: 'Daily Bonus', value: '300 BOLT' },
      { icon: <Ticket className="w-4 h-4" />, label: 'Free Spins', value: '5/day' },
      { icon: <Users className="w-4 h-4" />, label: 'Referral Bonus', value: '+50%' },
      { icon: <Clock className="w-4 h-4" />, label: 'Mining Duration', value: '+4 hours' },
      { icon: <Headphones className="w-4 h-4" />, label: 'Support', value: 'Priority' },
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
    gradient: 'from-violet-400 to-purple-600',
    iconBg: 'bg-violet-500/20',
    icon: <Gem className="w-6 h-6 text-violet-400" />,
    benefits: [
      { icon: <Rocket className="w-4 h-4" />, label: 'Mining Speed', value: '+100%' },
      { icon: <Gift className="w-4 h-4" />, label: 'Daily Bonus', value: '700 BOLT' },
      { icon: <Ticket className="w-4 h-4" />, label: 'Free Spins', value: '10/day' },
      { icon: <Users className="w-4 h-4" />, label: 'Referral Bonus', value: '+100%' },
      { icon: <Clock className="w-4 h-4" />, label: 'Mining Duration', value: '+8 hours' },
      { icon: <Headphones className="w-4 h-4" />, label: 'Support', value: 'VIP 24/7' },
    ]
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
  const [selectedPlan, setSelectedPlan] = useState<string>('gold');
  
  // Enable Telegram back button
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
          setSelectedPlan(vipData.tier);
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
      }
    } catch (error) {
      console.error('Purchase error:', error);
      toast.error('Purchase failed');
    } finally {
      setPurchasing(null);
    }
  };

  const currentPlan = vipPlans.find(p => p.id === selectedPlan) || vipPlans[1];

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
          <h1 className="text-xl font-semibold text-foreground">VIP Membership</h1>
        </div>

        {/* Plan Selector */}
        <div className="flex gap-2 p-1 bg-muted rounded-xl mb-6">
          {vipPlans.map((plan) => (
            <button
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
                selectedPlan === plan.id
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {plan.name}
            </button>
          ))}
        </div>

        {/* Selected Plan Card */}
        <motion.div
          key={currentPlan.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          className="relative overflow-hidden rounded-2xl bg-card border border-border"
        >
          {/* Gradient accent */}
          <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${currentPlan.gradient}`} />
          
          <div className="p-5">
            {currentVIP === currentPlan.tier && (
              <div className="absolute top-4 right-4">
                <span className="text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Active
                </span>
              </div>
            )}

            {/* Icon & Name */}
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 rounded-xl ${currentPlan.iconBg} flex items-center justify-center`}>
                {currentPlan.icon}
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">{currentPlan.name} VIP</h2>
                <p className="text-xs text-muted-foreground">30-day membership</p>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-2 mb-5">
              <span className="text-3xl font-bold text-foreground">{currentPlan.priceTon}</span>
              <span className="text-base text-muted-foreground">TON</span>
              <span className="text-sm text-muted-foreground">≈ {formatUsd(tonToUsd(currentPlan.priceTon))}</span>
            </div>

            {/* Benefits List */}
            <div className="space-y-2.5 mb-5">
              {currentPlan.benefits.map((benefit, i) => (
                <div 
                  key={i} 
                  className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border/50"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg ${currentPlan.iconBg} flex items-center justify-center`}>
                      <span className="text-foreground">{benefit.icon}</span>
                    </div>
                    <span className="text-sm text-foreground">{benefit.label}</span>
                  </div>
                  <span className={`text-sm font-bold bg-gradient-to-r ${currentPlan.gradient} bg-clip-text text-transparent`}>
                    {benefit.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Subscribe Button */}
            <Button
              onClick={() => handlePurchase(currentPlan)}
              disabled={currentVIP === currentPlan.tier || purchasing === currentPlan.id || isProcessing}
              className={`w-full h-11 text-sm font-medium bg-gradient-to-r ${currentPlan.gradient} hover:opacity-90 transition-opacity`}
            >
              {purchasing === currentPlan.id ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : currentVIP === currentPlan.tier ? (
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  Subscribed
                </span>
              ) : !isConnected ? (
                'Connect Wallet'
              ) : (
                <span className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Subscribe Now
                </span>
              )}
            </Button>
          </div>
        </motion.div>

        {/* Footer Note */}
        <p className="text-xs text-muted-foreground text-center mt-5">
          Benefits activate immediately • No auto-renewal
        </p>
      </div>
    </main>
  );
};

export default VIPSubscription;
