import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useDailyStreak } from '@/hooks/useDailyStreak';
import { toast } from 'sonner';

const DailyStreakCard = () => {
  const {
    currentStreak,
    canClaim,
    loading,
    claiming,
    claimDailyReward,
    getNextReward,
    streakRewards,
  } = useDailyStreak();

  const handleClaim = async () => {
    const reward = await claimDailyReward();
    if (reward) {
      toast.success(`Day ${(currentStreak % 7) + 1} reward claimed: +${reward} BOLT`);
    } else {
      toast.error('Failed to claim reward');
    }
  };

  if (loading) {
    return (
      <Card className="p-6 border-border">
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </Card>
    );
  }

  const nextDay = (currentStreak % 7) + 1;

  return (
    <Card className="p-5 border-border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-base font-semibold text-foreground">Daily Bonus</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {canClaim ? 'Claim your daily reward' : 'Come back tomorrow'}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-foreground">{currentStreak}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Day Streak</p>
        </div>
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1.5 mb-5">
        {streakRewards.map((reward, index) => {
          const day = index + 1;
          const isCompleted = day <= (currentStreak % 7 === 0 && currentStreak > 0 ? 7 : currentStreak % 7);
          const isCurrent = day === nextDay && canClaim;
          const isPast = day < nextDay || (currentStreak > 0 && currentStreak % 7 === 0);

          return (
            <motion.div
              key={day}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className={`
                relative p-2 rounded-lg text-center transition-all
                ${isCurrent 
                  ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-background' 
                  : isPast || isCompleted
                    ? 'bg-muted/50 text-muted-foreground'
                    : 'bg-muted/20 text-muted-foreground/50'
                }
              `}
            >
              <p className="text-[9px] font-medium uppercase tracking-wider opacity-70">Day</p>
              <p className="text-sm font-bold">{day}</p>
              <p className="text-[9px] mt-0.5">+{reward}</p>
              
              {(isPast || isCompleted) && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-lg">
                  <span className="text-xs font-medium text-muted-foreground">Done</span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Claim Button */}
      <Button
        onClick={handleClaim}
        disabled={!canClaim || claiming}
        className="w-full h-11 text-sm font-semibold bg-white text-black hover:bg-white/90 disabled:bg-muted disabled:text-muted-foreground"
      >
        {claiming ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : canClaim ? (
          `Claim Day ${nextDay} - +${getNextReward()} BOLT`
        ) : (
          'Already Claimed Today'
        )}
      </Button>

      {/* Info */}
      <p className="text-[10px] text-muted-foreground text-center mt-3">
        Login daily to maintain your streak. Missing a day resets progress.
      </p>
    </Card>
  );
};

export default DailyStreakCard;
