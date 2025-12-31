import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useViralMining } from '@/hooks/useViralMining';
import { useTelegramBackButton } from '@/hooks/useTelegramBackButton';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Gift, Zap, Ticket, Sparkles, X, Crown, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageWrapper, FadeUp } from '@/components/ui/motion-wrapper';
import { BoltIcon, TonIcon, UsdtIcon } from '@/components/ui/currency-icons';
import { UnifiedPaymentModal } from '@/components/payment/UnifiedPaymentModal';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

interface SpinReward {
  id: string;
  label: string;
  type: 'bolt' | 'ton' | 'usdt' | 'booster' | 'nothing';
  value: number;
  probability: number;
}

interface TicketPackage {
  id: string;
  tickets: number;
  priceTon: number;
  priceStars: number;
}

// Normal Wheel Rewards - 10 items, well distributed (TON, BOLT, USDT, BOLT pattern)
const NORMAL_REWARDS: SpinReward[] = [
  { id: 'ton_1', label: '1', type: 'ton', value: 1, probability: 2 },
  { id: 'bolt_50', label: '50', type: 'bolt', value: 50, probability: 25 },
  { id: 'usdt_1', label: '1', type: 'usdt', value: 1, probability: 1.5 },
  { id: 'bolt_100', label: '100', type: 'bolt', value: 100, probability: 20 },
  { id: 'nothing', label: 'X', type: 'nothing', value: 0, probability: 25 },
  { id: 'ton_3', label: '3', type: 'ton', value: 3, probability: 0.5 },
  { id: 'bolt_200', label: '200', type: 'bolt', value: 200, probability: 15 },
  { id: 'usdt_3', label: '3', type: 'usdt', value: 3, probability: 0.5 },
  { id: 'bolt_500', label: '500', type: 'bolt', value: 500, probability: 8 },
  { id: 'mining_x2', label: '2x', type: 'booster', value: 24, probability: 2.5 },
];

// PRO Wheel Rewards - 10 items, well distributed
const PRO_REWARDS: SpinReward[] = [
  { id: 'ton_3_pro', label: '3', type: 'ton', value: 3, probability: 8 },
  { id: 'bolt_1000', label: '1K', type: 'bolt', value: 1000, probability: 20 },
  { id: 'usdt_3', label: '3', type: 'usdt', value: 3, probability: 6 },
  { id: 'bolt_2000', label: '2K', type: 'bolt', value: 2000, probability: 15 },
  { id: 'nothing', label: 'X', type: 'nothing', value: 0, probability: 18 },
  { id: 'ton_5_pro', label: '5', type: 'ton', value: 5, probability: 5 },
  { id: 'bolt_5000', label: '5K', type: 'bolt', value: 5000, probability: 12 },
  { id: 'usdt_10', label: '10', type: 'usdt', value: 10, probability: 4 },
  { id: 'bolt_10000', label: '10K', type: 'bolt', value: 10000, probability: 8 },
  { id: 'ton_10', label: '10', type: 'ton', value: 10, probability: 4 },
];

// Normal Ticket Packages - Higher prices
const NORMAL_PACKAGES: TicketPackage[] = [
  { id: 'normal_3', tickets: 3, priceTon: 0.25, priceStars: 20 },
  { id: 'normal_5', tickets: 5, priceTon: 0.4, priceStars: 32 },
  { id: 'normal_10', tickets: 10, priceTon: 0.7, priceStars: 56 },
  { id: 'normal_25', tickets: 25, priceTon: 1.5, priceStars: 120 },
];

// PRO Ticket Packages - Higher prices
const PRO_PACKAGES: TicketPackage[] = [
  { id: 'pro_3', tickets: 3, priceTon: 0.6, priceStars: 48 },
  { id: 'pro_5', tickets: 5, priceTon: 0.9, priceStars: 72 },
  { id: 'pro_10', tickets: 10, priceTon: 1.6, priceStars: 128 },
  { id: 'pro_25', tickets: 25, priceTon: 3.5, priceStars: 280 },
];

// Wheel colors - 2 colors each
const NORMAL_COLORS = ['#3B82F6', '#1E40AF']; // Blue shades
const PRO_COLORS = ['#8B5CF6', '#6D28D9']; // Purple shades

const Spin: React.FC = () => {
  const { user: tgUser, hapticFeedback } = useTelegramAuth();
  const { user, loading: miningLoading } = useViralMining(tgUser);
  useTelegramBackButton();

  const [wheelType, setWheelType] = useState<'normal' | 'pro'>('normal');
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<SpinReward | null>(null);
  const [normalTickets, setNormalTickets] = useState(0);
  const [proTickets, setProTickets] = useState(0);
  const [freeTicketAvailable, setFreeTicketAvailable] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<TicketPackage | null>(null);
  const [showPackagesSheet, setShowPackagesSheet] = useState(false);
  const [rewardApplied, setRewardApplied] = useState(false);

  const rewards = wheelType === 'normal' ? NORMAL_REWARDS : PRO_REWARDS;
  const packages = wheelType === 'normal' ? NORMAL_PACKAGES : PRO_PACKAGES;
  const wheelColors = wheelType === 'normal' ? NORMAL_COLORS : PRO_COLORS;
  const currentTickets = wheelType === 'normal' ? normalTickets : proTickets;
  const segmentAngle = 360 / rewards.length;

  // Load user tickets
  const loadTickets = useCallback(async () => {
    if (!user?.id) return;

    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('user_spin_tickets')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Error loading tickets:', error);
      return;
    }

    if (data) {
      setNormalTickets(data.tickets_count || 0);
      setProTickets((data as any).pro_tickets_count || 0);
      // Check if free ticket was already claimed today
      const alreadyClaimedToday = data.free_ticket_date === today;
      setFreeTicketAvailable(!alreadyClaimedToday);
    } else {
      // Create initial record
      const { error: insertError } = await supabase.from('user_spin_tickets').insert({
        user_id: user.id,
        tickets_count: 0,
        pro_tickets_count: 0,
        free_ticket_date: null,
      });
      if (insertError) {
        console.error('Error creating ticket record:', insertError);
      }
      setNormalTickets(0);
      setProTickets(0);
      setFreeTicketAvailable(true);
    }
  }, [user?.id]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  // Get random reward based on probability
  const getRandomReward = (): SpinReward => {
    const random = Math.random() * 100;
    let cumulative = 0;
    
    for (const reward of rewards) {
      cumulative += reward.probability;
      if (random <= cumulative) {
        return reward;
      }
    }
    return rewards[0];
  };

  // Apply reward to user
  const applyReward = async (reward: SpinReward) => {
    if (!user?.id) return;

    try {
      await supabase.from('spin_history').insert({
        user_id: user.id,
        reward_type: reward.id,
        reward_amount: reward.value,
        wheel_type: wheelType,
      });

      if (reward.type === 'bolt') {
        await supabase
          .from('bolt_users')
          .update({ token_balance: (user.token_balance || 0) + reward.value })
          .eq('id', user.id);
      } else if (reward.type === 'usdt') {
        await supabase
          .from('bolt_users')
          .update({ usdt_balance: ((user as any).usdt_balance || 0) + reward.value })
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

  // Handle spin
  const handleSpin = async () => {
    if (!user?.id || isSpinning || currentTickets <= 0) return;

    // Reset reward applied flag
    setRewardApplied(false);

    // Deduct ticket based on wheel type
    if (wheelType === 'normal') {
      await supabase
        .from('user_spin_tickets')
        .update({ tickets_count: normalTickets - 1 })
        .eq('user_id', user.id);
      setNormalTickets(prev => prev - 1);
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
    const totalRotation = rotation + (fullSpins * 360) + targetAngle + Math.random() * (segmentAngle * 0.3);
    
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
        await applyReward(reward);
        toast.success(`You won ${reward.label} ${reward.type.toUpperCase()}!`);
      } else {
        toast.info('Better luck next time!');
      }
    }, 5000);
  };

  // Handle package purchase
  const handleBuyPackage = (pkg: TicketPackage) => {
    setSelectedPackage(pkg);
    setShowPackagesSheet(false);
    setShowPaymentModal(true);
  };

  const handlePurchaseSuccess = () => {
    if (!selectedPackage) return;
    
    if (wheelType === 'normal') {
      setNormalTickets(prev => prev + selectedPackage.tickets);
    } else {
      setProTickets(prev => prev + selectedPackage.tickets);
    }
    toast.success(`${selectedPackage.tickets} tickets added!`);
    setSelectedPackage(null);
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

          {/* Header with Tickets Count */}
          <FadeUp>
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-bold text-foreground">Lucky Spin</h1>
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold ${
                wheelType === 'pro' 
                  ? 'bg-amber-500/20 text-amber-500' 
                  : 'bg-primary/20 text-primary'
              }`}>
                <Ticket className="w-4 h-4" />
                <span>{currentTickets}</span>
              </div>
            </div>
          </FadeUp>

          {/* Wheel Type Tabs */}
          <FadeUp>
            <Tabs value={wheelType} onValueChange={(v) => setWheelType(v as 'normal' | 'pro')} className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-10">
                <TabsTrigger value="normal" className="text-sm font-medium">
                  Normal
                </TabsTrigger>
                <TabsTrigger value="pro" className="text-sm font-medium">
                  PRO
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
                  wheelType === 'pro' ? 'border-t-purple-500' : 'border-t-primary'
                } drop-shadow-lg`} />
              </div>

              {/* Wheel Container - Extra Large */}
              <div className="relative w-[340px] h-[340px]">
                <motion.div
                  className="relative w-full h-full rounded-full shadow-2xl"
                  style={{ 
                    boxShadow: wheelType === 'pro'
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
                      wheelType === 'pro'
                        ? 'bg-gradient-to-br from-purple-500 to-purple-700 border-purple-300'
                        : 'bg-gradient-to-br from-blue-500 to-blue-700 border-blue-300'
                    }`}>
                      <span className="text-white font-bold text-sm">SPIN</span>
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
                      ? wheelType === 'pro' ? 'text-purple-500' : 'text-primary' 
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
          </FadeUp>

          {/* Action Buttons */}
          <FadeUp>
            <div className={`grid gap-2 ${wheelType === 'normal' ? 'grid-cols-2' : 'grid-cols-1'}`}>
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
                    {packages.map((pkg) => (
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
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="text-sm font-semibold text-foreground">{pkg.priceTon} TON</span>
                            <span className="text-xs text-muted-foreground">
                              {pkg.priceStars} Stars
                            </span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </FadeUp>
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
          starsOverride={selectedPackage.priceStars}
          onSuccess={handlePurchaseSuccess}
        />
      )}
    </PageWrapper>
  );
};

export default Spin;
