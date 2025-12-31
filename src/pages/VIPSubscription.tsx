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
  Shield
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
  highlights: string[];
  miningBoost: number;
  dailyBonus: number;
  weeklySpinTickets: number;
  gradient: string;
  iconBg: string;
  icon: React.ReactNode;
}

const vipPlans: VIPPlan[] = [
  {
    id: 'silver',
    name: 'Silver',
    tier: 'silver',
    priceTon: 2,
    duration: 30,
    highlights: ['+20% Mining', '100 BOLT/day', '3 Spins/week'],
    miningBoost: 20,
    dailyBonus: 100,
    weeklySpinTickets: 3,
    gradient: 'from-slate-400 to-slate-500',
    iconBg: 'bg-slate-500/20',
    icon: <Star className="w-6 h-6 text-slate-400" />
  },
  {
    id: 'gold',
    name: 'Gold',
    tier: 'gold',
    priceTon: 5,
    duration: 30,
    highlights: ['+50% Mining', '300 BOLT/day', '10 Spins/week'],
    miningBoost: 50,
    dailyBonus: 300,
    weeklySpinTickets: 10,
    gradient: 'from-amber-400 to-orange-500',
    iconBg: 'bg-amber-500/20',
    icon: <Crown className="w-6 h-6 text-amber-400" />
  },
  {
    id: 'platinum',
    name: 'Platinum',
    tier: 'platinum',
    priceTon: 10,
    duration: 30,
    highlights: ['+100% Mining', '700 BOLT/day', '25 Spins/week'],
    miningBoost: 100,
    dailyBonus: 700,
    weeklySpinTickets: 25,
    gradient: 'from-violet-400 to-purple-600',
    iconBg: 'bg-violet-500/20',
    icon: <Gem className="w-6 h-6 text-violet-400" />
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
          className="relative overflow-hidden rounded-2xl bg-card border border-border p-6 mb-6"
        >
          {/* Gradient accent */}
          <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${currentPlan.gradient}`} />
          
          {currentVIP === currentPlan.tier && (
            <div className="absolute top-4 right-4">
              <span className="text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full flex items-center gap-1">
                <Check className="w-3 h-3" />
                Active
              </span>
            </div>
          )}

          {/* Icon & Name */}
          <div className="flex items-center gap-4 mb-6">
            <div className={`w-14 h-14 rounded-2xl ${currentPlan.iconBg} flex items-center justify-center`}>
              {currentPlan.icon}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">{currentPlan.name} VIP</h2>
              <p className="text-sm text-muted-foreground">30-day membership</p>
            </div>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-2 mb-6">
            <span className="text-4xl font-bold text-foreground">{currentPlan.priceTon}</span>
            <span className="text-lg text-muted-foreground">TON</span>
            <span className="text-sm text-muted-foreground ml-2">≈ {formatUsd(tonToUsd(currentPlan.priceTon))}</span>
          </div>

          {/* Highlights */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {currentPlan.highlights.map((highlight, i) => (
              <div key={i} className="text-center p-3 rounded-xl bg-muted/50">
                <p className="text-xs text-muted-foreground">{highlight}</p>
              </div>
            ))}
          </div>

          {/* Subscribe Button */}
          <Button
            onClick={() => handlePurchase(currentPlan)}
            disabled={currentVIP === currentPlan.tier || purchasing === currentPlan.id || isProcessing}
            className={`w-full h-12 text-base font-medium bg-gradient-to-r ${currentPlan.gradient} hover:opacity-90 transition-opacity`}
          >
            {purchasing === currentPlan.id ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : currentVIP === currentPlan.tier ? (
              <span className="flex items-center gap-2">
                <Check className="w-5 h-5" />
                Currently Subscribed
              </span>
            ) : !isConnected ? (
              'Connect Wallet'
            ) : (
              <span className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Subscribe Now
              </span>
            )}
          </Button>
        </motion.div>

        {/* Benefits */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-foreground mb-3">All VIP Benefits</h3>
          
          <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Rocket className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Faster Mining</p>
              <p className="text-xs text-muted-foreground">Up to +100% mining speed</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Gift className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Daily BOLT Bonus</p>
              <p className="text-xs text-muted-foreground">Earn up to 700 BOLT daily</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Free Spin Tickets</p>
              <p className="text-xs text-muted-foreground">Up to 25 free spins weekly</p>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-xs text-muted-foreground text-center mt-6">
          Benefits activate immediately • No auto-renewal
        </p>
      </div>
    </main>
  );
};

export default VIPSubscription;
