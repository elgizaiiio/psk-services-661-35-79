import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Flame, Gift, AlertTriangle, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTonConnectUI } from '@tonconnect/ui-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TON_PAYMENT_ADDRESS, getValidUntil, tonToNano } from '@/lib/ton-constants';

interface DailyStreakWidgetProps {
  userId: string;
  onStreakClaimed?: (tokens: number) => void;
}

const STREAK_REWARDS = [10, 20, 35, 50, 75, 100, 200]; // Rewards for days 1-7
const RESTORE_COST = 0.1; // TON

export const DailyStreakWidget = ({ userId, onStreakClaimed }: DailyStreakWidgetProps) => {
  const [streak, setStreak] = useState({ current: 0, max: 0, lastClaim: null as Date | null });
  const [canClaim, setCanClaim] = useState(false);
  const [timeUntilLoss, setTimeUntilLoss] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tonConnectUI] = useTonConnectUI();

  useEffect(() => {
    loadStreak();
    const interval = setInterval(updateTimeRemaining, 1000);
    return () => clearInterval(interval);
  }, [userId]);

  const loadStreak = async () => {
    try {
      const { data, error } = await supabase
        .from('bolt_user_streaks' as any)
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (data) {
        const streakData = data as any;
        const lastClaim = streakData.last_claim_at ? new Date(streakData.last_claim_at) : null;
        setStreak({
          current: streakData.current_streak || 0,
          max: streakData.max_streak || 0,
          lastClaim
        });
        checkCanClaim(lastClaim);
      } else {
        // Create initial streak record
        await supabase.from('bolt_user_streaks' as any).insert({
          user_id: userId,
          current_streak: 0,
          max_streak: 0
        });
        setCanClaim(true);
      }
    } catch (error) {
      console.error('Error loading streak:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkCanClaim = (lastClaim: Date | null) => {
    if (!lastClaim) {
      setCanClaim(true);
      return;
    }

    const now = new Date();
    const hoursSinceClaim = (now.getTime() - lastClaim.getTime()) / (1000 * 60 * 60);
    
    // Can claim after 20 hours (gives flexibility)
    setCanClaim(hoursSinceClaim >= 20);
  };

  const updateTimeRemaining = () => {
    if (!streak.lastClaim) return;

    const now = new Date();
    const hoursSinceClaim = (now.getTime() - streak.lastClaim.getTime()) / (1000 * 60 * 60);
    
    // Streak is lost after 48 hours
    if (hoursSinceClaim >= 48) {
      setTimeUntilLoss(null);
      return;
    }

    const hoursRemaining = 48 - hoursSinceClaim;
    const hours = Math.floor(hoursRemaining);
    const minutes = Math.floor((hoursRemaining - hours) * 60);
    
    if (hoursRemaining <= 24) {
      setTimeUntilLoss(`${hours}h ${minutes}m`);
    } else {
      setTimeUntilLoss(null);
    }
  };

  const claimStreak = async () => {
    const newStreak = streak.current + 1;
    const reward = STREAK_REWARDS[Math.min(newStreak - 1, STREAK_REWARDS.length - 1)];

    try {
      // Update streak
      await supabase
        .from('bolt_user_streaks' as any)
        .upsert({
          user_id: userId,
          current_streak: newStreak,
          max_streak: Math.max(newStreak, streak.max),
          last_claim_at: new Date().toISOString()
        });

      // Update user tokens
      const { data: userData } = await supabase
        .from('bolt_users')
        .select('token_balance')
        .eq('id', userId)
        .single();

      if (userData) {
        await supabase
          .from('bolt_users')
          .update({ token_balance: (userData.token_balance || 0) + reward })
          .eq('id', userId);
      }

      setStreak(prev => ({
        ...prev,
        current: newStreak,
        max: Math.max(newStreak, prev.max),
        lastClaim: new Date()
      }));
      setCanClaim(false);

      toast.success(`🔥 Day ${newStreak} Streak! +${reward} BOLT tokens!`);
      onStreakClaimed?.(reward);
    } catch (error) {
      console.error('Error claiming streak:', error);
      toast.error('Failed to claim streak');
    }
  };

  const restoreStreak = async () => {
    try {
      const transaction = {
        validUntil: getValidUntil(),
        messages: [{
          address: TON_PAYMENT_ADDRESS,
          amount: tonToNano(RESTORE_COST)
        }]
      };

      await tonConnectUI.sendTransaction(transaction);

      // Restore streak
      await supabase
        .from('bolt_user_streaks' as any)
        .update({
          streak_restored_at: new Date().toISOString(),
          last_claim_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      toast.success('🔥 Streak restored! Keep the fire burning!');
      loadStreak();
    } catch (error) {
      console.error('Error restoring streak:', error);
    }
  };

  const currentReward = STREAK_REWARDS[Math.min(streak.current, STREAK_REWARDS.length - 1)];
  const nextReward = STREAK_REWARDS[Math.min(streak.current + 1, STREAK_REWARDS.length - 1)];
  const progressToMax = (streak.current / 7) * 100;

  if (isLoading) {
    return (
      <Card className="p-4 bg-gradient-to-br from-orange-500/20 to-red-500/20 border-orange-500/30 animate-pulse">
        <div className="h-24" />
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="p-4 bg-gradient-to-br from-orange-500/20 to-red-500/20 border-orange-500/30 relative overflow-hidden">
        {/* Fire background effect */}
        <div className="absolute inset-0 bg-gradient-to-t from-orange-600/10 to-transparent pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
              >
                <Flame className="w-6 h-6 text-orange-500" />
              </motion.div>
              <span className="font-bold text-lg">Daily Streak</span>
            </div>
            <div className="flex items-center gap-1 bg-orange-500/20 px-3 py-1 rounded-full">
              <Flame className="w-4 h-4 text-orange-400" />
              <span className="font-bold text-orange-400">{streak.current}</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mb-3">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Day {streak.current}</span>
              <span>Day 7 (Max Reward)</span>
            </div>
            <Progress value={progressToMax} className="h-2 bg-orange-900/30" />
          </div>

          {/* Reward preview */}
          <div className="flex items-center justify-between mb-3 text-sm">
            <div className="flex items-center gap-2">
              <Gift className="w-4 h-4 text-yellow-400" />
              <span>Next: <span className="text-yellow-400 font-bold">+{nextReward} BOLT</span></span>
            </div>
            {streak.max > 0 && (
              <span className="text-muted-foreground text-xs">Best: {streak.max} days</span>
            )}
          </div>

          {/* Warning for streak loss */}
          <AnimatePresence>
            {timeUntilLoss && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-3"
              >
                <div className="flex items-center gap-2 bg-red-500/20 border border-red-500/30 rounded-lg p-2 text-sm">
                  <AlertTriangle className="w-4 h-4 text-red-400 animate-pulse" />
                  <span className="text-red-300">
                    Streak expires in <span className="font-bold">{timeUntilLoss}</span>!
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Actions */}
          <div className="flex gap-2">
            {canClaim ? (
              <Button 
                onClick={claimStreak}
                className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
              >
                <Flame className="w-4 h-4 mr-2" />
                Claim Day {streak.current + 1}
              </Button>
            ) : (
              <Button disabled className="flex-1">
                <Flame className="w-4 h-4 mr-2" />
                Come back tomorrow!
              </Button>
            )}
            
            {streak.current > 0 && timeUntilLoss && (
              <Button 
                variant="outline" 
                onClick={restoreStreak}
                className="border-orange-500/50 hover:bg-orange-500/20"
              >
                <Zap className="w-4 h-4 mr-1" />
                {RESTORE_COST} TON
              </Button>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
