import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useViralMining } from '@/hooks/useViralMining';
import { useTelegramBackButton } from '@/hooks/useTelegramBackButton';
import { usePriceCalculator } from '@/hooks/usePriceCalculator';
import { useVipSpins } from '@/hooks/useVipSpins';
import { useAdsGramRewarded } from '@/hooks/useAdsGramRewarded';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Gift, Zap, Ticket, Sparkles, X, Crown, ShoppingCart, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageWrapper, FadeUp } from '@/components/ui/motion-wrapper';
import { BoltIcon, TonIcon, UsdtIcon, EthIcon, ViralIcon } from '@/components/ui/currency-icons';
import { UnifiedPaymentModal } from '@/components/payment/UnifiedPaymentModal';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
interface SpinReward {
  id: string;
  label: string;
  type: 'bolt' | 'ton' | 'usdt' | 'eth' | 'viral' | 'booster' | 'nothing';
  value: number;
  probability: number;
}

interface TicketPackage {
  id: string;
  tickets: number;
  priceTon: number;
}

// Normal Wheel Rewards - includes ETH and Viral, TON/USDT at 0%
const NORMAL_REWARDS: SpinReward[] = [
  { id: 'viral_50', label: '50', type: 'viral', value: 50, probability: 15 },
  { id: 'bolt_50', label: '50', type: 'bolt', value: 50, probability: 20 },
  { id: 'viral_100', label: '100', type: 'viral', value: 100, probability: 12 },
  { id: 'bolt_100', label: '100', type: 'bolt', value: 100, probability: 18 },
  { id: 'nothing', label: 'X', type: 'nothing', value: 0, probability: 20 },
  { id: 'bolt_200', label: '200', type: 'bolt', value: 200, probability: 10 },
  { id: 'viral_200', label: '200', type: 'viral', value: 200, probability: 5 },
  { id: 'bolt_500', label: '500', type: 'bolt', value: 500, probability: 5 },
  { id: 'eth_small', label: '0.0001', type: 'eth', value: 0.0001, probability: 2.5 },
  { id: 'mining_x2', label: '2x', type: 'booster', value: 24, probability: 2.5 },
];

// PRO Wheel Rewards - includes ETH and Viral, TON/USDT at 0%
const PRO_REWARDS: SpinReward[] = [
  { id: 'viral_500', label: '500', type: 'viral', value: 500, probability: 15 },
  { id: 'bolt_1000', label: '1K', type: 'bolt', value: 1000, probability: 22 },
  { id: 'viral_1000', label: '1K', type: 'viral', value: 1000, probability: 10 },
  { id: 'bolt_2000', label: '2K', type: 'bolt', value: 2000, probability: 18 },
  { id: 'nothing', label: 'X', type: 'nothing', value: 0, probability: 15 },
  { id: 'bolt_5000', label: '5K', type: 'bolt', value: 5000, probability: 10 },
  { id: 'eth_medium', label: '0.0005', type: 'eth', value: 0.0005, probability: 3 },
  { id: 'viral_2000', label: '2K', type: 'viral', value: 2000, probability: 4 },
  { id: 'bolt_10000', label: '10K', type: 'bolt', value: 10000, probability: 2 },
  { id: 'eth_large', label: '0.001', type: 'eth', value: 0.001, probability: 1 },
];

// USDT Premium Wheel - Always wins 1 USDT (100% probability)
const USDT_REWARDS: SpinReward[] = [
  { id: 'usdt_1_premium', label: '1', type: 'usdt', value: 1, probability: 100 },
  { id: 'usdt_5_premium', label: '5', type: 'usdt', value: 5, probability: 0 },
  { id: 'usdt_10_premium', label: '10', type: 'usdt', value: 10, probability: 0 },
  { id: 'usdt_25_premium', label: '25', type: 'usdt', value: 25, probability: 0 },
  { id: 'usdt_50_premium', label: '50', type: 'usdt', value: 50, probability: 0 },
  { id: 'usdt_100_premium', label: '100', type: 'usdt', value: 100, probability: 0 },
  { id: 'usdt_250_premium', label: '250', type: 'usdt', value: 250, probability: 0 },
  { id: 'usdt_500_premium', label: '500', type: 'usdt', value: 500, probability: 0 },
  { id: 'usdt_777_premium', label: '777', type: 'usdt', value: 777, probability: 0 },
];

// USDT Wheel Price
const USDT_SPIN_PRICE_TON = 5;

// Normal Ticket Packages - Stars calculated dynamically
const NORMAL_PACKAGES: TicketPackage[] = [
  { id: 'normal_3', tickets: 3, priceTon: 0.25 },
  { id: 'normal_5', tickets: 5, priceTon: 0.4 },
  { id: 'normal_10', tickets: 10, priceTon: 0.7 },
  { id: 'normal_25', tickets: 25, priceTon: 1.5 },
];

// PRO Ticket Packages - Stars calculated dynamically
const PRO_PACKAGES: TicketPackage[] = [
  { id: 'pro_3', tickets: 3, priceTon: 0.6 },
  { id: 'pro_5', tickets: 5, priceTon: 0.9 },
  { id: 'pro_10', tickets: 10, priceTon: 1.6 },
  { id: 'pro_25', tickets: 25, priceTon: 3.5 },
];

// Special guaranteed TON win package - pay 5 TON, guaranteed win 0.1 TON
const SPECIAL_TON_PACKAGE = {
  id: 'special_ton_guaranteed',
  priceTon: 5,
  guaranteedWinTon: 0.1,
};

// Wheel colors - 2 colors each
const NORMAL_COLORS = ['#3B82F6', '#1E40AF']; // Blue shades
const PRO_COLORS = ['#8B5CF6', '#6D28D9']; // Purple shades
const USDT_COLORS = ['#22C55E', '#16A34A']; // Green shades for USDT

const Spin: React.FC = () => {
  const { user: tgUser, hapticFeedback } = useTelegramAuth();
  const { user, loading: miningLoading } = useViralMining(tgUser);
  const { tonToStars, tonToUsd, tonPrice } = usePriceCalculator();
  const { 
    isVip, 
    vipTier, 
    vipSpinsAvailable, 
    vipSpinsClaimed, 
    claimVipSpins,
    dailySpinsForTier,
    refresh: refreshVipSpins 
  } = useVipSpins(user?.id);
  const { showAd, isReady: adReady, isLoading: adLoading } = useAdsGramRewarded();
  useTelegramBackButton();

  const [wheelType, setWheelType] = useState<'normal' | 'pro' | 'usdt'>('normal');
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<SpinReward | null>(null);
  const [normalTickets, setNormalTickets] = useState(0);
  const [proTickets, setProTickets] = useState(0);
  const [referralTickets, setReferralTickets] = useState(0);
  const [freeTicketAvailable, setFreeTicketAvailable] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<TicketPackage | null>(null);
  const [showPackagesSheet, setShowPackagesSheet] = useState(false);
  const [rewardApplied, setRewardApplied] = useState(false);
  const [showSpecialPayment, setShowSpecialPayment] = useState(false);
  const [processingSpecial, setProcessingSpecial] = useState(false);
  const [hasMultiplier, setHasMultiplier] = useState(false);
  const [watchingAd, setWatchingAd] = useState(false);
  const [showUsdtSpinPayment, setShowUsdtSpinPayment] = useState(false);
  const [processingUsdtSpin, setProcessingUsdtSpin] = useState(false);

  const rewards = wheelType === 'usdt' ? USDT_REWARDS : wheelType === 'pro' ? PRO_REWARDS : NORMAL_REWARDS;
  const packages = wheelType === 'normal' ? NORMAL_PACKAGES : PRO_PACKAGES;
  const wheelColors = wheelType === 'usdt' ? USDT_COLORS : wheelType === 'pro' ? PRO_COLORS : NORMAL_COLORS;
  const currentTickets = wheelType === 'normal' ? (normalTickets + referralTickets) : proTickets;
  const segmentAngle = 360 / rewards.length;

  // Load user tickets
  const loadTickets = useCallback(async () => {
    if (!user?.id) return;

    const today = new Date().toISOString().split('T')[0];
    
    // Use upsert to ensure record exists
    const { data, error } = await supabase
      .from('user_spin_tickets')
      .upsert(
        { 
          user_id: user.id,
          tickets_count: 0,
          pro_tickets_count: 0,
        }, 
        { 
          onConflict: 'user_id',
          ignoreDuplicates: true 
        }
      )
      .select('*')
      .single();

    if (error) {
      // If upsert failed, try to fetch existing
      const { data: existingData } = await supabase
        .from('user_spin_tickets')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (existingData) {
        setNormalTickets(existingData.tickets_count || 0);
        setProTickets(existingData.pro_tickets_count || 0);
        setReferralTickets((existingData as any).referral_tickets_count || 0);
        const alreadyClaimedToday = existingData.free_ticket_date === today;
        setFreeTicketAvailable(!alreadyClaimedToday);
      } else {
        setFreeTicketAvailable(true);
      }
      return;
    }

    if (data) {
      setNormalTickets(data.tickets_count || 0);
      setProTickets(data.pro_tickets_count || 0);
      setReferralTickets((data as any).referral_tickets_count || 0);
      const alreadyClaimedToday = data.free_ticket_date === today;
      setFreeTicketAvailable(!alreadyClaimedToday);
    }
  }, [user?.id]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  // Get random reward based on probability
  const getRandomReward = (rewardsList: SpinReward[] = rewards): SpinReward => {
    const random = Math.random() * 100;
    let cumulative = 0;
    
    for (const reward of rewardsList) {
      cumulative += reward.probability;
      if (random <= cumulative) {
        return reward;
      }
    }
    return rewardsList[0];
  };

  // Apply reward to user (with optional multiplier)
  const applyReward = async (reward: SpinReward, multiplier: number = 1, wheelTypeUsed: string = wheelType) => {
    if (!user?.id) return;

    const finalValue = reward.type === 'bolt' || reward.type === 'viral' ? reward.value * multiplier : reward.value;

    try {
      await supabase.from('spin_history').insert({
        user_id: user.id,
        reward_type: reward.id,
        reward_amount: finalValue,
        wheel_type: wheelTypeUsed,
      });

      if (reward.type === 'bolt') {
        await supabase
          .from('bolt_users')
          .update({ token_balance: (user.token_balance || 0) + finalValue })
          .eq('id', user.id);
      } else if (reward.type === 'usdt') {
        await supabase
          .from('bolt_users')
          .update({ usdt_balance: ((user as any).usdt_balance || 0) + reward.value })
          .eq('id', user.id);
      } else if (reward.type === 'eth') {
        await supabase
          .from('bolt_users')
          .update({ eth_balance: ((user as any).eth_balance || 0) + reward.value })
          .eq('id', user.id);
      } else if (reward.type === 'viral') {
        await supabase
          .from('bolt_users')
          .update({ viral_balance: ((user as any).viral_balance || 0) + finalValue })
          .eq('id', user.id);
      } else if (reward.type === 'booster') {
        const expiresAt = new Date(Date.now() + reward.value * 60 * 60 * 1000);
        await supabase.from('user_boosters').insert({
          user_id: user.id,
          booster_type: 'mining_x2',
          expires_at: expiresAt.toISOString(),
        });
      }
    } catch (error) {
      console.error('Error applying reward:', error);
    }
  };

  // Watch ad for 2x multiplier
  const handleWatchAdForMultiplier = async () => {
    if (!adReady || hasMultiplier) return;

    setWatchingAd(true);
    try {
      const completed = await showAd();
      if (completed) {
        setHasMultiplier(true);
        hapticFeedback.notification('success');
        toast.success('2x Multiplier activated for next spin!');
      } else {
        toast.info('Watch the full ad to get 2x multiplier');
      }
    } catch (err) {
      console.error('Error watching ad:', err);
      toast.error('Failed to load ad');
    } finally {
      setWatchingAd(false);
    }
  };

  // Claim free daily ticket (Normal only)
  const claimFreeTicket = async () => {
    if (!user?.id || !freeTicketAvailable) return;

    const today = new Date().toISOString().split('T')[0];
    
    try {
      // First check if already claimed today
      const { data: existing } = await supabase
        .from('user_spin_tickets')
        .select('free_ticket_date, tickets_count')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (existing?.free_ticket_date === today) {
        setFreeTicketAvailable(false);
        toast.error('Already claimed today!');
        return;
      }
      
      const currentTickets = existing?.tickets_count || 0;
      
      // Use upsert to handle both insert and update cases
      const { error } = await supabase
        .from('user_spin_tickets')
        .upsert({ 
          user_id: user.id,
          tickets_count: currentTickets + 1,
          free_ticket_date: today,
        }, { onConflict: 'user_id' });

      if (error) {
        console.error('Error claiming free ticket:', error);
        toast.error('Failed to claim free ticket');
        return;
      }

      setNormalTickets(currentTickets + 1);
      setFreeTicketAvailable(false);
      hapticFeedback.notification('success');
      toast.success('Free ticket claimed!');
    } catch (err) {
      console.error('Error claiming free ticket:', err);
      toast.error('Failed to claim free ticket');
    }
  };

  // Claim VIP daily spins
  const handleClaimVipSpins = async () => {
    if (!user?.id || vipSpinsClaimed || vipSpinsAvailable === 0) return;

    try {
      const spinsAdded = await claimVipSpins();
      if (spinsAdded > 0) {
        setNormalTickets(prev => prev + spinsAdded);
        hapticFeedback.notification('success');
        toast.success(`${spinsAdded} VIP spins claimed!`);
      }
    } catch (err) {
      console.error('Error claiming VIP spins:', err);
      toast.error('Failed to claim VIP spins');
    }
  };

  // Handle spin
  const handleSpin = async () => {
    if (!user?.id || isSpinning || currentTickets <= 0) return;

    // Reset reward applied flag
    setRewardApplied(false);

    // Deduct ticket based on wheel type
    if (wheelType === 'normal') {
      // Use referral tickets first, then normal tickets
      if (referralTickets > 0) {
        await supabase
          .from('user_spin_tickets')
          .update({ referral_tickets_count: referralTickets - 1 })
          .eq('user_id', user.id);
        setReferralTickets(prev => prev - 1);
      } else {
        await supabase
          .from('user_spin_tickets')
          .update({ tickets_count: normalTickets - 1 })
          .eq('user_id', user.id);
        setNormalTickets(prev => prev - 1);
      }
    } else {
      await supabase
        .from('user_spin_tickets')
        .update({ pro_tickets_count: proTickets - 1 })
        .eq('user_id', user.id);
      setProTickets(prev => prev - 1);
    }

    hapticFeedback.impact('heavy');
    setIsSpinning(true);
    setResult(null);

    const reward = getRandomReward();
    const rewardIndex = rewards.findIndex(r => r.id === reward.id);
    
    const targetAngle = 360 - (rewardIndex * segmentAngle) - (segmentAngle / 2);
    const fullSpins = 5 + Math.floor(Math.random() * 3);
    // Keep the wheel stop deterministic inside the chosen segment to avoid visual/result mismatch
    const totalRotation = rotation + (fullSpins * 360) + targetAngle;
    
    setRotation(totalRotation);

    // Use a ref-like approach to prevent double execution
    let hasAppliedReward = false;

    setTimeout(async () => {
      if (hasAppliedReward) return;
      hasAppliedReward = true;
      
      setIsSpinning(false);
      setResult(reward);
      hapticFeedback.notification('success');

      if (reward.type !== 'nothing') {
        const multiplier = hasMultiplier ? 2 : 1;
        await applyReward(reward, multiplier);
        const displayValue = reward.type === 'bolt' ? reward.value * multiplier : reward.value;
        const multiplierText = hasMultiplier && reward.type === 'bolt' ? ' (2x!)' : '';
        toast.success(`You won ${displayValue} ${reward.type.toUpperCase()}!${multiplierText}`);
        // Reset multiplier after use
        setHasMultiplier(false);
      } else {
        toast.info('Better luck next time!');
        // Reset multiplier even on nothing
        setHasMultiplier(false);
      }
    }, 5000);
  };

  // Handle package purchase
  const handleBuyPackage = (pkg: TicketPackage) => {
    setSelectedPackage(pkg);
    setShowPackagesSheet(false);
    setShowPaymentModal(true);
  };

  // Handle purchase success - ONLY called after blockchain verification
  const handlePurchaseSuccess = async () => {
    if (!selectedPackage || !user?.id) return;
    
    try {
      // Update tickets in database
      const ticketColumn = wheelType === 'normal' ? 'tickets_count' : 'pro_tickets_count';
      const currentCount = wheelType === 'normal' ? normalTickets : proTickets;
      
      const { error } = await supabase
        .from('user_spin_tickets')
        .upsert({
          user_id: user.id,
          [ticketColumn]: currentCount + selectedPackage.tickets,
        }, { onConflict: 'user_id' });

      if (error) {
        console.error('Error updating tickets:', error);
        toast.error('Failed to add tickets');
        return;
      }
      
      // Update local state only after DB success
      if (wheelType === 'normal') {
        setNormalTickets(prev => prev + selectedPackage.tickets);
      } else {
        setProTickets(prev => prev + selectedPackage.tickets);
      }
      toast.success(`${selectedPackage.tickets} tickets added!`);
    } catch (error) {
      console.error('Error in handlePurchaseSuccess:', error);
      toast.error('Failed to add tickets');
    } finally {
      setSelectedPackage(null);
    }
  };

  // Handle special guaranteed TON win package
  const handleSpecialTonPurchaseSuccess = async () => {
    if (!user?.id) return;
    
    setProcessingSpecial(true);
    try {
      // Award the guaranteed 0.1 TON to user's balance
      // Since we don't have TON balance, we'll record this as a spin history entry
      await supabase.from('spin_history').insert({
        user_id: user.id,
        reward_type: 'special_ton_guaranteed',
        reward_amount: SPECIAL_TON_PACKAGE.guaranteedWinTon,
        wheel_type: 'special',
      });

      toast.success(`🎉 You won ${SPECIAL_TON_PACKAGE.guaranteedWinTon} TON!`);
      hapticFeedback.notification('success');
    } catch (error) {
      console.error('Error processing special TON:', error);
      toast.error('Failed to process reward');
    } finally {
      setProcessingSpecial(false);
      setShowSpecialPayment(false);
    }
  };

  // Handle USDT wheel spin after payment
  const handleUsdtSpinAfterPayment = async () => {
    if (!user?.id) return;
    
    setProcessingUsdtSpin(true);
    setShowUsdtSpinPayment(false);
    
    hapticFeedback.impact('heavy');
    setIsSpinning(true);
    setResult(null);

    // Always get the 1 USDT reward (100% probability)
    const reward = getRandomReward(USDT_REWARDS);
    const rewardIndex = USDT_REWARDS.findIndex(r => r.id === reward.id);
    
    const usdtSegmentAngle = 360 / USDT_REWARDS.length;
    const targetAngle = 360 - (rewardIndex * usdtSegmentAngle) - (usdtSegmentAngle / 2);
    const fullSpins = 5 + Math.floor(Math.random() * 3);
    const totalRotation = rotation + (fullSpins * 360) + targetAngle;
    
    setRotation(totalRotation);

    let hasAppliedReward = false;

    setTimeout(async () => {
      if (hasAppliedReward) return;
      hasAppliedReward = true;
      
      setIsSpinning(false);
      setResult(reward);
      hapticFeedback.notification('success');

      await applyReward(reward, 1, 'usdt');
      toast.success(`🎉 You won ${reward.value} USDT!`);
      
      setProcessingUsdtSpin(false);
    }, 5000);
  };


  if (miningLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
          <Loader2 className="w-8 h-8 text-primary" />
        </motion.div>
      </div>
    );
  }

  return (
    <PageWrapper className="min-h-screen bg-background pb-32">
      <Helmet><title>Lucky Spin</title></Helmet>
      
      <div className="max-w-md mx-auto px-4 pt-10">
        <div className="space-y-6">

          {/* Header with Tickets Count - Hide for USDT wheel */}
          <FadeUp>
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-bold text-foreground">Lucky Spin</h1>
              {wheelType !== 'usdt' && (
                <div className="flex items-center gap-2">
                  {/* Referral Tickets Badge */}
                  {wheelType === 'normal' && referralTickets > 0 && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-500">
                      <Gift className="w-3.5 h-3.5" />
                      <span>{referralTickets}</span>
                    </div>
                  )}
                  {/* Regular Tickets Badge */}
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold ${
                    wheelType === 'pro' 
                      ? 'bg-amber-500/20 text-amber-500' 
                      : 'bg-primary/20 text-primary'
                  }`}>
                    <Ticket className="w-4 h-4" />
                    <span>{wheelType === 'normal' ? normalTickets : proTickets}</span>
                  </div>
                </div>
              )}
              {wheelType === 'usdt' && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold bg-emerald-500/20 text-emerald-500">
                  <UsdtIcon size={16} />
                  <span>5 TON/Spin</span>
                </div>
              )}
            </div>
          </FadeUp>

          {/* Wheel Type Tabs */}
          <FadeUp>
            <Tabs value={wheelType} onValueChange={(v) => setWheelType(v as 'normal' | 'pro' | 'usdt')} className="w-full">
              <TabsList className="grid w-full grid-cols-3 h-10">
                <TabsTrigger value="normal" className="text-sm font-medium">
                  Normal
                </TabsTrigger>
                <TabsTrigger value="pro" className="text-sm font-medium">
                  PRO
                </TabsTrigger>
                <TabsTrigger value="usdt" className="text-sm font-medium text-amber-500 data-[state=active]:text-amber-600">
                  777
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </FadeUp>

          {/* Spin Wheel - Extra Large */}
          <FadeUp>
            <div className="relative flex items-center justify-center py-8">
              {/* Pointer */}
              <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20">
                <div className={`w-0 h-0 border-l-[18px] border-r-[18px] border-t-[32px] border-l-transparent border-r-transparent ${
                  wheelType === 'usdt' ? 'border-t-emerald-500' : wheelType === 'pro' ? 'border-t-purple-500' : 'border-t-primary'
                } drop-shadow-lg`} />
              </div>

              {/* Wheel Container - Extra Large */}
              <div className="relative w-[340px] h-[340px]">
                <motion.div
                  className="relative w-full h-full rounded-full shadow-2xl"
                  style={{ 
                    boxShadow: wheelType === 'usdt'
                      ? '0 0 0 6px rgb(34 197 94), 0 0 40px rgba(34, 197, 94, 0.4)'
                      : wheelType === 'pro'
                      ? '0 0 0 6px rgb(139 92 246), 0 0 40px rgba(139, 92, 246, 0.4)'
                      : '0 0 0 6px hsl(var(--primary)), 0 0 30px hsl(var(--primary)/0.3)'
                  }}
                  animate={{ rotate: rotation }}
                  transition={{ duration: 5, ease: [0.17, 0.67, 0.12, 0.99] }}
                >
                  {/* SVG Segments - 2 alternating colors */}
                  <svg viewBox="0 0 100 100" className="w-full h-full rounded-full overflow-hidden">
                    {rewards.map((reward, index) => {
                      const startAngle = index * segmentAngle;
                      const startRad = (startAngle - 90) * (Math.PI / 180);
                      const endRad = ((index + 1) * segmentAngle - 90) * (Math.PI / 180);
                      
                      const x1 = 50 + 50 * Math.cos(startRad);
                      const y1 = 50 + 50 * Math.sin(startRad);
                      const x2 = 50 + 50 * Math.cos(endRad);
                      const y2 = 50 + 50 * Math.sin(endRad);
                      const largeArc = segmentAngle > 180 ? 1 : 0;
                      
                      // Alternate between 2 colors
                      const color = wheelColors[index % 2];
                      
                      return (
                        <path
                          key={reward.id}
                          d={`M 50 50 L ${x1} ${y1} A 50 50 0 ${largeArc} 1 ${x2} ${y2} Z`}
                          fill={color}
                          stroke="rgba(255,255,255,0.15)"
                          strokeWidth="0.3"
                        />
                      );
                    })}
                  </svg>

                  {/* Icons overlay */}
                  {rewards.map((reward, index) => {
                    const midAngle = (index * segmentAngle + segmentAngle / 2 - 90) * (Math.PI / 180);
                    const radius = 85;
                    const x = 50 + (radius / 2.6) * Math.cos(midAngle);
                    const y = 50 + (radius / 2.6) * Math.sin(midAngle);
                    const rot = index * segmentAngle + segmentAngle / 2;
                    
                    return (
                      <div
                        key={reward.id}
                        className="absolute flex flex-col items-center gap-0.5"
                        style={{
                          left: `${x}%`,
                          top: `${y}%`,
                          transform: `translate(-50%, -50%) rotate(${rot}deg)`,
                        }}
                      >
                        <div className="w-5 h-5 flex items-center justify-center">
                          {reward.type === 'bolt' && <BoltIcon size={18} />}
                          {reward.type === 'ton' && <TonIcon size={18} />}
                          {reward.type === 'usdt' && <UsdtIcon size={18} />}
                          {reward.type === 'booster' && <Zap className="w-4 h-4 text-white" />}
                          {reward.type === 'nothing' && <X className="w-4 h-4 text-white/70" />}
                        </div>
                        <span className="text-[10px] font-bold text-white drop-shadow-md">{reward.label}</span>
                      </div>
                    );
                  })}

                  {/* Center */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className={`w-14 h-14 rounded-full border-4 flex items-center justify-center shadow-xl ${
                      wheelType === 'usdt'
                        ? 'bg-gradient-to-br from-emerald-500 to-emerald-700 border-emerald-300'
                        : wheelType === 'pro'
                        ? 'bg-gradient-to-br from-purple-500 to-purple-700 border-purple-300'
                        : 'bg-gradient-to-br from-blue-500 to-blue-700 border-blue-300'
                    }`}>
                      {wheelType === 'usdt' ? (
                        <UsdtIcon size={20} />
                      ) : (
                        <span className="text-white font-bold text-sm">SPIN</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </FadeUp>

          {/* Result Display */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: -20 }}
                className={`p-3 rounded-xl text-center ${
                  result.type !== 'nothing' 
                    ? wheelType === 'pro'
                      ? 'bg-purple-500/10 border border-purple-500/30'
                      : 'bg-primary/10 border border-primary/30'
                    : 'bg-muted border border-border'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  {result.type === 'bolt' && <BoltIcon size={20} />}
                  {result.type === 'ton' && <TonIcon size={20} />}
                  {result.type === 'usdt' && <UsdtIcon size={20} />}
                  {result.type === 'booster' && <Zap className="w-5 h-5 text-purple-500" />}
                  {result.type === 'nothing' && <X className="w-5 h-5 text-muted-foreground" />}
                  <span className={`text-lg font-bold ${
                    result.type !== 'nothing' 
                      ? wheelType === 'usdt' ? 'text-emerald-500' : wheelType === 'pro' ? 'text-purple-500' : 'text-primary' 
                      : 'text-muted-foreground'
                  }`}>
                    {result.type === 'bolt' ? `${result.value} BOLT` : 
                     result.type === 'ton' ? `${result.value} TON` :
                     result.type === 'usdt' ? `${result.value} USDT` :
                     result.type === 'booster' ? `2x Boost ${result.value}h` : 'Try Again'}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Spin Button */}
          <FadeUp>
            {wheelType === 'usdt' ? (
              <Button
                onClick={() => setShowUsdtSpinPayment(true)}
                disabled={isSpinning || processingUsdtSpin}
                className="w-full h-12 text-base font-bold rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-700 hover:from-emerald-600 hover:to-emerald-800 text-white"
                size="lg"
              >
                {isSpinning || processingUsdtSpin ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Spinning...
                  </>
                ) : (
                  <>
                    <TonIcon size={20} className="mr-2" />
                    SPIN for 5 TON
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleSpin}
                disabled={isSpinning || currentTickets <= 0}
                className={`w-full h-12 text-base font-bold rounded-xl ${
                  wheelType === 'pro' 
                    ? 'bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 text-white' 
                    : ''
                }`}
                size="lg"
              >
                {isSpinning ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Spinning...
                  </>
                ) : currentTickets > 0 ? (
                  'SPIN NOW'
                ) : (
                  'No Tickets'
                )}
              </Button>
            )}
          </FadeUp>

          {/* 2x Multiplier Ad Button - Hide for USDT wheel */}
          {wheelType !== 'usdt' && adReady && !hasMultiplier && currentTickets > 0 && (
            <FadeUp>
              <Button
                onClick={handleWatchAdForMultiplier}
                disabled={watchingAd || adLoading || hasMultiplier}
                className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold"
              >
                {watchingAd || adLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Loading Ad...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 mr-2" />
                    Watch Ad for 2x Reward
                  </>
                )}
              </Button>
            </FadeUp>
          )}

          {/* Active Multiplier Indicator */}
          {hasMultiplier && (
            <FadeUp>
              <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-center">
                <div className="flex items-center justify-center gap-2">
                  <Zap className="w-5 h-5 text-emerald-400" />
                  <span className="font-bold text-emerald-400">2x Multiplier Active!</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Your next BOLT win will be doubled</p>
              </div>
            </FadeUp>
          )}

          {/* Action Buttons - Hide for USDT wheel */}
          {wheelType !== 'usdt' && (
          <FadeUp>
          <div className={`grid gap-2 ${wheelType === 'normal' && (freeTicketAvailable || (isVip && !vipSpinsClaimed)) ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {/* Free Ticket - Normal only */}
              {wheelType === 'normal' && (
                <Button
                  onClick={claimFreeTicket}
                  disabled={!freeTicketAvailable}
                  variant={freeTicketAvailable ? "default" : "secondary"}
                  className="h-10"
                >
                  <Gift className="w-4 h-4 mr-2" />
                  {freeTicketAvailable ? 'Free Ticket' : 'Claimed'}
                </Button>
              )}
              
              {/* VIP Daily Spins - Normal only */}
              {wheelType === 'normal' && isVip && (
                <Button
                  onClick={handleClaimVipSpins}
                  disabled={vipSpinsClaimed || vipSpinsAvailable === 0}
                  variant={!vipSpinsClaimed && vipSpinsAvailable > 0 ? "default" : "secondary"}
                  className={`h-10 ${!vipSpinsClaimed && vipSpinsAvailable > 0 ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white' : ''}`}
                >
                  <Crown className="w-4 h-4 mr-2" />
                  {vipSpinsClaimed ? 'VIP Claimed' : `VIP +${dailySpinsForTier}`}
                </Button>
              )}
              
              {/* Buy Tickets - Opens Sheet */}
              <Sheet open={showPackagesSheet} onOpenChange={setShowPackagesSheet}>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    className={`h-10 ${wheelType === 'pro' ? 'border-purple-500/30 hover:bg-purple-500/10' : ''}`}
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Buy Tickets
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="rounded-t-2xl">
                  <SheetHeader>
                    <SheetTitle className="text-center">
                      {wheelType === 'pro' ? 'PRO Ticket Packages' : 'Ticket Packages'}
                    </SheetTitle>
                  </SheetHeader>
                  <div className="grid grid-cols-2 gap-3 py-4">
                    {packages.map((pkg) => {
                      return (
                        <button
                          key={pkg.id}
                          onClick={() => handleBuyPackage(pkg)}
                          className={`p-4 rounded-xl border transition-all hover:scale-[1.02] active:scale-[0.98] ${
                            wheelType === 'pro'
                              ? 'bg-gradient-to-br from-purple-500/10 to-purple-700/10 border-purple-500/30 hover:border-purple-500/50'
                              : 'bg-card border-border hover:border-primary/50'
                          }`}
                        >
                          <div className="flex flex-col items-center gap-2">
                            <span className={`text-2xl font-bold ${wheelType === 'pro' ? 'text-purple-500' : 'text-primary'}`}>{pkg.tickets}</span>
                            <span className="text-sm font-semibold text-foreground">{pkg.priceTon} TON</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  
                </SheetContent>
              </Sheet>
            </div>
          </FadeUp>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {selectedPackage && (
        <UnifiedPaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedPackage(null);
          }}
          amount={selectedPackage.priceTon}
          description={`${selectedPackage.tickets} ${wheelType === 'pro' ? 'PRO ' : ''}Spin Tickets`}
          productType="spin_tickets"
          credits={selectedPackage.tickets}
          onSuccess={handlePurchaseSuccess}
        />
      )}

      {/* Special Guaranteed TON Payment Modal */}
      <UnifiedPaymentModal
        isOpen={showSpecialPayment}
        onClose={() => setShowSpecialPayment(false)}
        amount={SPECIAL_TON_PACKAGE.priceTon}
        description={`Guaranteed ${SPECIAL_TON_PACKAGE.guaranteedWinTon} TON Win`}
        productType="spin_tickets"
        credits={1}
        onSuccess={handleSpecialTonPurchaseSuccess}
      />

      {/* USDT Premium Wheel Payment Modal */}
      <UnifiedPaymentModal
        isOpen={showUsdtSpinPayment}
        onClose={() => setShowUsdtSpinPayment(false)}
        amount={USDT_SPIN_PRICE_TON}
        description="USDT Premium Spin - Win up to 777 USDT!"
        productType="spin_tickets"
        credits={1}
        onSuccess={handleUsdtSpinAfterPayment}
      />
    </PageWrapper>
  );
};

export default Spin;
