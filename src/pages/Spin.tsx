import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useViralMining } from '@/hooks/useViralMining';
import { useTelegramBackButton } from '@/hooks/useTelegramBackButton';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Gift, Star, Zap, Clock, Trophy, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageWrapper, StaggerContainer, FadeUp } from '@/components/ui/motion-wrapper';
import { BoltIcon, TonIcon, UsdtIcon } from '@/components/ui/currency-icons';

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
  { id: 'nothing', label: 'Try Again', type: 'nothing', value: 0, probability: 25, color: '#374151', icon: <Gift className="w-6 h-6" /> },
  { id: 'bolt_100', label: '100 BOLT', type: 'bolt', value: 100, probability: 20, color: '#F59E0B', icon: <BoltIcon size={24} /> },
  { id: 'bolt_500', label: '500 BOLT', type: 'bolt', value: 500, probability: 15, color: '#F59E0B', icon: <BoltIcon size={24} /> },
  { id: 'bolt_1000', label: '1K BOLT', type: 'bolt', value: 1000, probability: 10, color: '#F59E0B', icon: <BoltIcon size={24} /> },
  { id: 'ton_1', label: '1 TON', type: 'ton', value: 1, probability: 8, color: '#0098EA', icon: <TonIcon size={24} /> },
  { id: 'ton_3', label: '3 TON', type: 'ton', value: 3, probability: 5, color: '#0098EA', icon: <TonIcon size={24} /> },
  { id: 'ton_5', label: '5 TON', type: 'ton', value: 5, probability: 2, color: '#0098EA', icon: <TonIcon size={24} /> },
  { id: 'usdt_1', label: '1 USDT', type: 'usdt', value: 1, probability: 6, color: '#26A17B', icon: <UsdtIcon size={24} /> },
  { id: 'usdt_5', label: '5 USDT', type: 'usdt', value: 5, probability: 4, color: '#26A17B', icon: <UsdtIcon size={24} /> },
  { id: 'usdt_10', label: '10 USDT', type: 'usdt', value: 10, probability: 2, color: '#26A17B', icon: <UsdtIcon size={24} /> },
  { id: 'mining_x2', label: 'Mining x2', type: 'booster', value: 24, probability: 2, color: '#8B5CF6', icon: <Zap className="w-6 h-6" /> },
  { id: 'task_x2', label: 'Task x2', type: 'booster', value: 24, probability: 1, color: '#EC4899', icon: <Star className="w-6 h-6" /> },
];

const SPIN_COST_BOLT = 100;
const SPIN_COST_TON = 0.5;

const Spin: React.FC = () => {
  const { user: tgUser, hapticFeedback } = useTelegramAuth();
  const { user, loading: miningLoading } = useViralMining(tgUser);
  useTelegramBackButton();

  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<SpinReward | null>(null);
  const [freeSpinAvailable, setFreeSpinAvailable] = useState(false);
  const spinRef = useRef<HTMLDivElement>(null);

  const segmentAngle = 360 / SPIN_REWARDS.length;

  // Check free spin availability
  const checkFreeSpin = useCallback(async () => {
    if (!user?.id) return;
    
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('daily_spins')
      .select('*')
      .eq('user_id', user.id)
      .eq('spin_date', today)
      .maybeSingle();

    setFreeSpinAvailable(!data?.free_spin_used);
  }, [user?.id]);

  useEffect(() => {
    checkFreeSpin();
  }, [checkFreeSpin]);

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
    return SPIN_REWARDS[0]; // Fallback to "Try Again"
  };

  // Apply reward to user
  const applyReward = async (reward: SpinReward) => {
    if (!user?.id) return;

    try {
      // Save to spin history
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

  // Handle spin
  const handleSpin = async (isFree: boolean) => {
    if (!user?.id || isSpinning) return;

    // Check payment for paid spin
    if (!isFree) {
      if ((user.token_balance || 0) < SPIN_COST_BOLT) {
        toast.error('Not enough BOLT tokens');
        return;
      }

      // Deduct cost
      await supabase
        .from('bolt_users')
        .update({ token_balance: user.token_balance - SPIN_COST_BOLT })
        .eq('id', user.id);
    } else {
      // Mark free spin as used
      const today = new Date().toISOString().split('T')[0];
      await supabase.from('daily_spins').upsert({
        user_id: user.id,
        spin_date: today,
        free_spin_used: true,
      }, { onConflict: 'user_id,spin_date' });
      setFreeSpinAvailable(false);
    }

    hapticFeedback.impact('heavy');
    setIsSpinning(true);
    setResult(null);

    const reward = getRandomReward();
    const rewardIndex = SPIN_REWARDS.findIndex(r => r.id === reward.id);
    
    // Calculate rotation: multiple full spins + landing on reward segment
    const targetAngle = 360 - (rewardIndex * segmentAngle) - (segmentAngle / 2);
    const fullSpins = 5 + Math.floor(Math.random() * 3); // 5-7 full spins
    const totalRotation = rotation + (fullSpins * 360) + targetAngle + Math.random() * (segmentAngle * 0.3);
    
    setRotation(totalRotation);

    // Wait for spin to complete
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
      
      <div className="max-w-md mx-auto px-5 pt-16">
        <StaggerContainer className="space-y-6">
          {/* Header */}
          <FadeUp>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-foreground">Lucky Spin</h1>
              <p className="text-sm text-muted-foreground mt-1">Spin to win amazing rewards</p>
            </div>
          </FadeUp>

          {/* Spin Wheel */}
          <FadeUp>
            <div className="relative flex items-center justify-center py-8">
              {/* Pointer */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
                <div className="w-0 h-0 border-l-[15px] border-r-[15px] border-t-[25px] border-l-transparent border-r-transparent border-t-primary drop-shadow-lg" />
              </div>

              {/* Wheel */}
              <motion.div
                ref={spinRef}
                className="relative w-72 h-72 rounded-full border-4 border-primary shadow-2xl"
                style={{
                  background: `conic-gradient(${SPIN_REWARDS.map((r, i) => 
                    `${r.color} ${i * segmentAngle}deg ${(i + 1) * segmentAngle}deg`
                  ).join(', ')})`,
                }}
                animate={{ rotate: rotation }}
                transition={{ 
                  duration: 5, 
                  ease: [0.17, 0.67, 0.12, 0.99],
                }}
              >
                {/* Segment Labels */}
                {SPIN_REWARDS.map((reward, index) => {
                  const angle = index * segmentAngle + segmentAngle / 2;
                  return (
                    <div
                      key={reward.id}
                      className="absolute left-1/2 top-1/2 origin-left"
                      style={{
                        transform: `rotate(${angle}deg) translateY(-50%)`,
                        width: '120px',
                      }}
                    >
                      <div className="flex items-center gap-1 text-white text-xs font-medium pl-6 drop-shadow-md">
                        {reward.icon}
                        <span className="truncate">{reward.label}</span>
                      </div>
                    </div>
                  );
                })}

                {/* Center Circle */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-background border-4 border-primary flex items-center justify-center shadow-inner">
                    <Trophy className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </motion.div>
            </div>
          </FadeUp>

          {/* Result Display */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className={`p-4 rounded-xl text-center ${
                  result.type !== 'nothing' 
                    ? 'bg-primary/10 border border-primary/30' 
                    : 'bg-muted border border-border'
                }`}
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  {result.icon}
                  <span className={`text-xl font-bold ${result.type !== 'nothing' ? 'text-primary' : 'text-muted-foreground'}`}>
                    {result.label}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {result.type !== 'nothing' ? 'Congratulations!' : 'Try again!'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Spin Buttons */}
          <FadeUp>
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => handleSpin(true)}
                disabled={isSpinning || !freeSpinAvailable}
                className="h-14 font-semibold"
                variant={freeSpinAvailable ? "default" : "secondary"}
              >
                <Gift className="w-5 h-5 mr-2" />
                {freeSpinAvailable ? 'Free Spin' : 'Used'}
              </Button>
              
              <Button
                onClick={() => handleSpin(false)}
                disabled={isSpinning || (user?.token_balance || 0) < SPIN_COST_BOLT}
                variant="outline"
                className="h-14 font-semibold"
              >
                <BoltIcon size={20} />
                <span className="ml-2">{SPIN_COST_BOLT} BOLT</span>
              </Button>
            </div>
          </FadeUp>

          {/* Balance Info */}
          <FadeUp>
            <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border">
              <div className="flex items-center gap-2">
                <BoltIcon size={24} />
                <span className="text-sm text-muted-foreground">Your Balance</span>
              </div>
              <span className="font-bold text-foreground">{(user?.token_balance || 0).toLocaleString()} BOLT</span>
            </div>
          </FadeUp>

        </StaggerContainer>
      </div>
    </PageWrapper>
  );
};

export default Spin;
