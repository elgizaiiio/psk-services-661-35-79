import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useViralMining } from '@/hooks/useViralMining';
import { useTelegramBackButton } from '@/hooks/useTelegramBackButton';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Gift, Star, Zap, Ticket, Plus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageWrapper, StaggerContainer, FadeUp } from '@/components/ui/motion-wrapper';
import { BoltIcon, TonIcon, UsdtIcon } from '@/components/ui/currency-icons';
import { UnifiedPaymentModal } from '@/components/payment/UnifiedPaymentModal';

interface SpinReward {
  id: string;
  label: string;
  type: 'bolt' | 'ton' | 'usdt' | 'booster' | 'nothing';
  value: number;
  probability: number;
  color: string;
  icon: React.ReactNode;
}

const SPIN_REWARDS: SpinReward[] = [
  { id: 'bolt_100', label: '100', type: 'bolt', value: 100, probability: 22, color: '#F59E0B', icon: <BoltIcon size={14} /> },
  { id: 'nothing', label: 'X', type: 'nothing', value: 0, probability: 20, color: '#374151', icon: <Gift className="w-3 h-3" /> },
  { id: 'bolt_500', label: '500', type: 'bolt', value: 500, probability: 15, color: '#EAB308', icon: <BoltIcon size={14} /> },
  { id: 'ton_1', label: '1', type: 'ton', value: 1, probability: 10, color: '#0EA5E9', icon: <TonIcon size={14} /> },
  { id: 'bolt_1000', label: '1K', type: 'bolt', value: 1000, probability: 10, color: '#D97706', icon: <BoltIcon size={14} /> },
  { id: 'usdt_1', label: '1', type: 'usdt', value: 1, probability: 8, color: '#10B981', icon: <UsdtIcon size={14} /> },
  { id: 'ton_3', label: '3', type: 'ton', value: 3, probability: 6, color: '#0284C7', icon: <TonIcon size={14} /> },
  { id: 'usdt_5', label: '5', type: 'usdt', value: 5, probability: 5, color: '#059669', icon: <UsdtIcon size={14} /> },
  { id: 'mining_x2', label: '2x', type: 'booster', value: 24, probability: 3, color: '#8B5CF6', icon: <Zap className="w-3 h-3" /> },
  { id: 'ton_5', label: '5', type: 'ton', value: 5, probability: 1, color: '#0369A1', icon: <TonIcon size={14} /> },
];

const TICKET_PRICE_TON = 0.1;
const TICKETS_PER_PURCHASE = 5;

const Spin: React.FC = () => {
  const { user: tgUser, hapticFeedback } = useTelegramAuth();
  const { user, loading: miningLoading } = useViralMining(tgUser);
  useTelegramBackButton();

  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<SpinReward | null>(null);
  const [ticketsCount, setTicketsCount] = useState(0);
  const [freeTicketAvailable, setFreeTicketAvailable] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const segmentAngle = 360 / SPIN_REWARDS.length;

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
      setTicketsCount(data.tickets_count);
      setFreeTicketAvailable(data.free_ticket_date !== today);
    } else {
      // Create initial record
      await supabase.from('user_spin_tickets').insert({
        user_id: user.id,
        tickets_count: 0,
        free_ticket_date: null,
      });
      setTicketsCount(0);
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
    
    for (const reward of SPIN_REWARDS) {
      cumulative += reward.probability;
      if (random <= cumulative) {
        return reward;
      }
    }
    return SPIN_REWARDS[0];
  };

  // Apply reward to user
  const applyReward = async (reward: SpinReward) => {
    if (!user?.id) return;

    try {
      await supabase.from('spin_history').insert({
        user_id: user.id,
        reward_type: reward.id,
        reward_amount: reward.value,
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
        const boosterType = reward.id === 'mining_x2' ? 'mining_x2' : 'task_x2';
        const expiresAt = new Date(Date.now() + reward.value * 60 * 60 * 1000);
        
        await supabase.from('user_boosters').insert({
          user_id: user.id,
          booster_type: boosterType,
          expires_at: expiresAt.toISOString(),
        });
      }
    } catch (error) {
      console.error('Error applying reward:', error);
    }
  };

  // Claim free daily ticket
  const claimFreeTicket = async () => {
    if (!user?.id || !freeTicketAvailable) return;

    const today = new Date().toISOString().split('T')[0];
    
    await supabase
      .from('user_spin_tickets')
      .update({ 
        tickets_count: ticketsCount + 1,
        free_ticket_date: today,
      })
      .eq('user_id', user.id);

    setTicketsCount(prev => prev + 1);
    setFreeTicketAvailable(false);
    hapticFeedback.notification('success');
    toast.success('Free ticket claimed!');
  };

  // Handle spin
  const handleSpin = async () => {
    if (!user?.id || isSpinning || ticketsCount <= 0) return;

    // Deduct ticket
    await supabase
      .from('user_spin_tickets')
      .update({ tickets_count: ticketsCount - 1 })
      .eq('user_id', user.id);

    setTicketsCount(prev => prev - 1);
    hapticFeedback.impact('heavy');
    setIsSpinning(true);
    setResult(null);

    const reward = getRandomReward();
    const rewardIndex = SPIN_REWARDS.findIndex(r => r.id === reward.id);
    
    const targetAngle = 360 - (rewardIndex * segmentAngle) - (segmentAngle / 2);
    const fullSpins = 5 + Math.floor(Math.random() * 3);
    const totalRotation = rotation + (fullSpins * 360) + targetAngle + Math.random() * (segmentAngle * 0.3);
    
    setRotation(totalRotation);

    setTimeout(async () => {
      setIsSpinning(false);
      setResult(reward);
      hapticFeedback.notification('success');

      if (reward.type !== 'nothing') {
        await applyReward(reward);
        toast.success(`You won ${reward.label}!`);
      } else {
        toast.info('Better luck next time!');
      }
    }, 5000);
  };

  const handleBuyTicketsSuccess = () => {
    setTicketsCount(prev => prev + TICKETS_PER_PURCHASE);
    toast.success(`${TICKETS_PER_PURCHASE} tickets added!`);
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
    <PageWrapper className="min-h-screen bg-background pb-28">
      <Helmet><title>Lucky Spin</title></Helmet>
      
      <div className="max-w-md mx-auto px-5 pt-8">
        <StaggerContainer className="space-y-4">

          {/* Tickets Display */}
          <FadeUp>
            <div className="flex items-center justify-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border">
                <Ticket className="w-5 h-5 text-primary" />
                <span className="text-lg font-bold text-foreground">{ticketsCount}</span>
                <span className="text-sm text-muted-foreground">tickets</span>
              </div>
            </div>
          </FadeUp>

          {/* Spin Wheel */}
          <FadeUp>
            <div className="relative flex items-center justify-center py-6">
              {/* Pointer */}
              <div className="absolute -top-0 left-1/2 -translate-x-1/2 z-20">
                <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-t-[20px] border-l-transparent border-r-transparent border-t-primary drop-shadow-lg" />
              </div>

              {/* Wheel Container - Larger */}
              <div className="relative w-[300px] h-[300px]">
                <motion.div
                  className="relative w-full h-full rounded-full shadow-2xl overflow-hidden"
                  style={{ boxShadow: '0 0 0 6px hsl(var(--primary)), 0 0 30px hsl(var(--primary)/0.4)' }}
                  animate={{ rotate: rotation }}
                  transition={{ duration: 5, ease: [0.17, 0.67, 0.12, 0.99] }}
                >
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    {SPIN_REWARDS.map((reward, index) => {
                      const startAngle = index * segmentAngle;
                      const endAngle = (index + 1) * segmentAngle;
                      const startRad = (startAngle - 90) * (Math.PI / 180);
                      const endRad = (endAngle - 90) * (Math.PI / 180);
                      
                      const x1 = 50 + 50 * Math.cos(startRad);
                      const y1 = 50 + 50 * Math.sin(startRad);
                      const x2 = 50 + 50 * Math.cos(endRad);
                      const y2 = 50 + 50 * Math.sin(endRad);
                      
                      const pathD = `M 50 50 L ${x1} ${y1} A 50 50 0 0 1 ${x2} ${y2} Z`;
                      
                      const midAngle = (startAngle + segmentAngle / 2 - 90) * (Math.PI / 180);
                      const iconX = 50 + 28 * Math.cos(midAngle);
                      const iconY = 50 + 28 * Math.sin(midAngle);
                      const textX = 50 + 40 * Math.cos(midAngle);
                      const textY = 50 + 40 * Math.sin(midAngle);
                      const rot = startAngle + segmentAngle / 2;
                      
                      // Icon character based on type
                      const iconChar = reward.type === 'bolt' ? '⚡' : 
                                       reward.type === 'ton' ? '💎' : 
                                       reward.type === 'usdt' ? '💵' : 
                                       reward.type === 'booster' ? '🚀' : '❌';
                      
                      return (
                        <g key={reward.id}>
                          <path d={pathD} fill={reward.color} stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
                          <text x={iconX} y={iconY} textAnchor="middle" dominantBaseline="middle" fontSize="6" transform={`rotate(${rot}, ${iconX}, ${iconY})`}>
                            {iconChar}
                          </text>
                          <text x={textX} y={textY} textAnchor="middle" dominantBaseline="middle" transform={`rotate(${rot}, ${textX}, ${textY})`} fill="white" fontSize="5" fontWeight="bold">
                            {reward.label}
                          </text>
                        </g>
                      );
                    })}
                  </svg>

                  {/* Center */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-14 h-14 rounded-full bg-background border-4 border-primary flex items-center justify-center shadow-xl">
                      <span className="text-xl">🎰</span>
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
                className={`p-4 rounded-xl text-center ${
                  result.type !== 'nothing' 
                    ? 'bg-primary/10 border border-primary/30' 
                    : 'bg-muted border border-border'
                }`}
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  {result.icon}
                  <span className={`text-xl font-bold ${result.type !== 'nothing' ? 'text-primary' : 'text-muted-foreground'}`}>
                    {result.type === 'bolt' ? `${result.value} BOLT` : 
                     result.type === 'ton' ? `${result.value} TON` :
                     result.type === 'usdt' ? `${result.value} USDT` :
                     result.type === 'booster' ? '2x Boost' : 'Try Again'}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {result.type !== 'nothing' ? 'Congratulations!' : 'Better luck next time!'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Spin Button */}
          <FadeUp>
            <Button
              onClick={handleSpin}
              disabled={isSpinning || ticketsCount <= 0}
              className="w-full h-14 text-lg font-bold rounded-xl"
              size="lg"
            >
              {isSpinning ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Spinning...
                </>
              ) : ticketsCount > 0 ? (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  SPIN NOW
                </>
              ) : (
                'No Tickets'
              )}
            </Button>
          </FadeUp>

          {/* Action Buttons */}
          <FadeUp>
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={claimFreeTicket}
                disabled={!freeTicketAvailable}
                variant={freeTicketAvailable ? "default" : "secondary"}
                className="h-12 font-semibold"
              >
                <Gift className="w-5 h-5 mr-2" />
                {freeTicketAvailable ? 'Free Ticket' : 'Claimed'}
              </Button>
              
              <Button
                onClick={() => setShowPaymentModal(true)}
                variant="outline"
                className="h-12 font-semibold"
              >
                <Plus className="w-5 h-5 mr-2" />
                Buy {TICKETS_PER_PURCHASE} Tickets
              </Button>
            </div>
          </FadeUp>

          {/* Price Info */}
          <FadeUp>
            <p className="text-xs text-center text-muted-foreground">
              {TICKETS_PER_PURCHASE} tickets for {TICKET_PRICE_TON} TON or 30 Stars
            </p>
          </FadeUp>
        </StaggerContainer>
      </div>

      {/* Payment Modal */}
      <UnifiedPaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        amount={TICKET_PRICE_TON}
        description={`${TICKETS_PER_PURCHASE} Spin Tickets`}
        productType="spin_tickets"
        credits={TICKETS_PER_PURCHASE}
        onSuccess={handleBuyTicketsSuccess}
      />
    </PageWrapper>
  );
};

export default Spin;
